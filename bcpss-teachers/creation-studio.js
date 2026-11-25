// BCPSS Teacher Studio — Teacher Creation Studio
// Dead-simple 3-step classroom resource creator:
//   Step 1: What are you teaching? (auto-filled from unit + optional lesson focus)
//   Step 2: What do you want to make? (Interactive Activity | Worksheet / Printable | Presentation / Projector)
//   Step 3: Create & Quick-Adjust (Cognitive Complexity, WIDA Support, Item Count, Visual Models,
//           Inline Edit, Regenerate Item, Format Switcher, Student/Teacher View, Print/PDF, Standalone HTML, Save)

import { keepView } from "./keep-view.js";
import { unitConceptVisual } from "./vocab-visuals.js";

const STORAGE_KEY = "bcpssTeachers:v1:savedCreations";
const stateMap = new WeakMap();

const RESOURCE_TYPES = [
  {
    key: "interactive",
    title: "Interactive Activity",
    desc: "Self-checking digital classroom task with WIDA supports and instant feedback.",
  },
  {
    key: "worksheet",
    title: "Worksheet / Printable",
    desc: "Publisher-quality student handout with generous response space and separate Answer Key.",
  },
  {
    key: "presentation",
    title: "Presentation / Projector",
    desc: "High-contrast slide sequence for whole-class modeling and partner talk.",
  },
];

const INTERACTION_FORMATS = [
  "Matching",
  "Sorting",
  "Cloze",
  "Sentence Construction",
  "Evidence Selection",
  "Misconception Check",
];

const COMPLEXITY_LEVELS = [
  { key: "Core", label: "Core Standard Rigor" },
  { key: "Extended", label: "Extended Reasoning" },
  { key: "Transfer", label: "Cross-Context Transfer" },
];

export function escHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safeParseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function widaLabel(tier) {
  if (tier === "1_2") return "Levels 1–2 (Entering / Emerging)";
  if (tier === "5_6") return "Levels 5–6 (Bridging / Reaching)";
  return "Levels 3–4 (Developing / Expanding)";
}

function loadSavedResources() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedResources(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // Ignore storage quota errors
  }
}

function generateSingleItem({ unit, connection, blueprint, format, complexity, wida, index, seedOffset = 0 }) {
  const vocab = safeParseJson(connection?.tier2_tier3_vocab, []);
  const vocabList = Array.isArray(vocab) ? vocab : [];
  const v = vocabList[(index + seedOffset) % Math.max(1, vocabList.length)] || {};
  const term = String(v.word || v.term || unit.subject || "concept").trim();
  const def = String(v.student_friendly_def || v.definition || `key idea in ${unit.unit_title}`).trim();
  const klu = blueprint?.wida_klu || unit.primary_klu || "Explain";
  const misc = safeParseJson(connection?.common_language_misconception, {});
  const miscPattern = String(misc?.misconception_pattern || `leaving out the academic reason for ${term}`).trim();

  const supportNote =
    wida === "1_2"
      ? `Word bank: ${term}, because, shows · Frame: "___ shows ___ because ___."`
      : wida === "5_6"
        ? `Challenge: integrate "${term}" with a precise connector (consequently, whereas, furthermore).`
        : `Frame: "In ${unit.unit_title}, ${term} matters because ___."`;

  const rigorSuffix =
    complexity === "Transfer"
      ? " Apply this reasoning to a new real-world example."
      : complexity === "Extended"
        ? " Justify your thinking with two pieces of evidence."
        : "";

  if (format === "Matching") {
    return {
      prompt: `Match the unit term "${term}" to its accurate ${unit.subject} meaning and explain one connection.${rigorSuffix}`,
      support: supportNote,
      answer: `${term} → ${def}`,
      lookFor: `Student accurately connects "${term}" to its ${unit.subject} meaning without relying on everyday slang.`,
    };
  }
  if (format === "Sorting") {
    return {
      prompt: `Sort whether this statement is a Strong Example or Non-Example of "${term}" in ${unit.unit_title}: "${def}". Explain why.${rigorSuffix}`,
      support: supportNote,
      answer: `Strong Example — accurately reflects "${term}" (${def}).`,
      lookFor: `Student uses WIDA ${klu} language to justify the category choice.`,
    };
  }
  if (format === "Cloze") {
    return {
      prompt: `Complete the academic sentence: "In ${unit.unit_title}, _____ helps us ${klu.toLowerCase()} ${def.toLowerCase()}."${rigorSuffix}`,
      support: supportNote,
      answer: term,
      lookFor: `Student inserts "${term}" and reads the complete sentence for academic accuracy.`,
    };
  }
  if (format === "Evidence Selection") {
    return {
      prompt: `Select the strongest piece of evidence from ${unit.unit_title} that supports a claim about "${term}", then write one sentence linking evidence to claim.${rigorSuffix}`,
      support: supportNote,
      answer: `Model link: The evidence about ${term} proves the claim because ${def}.`,
      lookFor: `Student cites specific unit evidence rather than a general opinion.`,
    };
  }
  if (format === "Misconception Check") {
    return {
      prompt: `A classmate made this common error: "${miscPattern}". Explain what is missing and rewrite the response using "${term}".${rigorSuffix}`,
      support: supportNote,
      answer: `Revised response explicitly connects "${term}" (${def}) with a clear causal or logical connector.`,
      lookFor: `Student identifies the thinking gap and supplies a complete academic revision.`,
    };
  }
  // Sentence Construction (default)
  return {
    prompt: `Construct a complete ${unit.subject} explanation for "${term}" using a WIDA ${klu} connector.${rigorSuffix}`,
    support: supportNote,
    answer: `Model sentence: Because ${term} means ${def}, we can use it to ${klu.toLowerCase()} the main idea of ${unit.unit_title}.`,
    lookFor: `Complete sentence with "${term}", a WIDA ${klu} connector, and grade-level ${unit.subject} precision.`,
  };
}

function buildResourceDraft({ unit, connection, blueprint, type, focus, complexity, wida, itemCount, format, includeVisuals }) {
  const standards = Array.isArray(unit.core_standards)
    ? unit.core_standards
    : String(unit.core_standards || "")
        .split(/[,;|]+/)
        .map((s) => s.trim())
        .filter(Boolean);
  const typeObj = RESOURCE_TYPES.find((t) => t.key === type) || RESOURCE_TYPES[0];
  const focusLabel = focus.trim() ? ` — ${focus.trim()}` : "";
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(
      generateSingleItem({
        unit,
        connection,
        blueprint,
        format,
        complexity,
        wida,
        index: i,
      }),
    );
  }
  return {
    id: `res-${Date.now()}`,
    unitId: unit.id,
    grade: unit.grade,
    subject: unit.subject,
    unitTitle: `Unit ${unit.unit_number}: ${unit.unit_title}`,
    standards,
    klu: blueprint?.wida_klu || unit.primary_klu || "Explain",
    type,
    typeTitle: typeObj.title,
    title: `${typeObj.title}: ${unit.unit_title}${focusLabel}`,
    directions:
      type === "presentation"
        ? `Project each prompt for whole-class modeling, partner rehearsal, and academic writing (${widaLabel(wida)}).`
        : type === "worksheet"
          ? `Read each prompt carefully. Use the WIDA ${widaLabel(wida)} language supports as needed while keeping grade-level ${unit.subject} accuracy.`
          : `Complete each interactive prompt below. Check your academic language and revise to make your reasoning clearer.`,
    complexity,
    wida,
    format,
    includeVisuals,
    vocabTerms: (Array.isArray(connection?.tier2_tier3_vocab) ? connection.tier2_tier3_vocab : [])
      .map((v) => String(v?.term || "").trim())
      .filter(Boolean),
    items,
  };
}

/**
 * Generates a real, self-contained, accessible offline HTML file with all teacher-authored text safely escaped against XSS.
 */
export function buildStandaloneHtml(res) {
  const safeTitle = escHtml(res.title);
  const safeDirections = escHtml(res.directions);
  const safeUnit = escHtml(`${res.grade === "K" ? "Kindergarten" : `Grade ${res.grade}`} · ${res.subject} · ${res.unitTitle}`);
  const safeStandards = (res.standards || []).map((s) => `<span class="chip">${escHtml(s)}</span>`).join(" ");
  const visualSvg = res.includeVisuals ? unitConceptVisual(res.vocabTerms, res.subject) : "";

  const studentItemsHtml = (res.items || [])
    .map(
      (item, idx) => `
      <article class="item">
        <h2>Item ${idx + 1} · ${escHtml(res.format)}</h2>
        <p class="prompt">${escHtml(item.prompt)}</p>
        <p class="support"><strong>Language Support:</strong> ${escHtml(item.support)}</p>
        <label for="resp-${idx}">Your Response:</label>
        <textarea id="resp-${idx}" rows="3" placeholder="Write your response here…"></textarea>
      </article>`,
    )
    .join("\n");

  const teacherKeyHtml = (res.items || [])
    .map(
      (item, idx) => `
      <li>
        <strong>Item ${idx + 1}:</strong> ${escHtml(item.answer)}
        <br><span class="lookfor"><em>Look-For:</em> ${escHtml(item.lookFor)}</span>
      </li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<style>
  :root { --bg:#faf9f6; --surface:#ffffff; --ink:#182230; --ink2:#475467; --brand:#1e3a5f; --accent:#0f766e; --line:#e4e0d8; }
  * { box-sizing: border-box; }
  body { margin:0; padding:1.5rem; background:var(--bg); color:var(--ink); font:16px/1.6 system-ui,-apple-system,sans-serif; }
  main { max-width:52rem; margin:0 auto; background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:1.75rem; }
  h1 { margin:0 0 0.35rem; color:var(--brand); font-size:1.65rem; }
  .meta { color:var(--ink2); margin:0 0 0.75rem; font-size:0.95rem; }
  .chip { display:inline-block; padding:0.15rem 0.5rem; margin:0 0.3rem 0.3rem 0; background:#f2efe9; border:1px solid var(--line); border-radius:4px; font:600 0.8rem ui-monospace,monospace; }
  .directions { padding:0.85rem 1rem; background:#f2efe9; border-left:4px solid var(--brand); border-radius:0 6px 6px 0; margin:1rem 0; }
  .visual { margin:1rem 0; border:1px solid var(--line); border-radius:6px; padding:0.5rem; background:#fff; }
  .item { border:1px solid var(--line); border-radius:8px; padding:1rem; margin-bottom:1rem; }
  .item h2 { margin:0 0 0.4rem; font-size:1.05rem; color:var(--brand); }
  .support { font-size:0.9rem; color:var(--accent); }
  textarea { width:100%; min-height:4.5rem; padding:0.6rem; border:1px solid #7c8799; border-radius:6px; font:inherit; margin-top:0.35rem; }
  .teacher-key { margin-top:2rem; padding:1.25rem; background:#e1f2ef; border:1px solid var(--accent); border-radius:8px; page-break-before:always; }
  .no-print-bar { display:flex; gap:0.5rem; margin-bottom:1rem; }
  button { padding:0.5rem 1rem; border-radius:6px; border:1px solid var(--brand); background:var(--brand); color:#fff; font:600 0.9rem inherit; cursor:pointer; }
  @media print { .no-print-bar { display:none; } body { background:#fff; padding:0; } main { border:none; padding:0; } }
</style>
</head>
<body>
<main>
  <div class="no-print-bar">
    <button type="button" onclick="window.print()">Print / Save PDF</button>
  </div>
  <p class="meta">${safeUnit} · WIDA ${escHtml(widaLabel(res.wida))} · ${escHtml(res.complexity)}</p>
  <h1>${safeTitle}</h1>
  <div>${safeStandards}</div>
  <div class="directions">${safeDirections}</div>
  ${visualSvg ? `<div class="visual">${visualSvg}</div>` : ""}
  <section aria-label="Student Tasks">
    ${studentItemsHtml}
  </section>
  <section class="teacher-key" aria-label="Teacher Answer Key and Look-Fors">
    <h2>Teacher Answer Key &amp; Language Look-Fors (Separate Page When Printed)</h2>
    <ol>${teacherKeyHtml}</ol>
  </section>
</main>
</body>
</html>`;
}

export function renderCreationStudio(
  container,
  { unit, connection, blueprint, wida, onSharePlan, onTelemetry } = {},
) {
  if (!container) return;
  if (!unit) {
    container.innerHTML = `<div class="bh-empty">Choose a grade, subject, and unit above to open the Teacher Creation Studio.</div>`;
    return;
  }

  const prev = stateMap.get(container);
  const st =
    prev && prev.unitId === unit.id
      ? prev
      : {
          unitId: unit.id,
          focus: "",
          type: "interactive",
          complexity: "Core",
          wida: wida || "3_4",
          itemCount: 3,
          format: "Sentence Construction",
          includeVisuals: true,
          viewMode: "student", // student | teacher
          draft: null,
          statusMsg: "",
          saved: loadSavedResources(),
        };

  if (!st.draft) {
    st.draft = buildResourceDraft({
      unit,
      connection,
      blueprint,
      type: st.type,
      focus: st.focus,
      complexity: st.complexity,
      wida: st.wida,
      itemCount: st.itemCount,
      format: st.format,
      includeVisuals: st.includeVisuals,
    });
  }
  stateMap.set(container, st);

  function render() {
    keepView(container, draw);
  }

  function rebuildDraft() {
    st.draft = buildResourceDraft({
      unit,
      connection,
      blueprint,
      type: st.type,
      focus: st.focus,
      complexity: st.complexity,
      wida: st.wida,
      itemCount: st.itemCount,
      format: st.format,
      includeVisuals: st.includeVisuals,
    });
  }

  function draw() {
    const d = st.draft;
    const visualSvg = d.includeVisuals ? unitConceptVisual(d.vocabTerms, d.subject) : "";

    container.innerHTML = `
      <div class="cs-shell">
        <!-- Step 1: What are you teaching? -->
        <section class="cs-step-card" aria-label="Step 1: What are you teaching">
          <div>
            <span class="bh-step-tag">Step 1</span>
            <strong style="margin-left:0.4rem">What are you teaching?</strong>
          </div>
          <div class="cs-adjust-grid">
            <div class="cs-field">
              <label for="csUnitReadonly">Aligned BCPSS Unit</label>
              <input id="csUnitReadonly" type="text" readonly value="${escHtml(`${unit.grade === "K" ? "Kindergarten" : `Grade ${unit.grade}`} · ${unit.subject} · Unit ${unit.unit_number}: ${unit.unit_title}`)}" />
            </div>
            <div class="cs-field">
              <label for="csLessonFocus">Optional Lesson Focus</label>
              <input id="csLessonFocus" type="text" value="${escHtml(st.focus)}" placeholder="e.g., Day 2 Guided Practice or Exit Ticket" />
            </div>
          </div>
        </section>

        <!-- Step 2: What do you want to make? -->
        <section class="cs-step-card" aria-label="Step 2: What do you want to make">
          <div>
            <span class="bh-step-tag">Step 2</span>
            <strong style="margin-left:0.4rem">What do you want to make?</strong>
          </div>
          <div class="cs-type-grid" role="group" aria-label="Resource output type">
            ${RESOURCE_TYPES.map(
              (t) => `
                <button type="button" class="cs-type-card" data-cs-type="${t.key}" aria-pressed="${st.type === t.key}">
                  <strong>${escHtml(t.title)}</strong>
                  <span>${escHtml(t.desc)}</span>
                </button>
              `,
            ).join("")}
          </div>
        </section>

        <!-- Step 3: Create & Quick-Adjust -->
        <section class="cs-step-card" aria-label="Step 3: Create and quick-adjust">
          <div class="cs-item-head">
            <div>
              <span class="bh-step-tag">Step 3</span>
              <strong style="margin-left:0.4rem">Create &amp; Quick-Adjust</strong>
            </div>
            <div class="vs-mode-tabs" role="group" aria-label="Preview audience">
              <button type="button" class="vs-pill" data-cs-view="student" aria-pressed="${st.viewMode === "student"}">Student View</button>
              <button type="button" class="vs-pill" data-cs-view="teacher" aria-pressed="${st.viewMode === "teacher"}">Teacher View (Answer Key)</button>
            </div>
          </div>

          <div class="cs-adjust-grid">
            <div class="cs-field">
              <label for="csComplexity">Cognitive Complexity (Standard Intact)</label>
              <select id="csComplexity">
                ${COMPLEXITY_LEVELS.map((c) => `<option value="${c.key}" ${st.complexity === c.key ? "selected" : ""}>${escHtml(c.label)}</option>`).join("")}
              </select>
            </div>
            <div class="cs-field">
              <label for="csWida">WIDA Language Support</label>
              <select id="csWida">
                <option value="1_2" ${st.wida === "1_2" ? "selected" : ""}>Levels 1–2 (Entering / Emerging)</option>
                <option value="3_4" ${st.wida === "3_4" ? "selected" : ""}>Levels 3–4 (Developing / Expanding)</option>
                <option value="5_6" ${st.wida === "5_6" ? "selected" : ""}>Levels 5–6 (Bridging / Reaching)</option>
              </select>
            </div>
            <div class="cs-field">
              <label for="csFormat">Interaction Format</label>
              <select id="csFormat">
                ${INTERACTION_FORMATS.map((f) => `<option value="${escHtml(f)}" ${st.format === f ? "selected" : ""}>${escHtml(f)}</option>`).join("")}
              </select>
            </div>
            <div class="cs-field">
              <label for="csItemCount">Item Count</label>
              <select id="csItemCount">
                ${[3, 4, 5, 6].map((n) => `<option value="${n}" ${st.itemCount === n ? "selected" : ""}>${n} items</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="cs-action-bar">
            <label style="display:inline-flex;align-items:center;gap:0.45rem;font-size:0.9rem;font-weight:600;cursor:pointer">
              <input type="checkbox" id="csVisualToggle" ${st.includeVisuals ? "checked" : ""} />
              Include a concept diagram (only when one fits this unit)
            </label>
            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-cs-regenerate-all>Regenerate Resource</button>
          </div>

          <!-- Live Editable Preview -->
          <div class="cs-preview-frame">
            <div class="cs-field">
              <label for="csEditTitle">Resource Title (inline edit)</label>
              <input id="csEditTitle" type="text" value="${escHtml(d.title)}" />
            </div>
            <div class="cs-field">
              <label for="csEditDirections">Student Directions (inline edit)</label>
              <textarea id="csEditDirections" rows="2">${escHtml(d.directions)}</textarea>
            </div>

            ${visualSvg ? `<div class="vs-svg-frame">${visualSvg}</div>` : ""}

            ${d.items
              .map(
                (item, idx) => `
                  <article class="cs-item-card">
                    <div class="cs-item-head">
                      <strong>Item ${idx + 1} · ${escHtml(d.format)}</strong>
                      <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-cs-regen-item="${idx}">Regenerate Item</button>
                    </div>
                    <label for="csItemPrompt-${idx}" class="visually-hidden">Edit prompt for item ${idx + 1}</label>
                    <textarea id="csItemPrompt-${idx}" class="bh-seq-input" rows="2" data-cs-item-prompt="${idx}">${escHtml(item.prompt)}</textarea>
                    <p class="bh-muted" style="margin:0;font-size:0.86rem"><strong>WIDA Support:</strong> ${escHtml(item.support)}</p>
                    ${
                      st.viewMode === "teacher"
                        ? `<div class="cs-answer-key">
                            <p style="margin:0;font-size:0.88rem"><strong>Answer Key:</strong> ${escHtml(item.answer)}</p>
                            <p style="margin:0;font-size:0.86rem"><strong>Look-For:</strong> ${escHtml(item.lookFor)}</p>
                          </div>`
                        : ""
                    }
                  </article>
                `,
              )
              .join("")}
          </div>

          <!-- Real Working Outputs -->
          <div class="cs-action-bar">
            <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-cs-preview-student>Preview Student Version</button>
            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-cs-print>Print / Save PDF</button>
            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-cs-download-html>Download Standalone HTML</button>
            <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-cs-save-local>Save to My Resources</button>
            <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-cs-share>Share Plan</button>
          </div>
          ${st.statusMsg ? `<p class="bh-muted" role="status" style="margin:0;color:var(--brand-accent);font-weight:600">${escHtml(st.statusMsg)}</p>` : ""}
        </section>

        <!-- Saved Local Resources -->
        <section class="cs-step-card" aria-label="My saved resources">
          <strong>My Saved Resources (${st.saved.length})</strong>
          ${
            st.saved.length
              ? `<div class="cs-saved-list">
                  ${st.saved
                    .map(
                      (item, idx) => `
                        <div class="cs-saved-row">
                          <div>
                            <strong>${escHtml(item.title)}</strong>
                            <div class="bh-muted" style="font-size:0.82rem">${escHtml(item.typeTitle)} · ${escHtml(item.format)} · WIDA ${escHtml(item.wida).replace("_", "–")}</div>
                          </div>
                          <div class="cs-action-bar">
                            <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-cs-load-saved="${idx}">Load</button>
                            <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-cs-delete-saved="${idx}">Remove</button>
                          </div>
                        </div>
                      `,
                    )
                    .join("")}
                </div>`
              : `<p class="bh-muted" style="margin:0">Resources you save stay on this device for quick reuse across class periods.</p>`
          }
        </section>
      </div>
    `;
  }

  if (!container.dataset.csBound) {
    container.dataset.csBound = "1";

    container.addEventListener("change", (e) => {
      const s = stateMap.get(container);
      if (!s) return;
      const ctx = container._csCtx;
      if (!ctx) return;

      if (e.target.id === "csComplexity") {
        s.complexity = e.target.value;
        ctx.rebuildDraft();
        ctx.render();
      } else if (e.target.id === "csWida") {
        s.wida = e.target.value;
        ctx.rebuildDraft();
        ctx.render();
      } else if (e.target.id === "csFormat") {
        s.format = e.target.value;
        ctx.rebuildDraft();
        ctx.render();
      } else if (e.target.id === "csItemCount") {
        s.itemCount = Number(e.target.value) || 3;
        ctx.rebuildDraft();
        ctx.render();
      } else if (e.target.id === "csVisualToggle") {
        s.includeVisuals = e.target.checked;
        s.draft.includeVisuals = e.target.checked;
        ctx.render();
      }
    });

    container.addEventListener("input", (e) => {
      const s = stateMap.get(container);
      if (!s || !s.draft) return;
      if (e.target.id === "csLessonFocus") {
        s.focus = e.target.value;
      } else if (e.target.id === "csEditTitle") {
        s.draft.title = e.target.value;
      } else if (e.target.id === "csEditDirections") {
        s.draft.directions = e.target.value;
      } else if (e.target.dataset.csItemPrompt != null) {
        const idx = Number(e.target.dataset.csItemPrompt);
        if (s.draft.items[idx]) s.draft.items[idx].prompt = e.target.value;
      }
    });

    container.addEventListener("click", (e) => {
      const s = stateMap.get(container);
      const ctx = container._csCtx;
      if (!s || !ctx) return;

      const typeBtn = e.target.closest("[data-cs-type]");
      if (typeBtn) {
        s.type = typeBtn.dataset.csType;
        ctx.rebuildDraft();
        ctx.render();
        return;
      }

      const viewBtn = e.target.closest("[data-cs-view]");
      if (viewBtn) {
        s.viewMode = viewBtn.dataset.csView;
        ctx.render();
        return;
      }

      if (e.target.closest("[data-cs-regenerate-all]")) {
        ctx.rebuildDraft();
        s.statusMsg = "Regenerated curriculum-aligned items.";
        ctx.render();
        return;
      }

      const regenItemBtn = e.target.closest("[data-cs-regen-item]");
      if (regenItemBtn) {
        const idx = Number(regenItemBtn.dataset.csRegenItem);
        s.draft.items[idx] = generateSingleItem({
          unit: ctx.unit,
          connection: ctx.connection,
          blueprint: ctx.blueprint,
          format: s.format,
          complexity: s.complexity,
          wida: s.wida,
          index: idx,
          seedOffset: Math.floor(Math.random() * 5) + 1,
        });
        s.statusMsg = `Regenerated Item ${idx + 1}.`;
        ctx.render();
        return;
      }

      if (e.target.closest("[data-cs-preview-student]")) {
        const dlg = document.querySelector("#creationPreviewDialog");
        const body = document.querySelector("#creationPreviewBody");
        const title = document.querySelector("#creationPreviewTitle");
        if (dlg && body && title) {
          title.textContent = `Student Preview · ${s.draft.title}`;
          const svg = s.draft.includeVisuals ? unitConceptVisual(s.draft.vocabTerms, s.draft.subject) : "";
          body.innerHTML = `
            <p class="bh-muted">${escHtml(s.draft.directions)}</p>
            ${svg ? `<div class="vs-svg-frame" style="margin-bottom:0.85rem">${svg}</div>` : ""}
            ${s.draft.items
              .map(
                (item, idx) => `
                  <article class="cs-item-card" style="margin-bottom:0.75rem">
                    <strong>Item ${idx + 1}</strong>
                    <p style="margin:0">${escHtml(item.prompt)}</p>
                    <p class="bh-muted" style="margin:0;font-size:0.86rem"><strong>Support:</strong> ${escHtml(item.support)}</p>
                    <div style="min-height:3rem;border:1px dashed var(--border-control);border-radius:6px;background:#fff"></div>
                  </article>
                `,
              )
              .join("")}
          `;
          dlg.showModal();
        }
        return;
      }

      if (e.target.closest("[data-cs-print]")) {
        const kit = document.querySelector("#printKit");
        if (kit) {
          kit.innerHTML = `
            <div style="padding:1rem">
              <h1>${escHtml(s.draft.title)}</h1>
              <p>${escHtml(s.draft.directions)}</p>
              ${s.draft.items
                .map(
                  (item, idx) => `
                    <div style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid #cbd5e1">
                      <p><strong>${idx + 1}.</strong> ${escHtml(item.prompt)}</p>
                      <p style="font-size:0.9rem;color:#475467"><em>Support:</em> ${escHtml(item.support)}</p>
                      <div style="height:4.5rem;border:1px solid #cbd5e1;margin-top:0.5rem"></div>
                    </div>
                  `,
                )
                .join("")}
              <div style="page-break-before:always;padding-top:1rem">
                <h2>Teacher Answer Key &amp; Look-Fors</h2>
                <ol>
                  ${s.draft.items.map((item) => `<li><strong>${escHtml(item.answer)}</strong> — <em>${escHtml(item.lookFor)}</em></li>`).join("")}
                </ol>
              </div>
            </div>
          `;
        }
        ctx.onTelemetry?.("activity_copy");
        window.print();
        return;
      }

      if (e.target.closest("[data-cs-download-html]")) {
        const html = buildStandaloneHtml(s.draft);
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(ctx.unit.id || "bcpss-resource").replace(/[^a-z0-9_-]/gi, "-")}-${s.type}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        s.statusMsg = "Downloaded self-contained offline HTML resource.";
        ctx.onTelemetry?.("activity_copy");
        ctx.render();
        return;
      }

      if (e.target.closest("[data-cs-save-local]")) {
        const copy = JSON.parse(JSON.stringify(s.draft));
        copy.savedAt = new Date().toISOString();
        s.saved = [copy, ...s.saved.filter((item) => item.id !== copy.id)].slice(0, 20);
        persistSavedResources(s.saved);
        s.statusMsg = "Saved to My Resources on this device.";
        ctx.render();
        return;
      }

      if (e.target.closest("[data-cs-share]")) {
        ctx.onSharePlan?.();
        return;
      }

      const loadBtn = e.target.closest("[data-cs-load-saved]");
      if (loadBtn) {
        const item = s.saved[Number(loadBtn.dataset.csLoadSaved)];
        if (item) {
          s.draft = JSON.parse(JSON.stringify(item));
          s.type = item.type || "interactive";
          s.format = item.format || "Sentence Construction";
          s.wida = item.wida || "3_4";
          s.complexity = item.complexity || "Core";
          s.includeVisuals = Boolean(item.includeVisuals);
          s.statusMsg = `Loaded "${item.title}".`;
          ctx.render();
        }
        return;
      }

      const delBtn = e.target.closest("[data-cs-delete-saved]");
      if (delBtn) {
        const idx = Number(delBtn.dataset.csDeleteSaved);
        s.saved.splice(idx, 1);
        persistSavedResources(s.saved);
        s.statusMsg = "Removed saved resource.";
        ctx.render();
      }
    });
  }

  container._csCtx = {
    unit,
    connection,
    blueprint,
    onSharePlan,
    onTelemetry,
    rebuildDraft,
    render,
  };

  draw();
}
