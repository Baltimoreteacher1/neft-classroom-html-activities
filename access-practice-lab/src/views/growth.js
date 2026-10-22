// Language Growth Map: Evidence-based visual development across domains, Key Language Uses,
// and WIDA Dimensions (Discourse, Sentence, Word/Phrase).
import { crumbsHTML, ringHTML } from "../components.js";
import { allRecords, loadRecord } from "../store.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, LEVEL_KEYS, TIERS, bandLabel, html } from "../util.js";

export async function render(ctx) {
  const band = ctx.band;
  const records = allRecords().filter((r) => r.band === band);

  // Compute metrics across dimensions
  let totalCompleted = 0;
  let totalSpeakingTakes = 0;
  let totalWritingWords = 0;
  let totalRevisions = 0;
  const domainStats = {};

  for (const d of CORE_DOMAINS) {
    domainStats[d] = { completed: 0, attempted: 0 };
  }

  for (const rec of records) {
    const domain = rec.domain;
    if (domainStats[domain]) {
      const doneCount = rec.record.complete?.length || 0;
      domainStats[domain].completed += doneCount;
      totalCompleted += doneCount;
    }
    // Count spoken attempts
    if (domain === "Speaking") {
      for (const takes of Object.values(rec.record.attempts || {})) {
        if (Array.isArray(takes)) totalSpeakingTakes += takes.length;
      }
    }
    // Count writing volume and revisions
    if (domain === "Writing") {
      for (const note of Object.values(rec.record.notes || {})) {
        if (typeof note === "string") totalWritingWords += note.trim().split(/\s+/).filter(Boolean).length;
      }
      for (const ref of Object.values(rec.record.reflections || {})) {
        if (ref) totalRevisions++;
      }
    }
  }

  // WIDA Dimensions Mastery Estimation
  const discourseScore = Math.min(100, Math.round(totalCompleted * 3.5 + totalRevisions * 8));
  const sentenceScore = Math.min(100, Math.round(totalCompleted * 3.0 + totalSpeakingTakes * 5));
  const wordScore = Math.min(100, Math.round(totalCompleted * 3.2 + (totalWritingWords > 50 ? 25 : 10)));

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Passport", `${BASE}/passport?grades=${ctx.band}`],
    ["Language Growth Map", null],
  ];

  return {
    title: "Language Growth Map",
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero" style="--room:#1f766f">
        <div>
          <span class="badge" style="background:#1f766f; color:white">Evidence-Based WIDA ELD Progression</span>
          <h1 tabindex="-1">🗺️ Language Growth Map</h1>
          <p class="lead">Visualize your progress across domains, sentence complexity, and academic discourse features.</p>
        </div>
      </section>

      <section class="panel growth-dimensions-panel">
        <h2>Language Dimensions Progression</h2>
        <p class="fine">Development tracked across student work, revisions, and recorded evidence (WIDA 2020 Standards Framework).</p>

        <div class="dimension-bars">
          <div class="card dim-card">
            <div class="dim-head">
              <h3>Discourse Dimension</h3>
              <span class="badge">${discourseScore}% Developed</span>
            </div>
            <p class="fine">Cohesion, organization of ideas, claim-evidence-reasoning structures, and transitions.</p>
            <div class="progress-track"><div class="progress-fill" style="width:${discourseScore}%; background:#1f766f"></div></div>
          </div>

          <div class="card dim-card">
            <div class="dim-head">
              <h3>Sentence Dimension</h3>
              <span class="badge">${sentenceScore}% Developed</span>
            </div>
            <p class="fine">Sentence variety, subordinate causal clauses (because, although, whereas), and syntactic expansion.</p>
            <div class="progress-track"><div class="progress-fill" style="width:${sentenceScore}%; background:#2a6f97"></div></div>
          </div>

          <div class="card dim-card">
            <div class="dim-head">
              <h3>Word/Phrase Dimension</h3>
              <span class="badge">${wordScore}% Developed</span>
            </div>
            <p class="fine">Tier 2/3 academic vocabulary, domain-specific terminology, expanded noun phrases, and cognates.</p>
            <div class="progress-track"><div class="progress-fill" style="width:${wordScore}%; background:#6a4c93"></div></div>
          </div>
        </div>
      </section>

      <section class="panel domain-breakdown-panel">
        <h2>Domain Engagement & Evidence Tracking</h2>
        <div class="domain-grid">
          ${CORE_DOMAINS.map((d) => {
            const meta = DOMAIN_META[d];
            const stat = domainStats[d] || { completed: 0 };
            return html`<div class="card domain-growth-card" style="--dcolor:${meta.color}">
              <div class="card-head">
                <span class="glyph" aria-hidden="true">${meta.glyph}</span>
                <h3>${meta.room}</h3>
              </div>
              <p><strong>${stat.completed}</strong> activities mastered with evidence</p>
              ${d === "Speaking" ? html`<p class="fine">🎙️ ${totalSpeakingTakes} oral rehearsal takes recorded</p>` : ""}
              ${d === "Writing" ? html`<p class="fine">✍️ ${totalWritingWords} academic words written · ${totalRevisions} revisions</p>` : ""}
              <a href="${BASE}/${d}/A?grades=${band}" class="btn ghost small">Continue ${d} Practice →</a>
            </div>`;
          })}
        </div>
      </section>

      <section class="panel key-uses-panel">
        <h2>Key Language Uses Mastery</h2>
        <div class="key-uses-grid">
          <div class="card use-card">
            <h3>📖 Narrate</h3>
            <p>Sequencing events, temporal transitions (first, subsequently, after), and sensory details.</p>
          </div>
          <div class="card use-card">
            <h3>💡 Inform</h3>
            <p>Categorizing, defining concepts, expanding noun phrases, and presenting factual summaries.</p>
          </div>
          <div class="card use-card">
            <h3>🔬 Explain</h3>
            <p>Causal connectors (because, consequently, due to), scientific mechanisms, and process flows.</p>
          </div>
          <div class="card use-card">
            <h3>⚖️ Argue</h3>
            <p>Stating claims, evaluating counterarguments, citing evidence, and justifying recommendations.</p>
          </div>
        </div>
      </section>`,
  };
}
