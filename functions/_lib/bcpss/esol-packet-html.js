// Printable ESOL Power Pack page for the BCPSS unit packet (HTML export / PDF / print).
// Teacher-facing: objectives, 5-day language week, dictogloss text, cuttable info-gap cards,
// Language Doctor answer key and sentence-ladder prompts.

const TIER_LABEL = { "1_2": "Levels 1–2", "3_4": "Levels 3–4", "5_6": "Levels 5–6" };

export function renderEsolPacketPage({
  pack,
  unit,
  wida = "3_4",
  esc,
  pageNum,
  totalPages,
  runningImprint,
}) {
  if (!pack) return "";
  const tier = pack.ladder?.tiers?.[wida] || { rungs: [] };
  const week = pack.week_plan
    .map(
      (d) =>
        `<tr><td><strong>Day ${d.day}</strong> · ${esc(d.title)} <em>(${d.minutes} min)</em></td><td>${esc(d.focus)}</td></tr>`,
    )
    .join("");
  const card = (
    label,
    c,
  ) => `<div style="border:1.5px dashed #475569;padding:6pt 8pt;border-radius:4pt">
      <strong>Partner ${label}: I know</strong>
      <ul style="margin:3pt 0 3pt 12pt;padding:0">${c.knows.map((k) => `<li><strong>${esc(k.term)}</strong>: ${esc(k.def)}${k.cognate ? ` (${esc(k.cognate)})` : ""}</li>`).join("")}</ul>
      <strong>I need to find out:</strong> ${esc(c.needs.join(", ") || "the sentence frame")}
    </div>`;
  return `
    <!-- PAGE ${pageNum}: ESOL Power Pack -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${esc(runningImprint)} · ESOL Power Pack</span>
        <span class="page-num">Page ${pageNum} of ${totalPages} · 5-Day Language Week</span>
      </div>
      <h3>5-Day Language Week · WIDA ${esc(pack.klu)}</h3>
      <p><strong>Language objective (${esc(TIER_LABEL[wida])}):</strong> ${esc(pack.objectives.language[wida])}</p>
      <p><strong>Look-for:</strong> ${esc(pack.objectives.look_fors[wida])}</p>
      <table style="width:100%;border-collapse:collapse;font-size:8.6pt" border="1" cellpadding="3"><tbody>${week}</tbody></table>
      <h4>Day 2 · Dictogloss text (read aloud twice at normal speed)</h4>
      <p style="font-size:9.5pt">${esc(pack.dictogloss.text)}</p>
      <h4>Day 3 · Info-Gap cards (cut apart)</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;font-size:8.8pt">${card("A", pack.info_gap.card_a)}${card("B", pack.info_gap.card_b)}</div>
      <p style="font-size:8.8pt"><strong>Together:</strong> ${esc(pack.info_gap.task)}</p>
      <h4>Day 3 · Language Doctor key (Spanish-speaker transfer errors)</h4>
      <ol style="font-size:8.8pt;margin:0 0 0 14pt;padding:0">${pack.doctor.map((d) => `<li>“${esc(d.wrong)}” → <strong>${esc(d.options[d.answer_index])}</strong> <em>${esc(d.rule)}</em></li>`).join("")}</ol>
      <h4>Day 4 · Sentence ladder (${esc(TIER_LABEL[wida])})</h4>
      <p style="font-size:8.8pt">Kernel: ${esc(pack.ladder.kernel)}</p>
      <ol style="font-size:8.8pt;margin:0 0 0 14pt;padding:0">${tier.rungs.map((r) => `<li><strong>${esc(r.label)}:</strong> ${esc(r.prompt)}</li>`).join("")}</ol>
      <h4>Day 4 · Talk Line statements</h4>
      <ol style="font-size:8.8pt;margin:0 0 0 14pt;padding:0">${pack.talk_line.statements.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p style="font-size:8pt;color:#64748b">Interactive versions (dictogloss audio, Language Doctor, ladder, passport) are in the ESOL Power Pack tab of the BCPSS Teachers Hub for “${esc(unit.unit_title)}”.</p>
    </section>`;
}
