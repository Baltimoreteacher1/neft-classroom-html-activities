/**
 * Unified BCPSS K–8 Classroom Resource Packet Generator (HTML5 + OOXML DOCX).
 *
 * Pure Web-runtime ES module — runs identically in Cloudflare Pages Functions /
 * Workers and Node 18+ with zero Node-only APIs and zero external network
 * dependencies.
 */

import { zipStore } from "../../../assets/lib/zip-store.js";

const WIDA_TIERS = [
  {
    key: "1_2",
    scaffoldKey: "level_1_2",
    label: "WIDA Levels 1–2",
    shortLabel: "Levels 1–2",
    subtitle: "Entering & Emerging",
    slug: "1-2",
  },
  {
    key: "3_4",
    scaffoldKey: "level_3_4",
    label: "WIDA Levels 3–4",
    shortLabel: "Levels 3–4",
    subtitle: "Developing & Expanding",
    slug: "3-4",
  },
  {
    key: "5_6",
    scaffoldKey: "level_5_6",
    label: "WIDA Levels 5–6",
    shortLabel: "Levels 5–6",
    subtitle: "Bridging & Reaching",
    slug: "5-6",
  },
];

export function normalizeWidaTier(wida = "3_4") {
  const raw = String(wida || "3_4")
    .trim()
    .toLowerCase()
    .replace(/^level_/, "")
    .replace(/-/g, "_");
  if (raw === "1_2" || raw === "3_4" || raw === "5_6") return raw;
  return "3_4";
}

function getTierMeta(widaKey) {
  return WIDA_TIERS.find((t) => t.key === widaKey) || WIDA_TIERS[1];
}

function slugToken(value, fallback = "General") {
  const cleaned = String(value || "")
    .trim()
    .replace(/&/g, "and")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/**
 * Generate a clean, portable filename like `BCPSS-G6-Math-U2-WIDA-3-4.docx`.
 */
export function packetFilename(unit, wida = "3_4", ext = "docx") {
  const tier = getTierMeta(normalizeWidaTier(wida));
  const gradeRaw = String(unit?.grade ?? "X")
    .trim()
    .toUpperCase();
  const gradePart = gradeRaw.startsWith("G") ? gradeRaw : `G${gradeRaw}`;
  const subjectPart = slugToken(unit?.subject, "Subject");
  const unitNum = unit?.unit_number ?? 1;
  const cleanExt = String(ext || "docx")
    .trim()
    .replace(/^\.+/, "")
    .toLowerCase();
  return `BCPSS-${gradePart}-${subjectPart}-U${unitNum}-WIDA-${tier.slug}.${cleanExt}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strip illegal XML 1.0 control characters without using regex control-char
 * literals, then escape XML entities.
 */
function sanitizeXmlText(value) {
  const str = String(value ?? "");
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      code === 0x09 ||
      code === 0x0a ||
      code === 0x0d ||
      (code >= 0x20 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd)
    ) {
      out += str[i];
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += str[i] + str[i + 1];
        i++;
      }
    }
  }
  return out;
}

function escapeXml(value) {
  return sanitizeXmlText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function capitalizeSentence(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function defaultQuickFixForLanguage(language) {
  const lower = String(language || "").toLowerCase();
  if (lower.includes("spanish")) {
    return "Anchor English prepositions and cognates visually on the board, and pair oral rehearsal with the target frame before writing.";
  }
  if (lower.includes("arabic")) {
    return "Trace left-to-right visual directionality on models and cue explicit present-tense linking verbs (is/are) during partner talk.";
  }
  if (lower.includes("french") || lower.includes("creole") || lower.includes("haitian")) {
    return "Highlight shared academic cognates first, then color-code English verb endings and prepositions inside the unit frame.";
  }
  return "Pre-teach the target connector with a visual cue and have students rehearse the frame aloud with a partner before writing.";
}

function normalizeL1Watchouts(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const language = String(item.l1_group || item.language || "Multilingual Learners").trim();
      if (item.friction_point || item.quick_fix) {
        return {
          language,
          frictionPoint: String(item.friction_point || item.watchout || "").trim(),
          quickFix: String(item.quick_fix || "").trim() || defaultQuickFixForLanguage(language),
        };
      }
      const watchout = String(item.watchout || "").trim();
      const semiIdx = watchout.indexOf("; ");
      if (semiIdx > 25 && watchout.length - semiIdx > 25) {
        const friction = `${watchout.slice(0, semiIdx).trim()}.`;
        const fix = capitalizeSentence(watchout.slice(semiIdx + 2).trim());
        return {
          language,
          frictionPoint: friction,
          quickFix: fix.endsWith(".") ? fix : `${fix}.`,
        };
      }
      return {
        language,
        frictionPoint: watchout,
        quickFix: defaultQuickFixForLanguage(language),
      };
    })
    .filter((entry) => entry && (entry.frictionPoint || entry.quickFix));
}

function normalizeExitTicket(raw, unit, primary, vocab) {
  const ticket = raw && typeof raw === "object" ? raw : {};
  const klu = ticket.wida_klu || primary?.wida_klu || "Explain";
  const requiredVocab = Array.isArray(ticket.required_vocab)
    ? ticket.required_vocab.map(String)
    : vocab
        .slice(0, 3)
        .map((v) => v.term)
        .filter(Boolean);
  const vocabListStr = requiredVocab.length ? requiredVocab.join(", ") : "key unit terms";

  const prompt =
    ticket.prompt ||
    `In 2–3 sentences about "${unit?.unit_title || "this unit"}", use the target ${klu} frame and include at least two unit terms (${vocabListStr}).`;
  const targetFrame =
    ticket.target_frame ||
    primary?.unit_example_frame ||
    "Use the unit anchor sentence frame with specific content evidence.";
  const lookFors = Array.isArray(ticket.look_fors)
    ? ticket.look_fors.map(String)
    : Array.isArray(ticket.success_criteria)
      ? ticket.success_criteria.map(String)
      : [
          `Uses the target ${klu} academic connector accurately.`,
          `Integrates at least two Tier 2/Tier 3 terms (${vocabListStr}).`,
          `Cites a specific detail, model, or example from "${unit?.unit_title || "the unit"}".`,
        ];

  const defaultRubric = [
    {
      level: "Emerging (1)",
      criteria: `Names a unit idea with teacher/visual support; attempts 1 vocabulary term or partial ${klu} frame.`,
      nextStep: "Echo-read the Level 1–2 desk strip frame and point to 1 model detail together.",
    },
    {
      level: "Developing (2)",
      criteria: `Completes the target ${klu} frame with 1–2 unit terms (${vocabListStr}); evidence is general.`,
      nextStep:
        "Prompt student to add one specific number, quote, or diagram feature to strengthen justification.",
    },
    {
      level: "Proficient (3)",
      criteria: `Applies the ${klu} move independently with 2+ accurate terms and clear evidence from "${unit?.unit_title || "the unit"}".`,
      nextStep:
        "Invite student to revise with a Level 5–6 connector or explain a peer's counterexample.",
    },
  ];

  let rubric = defaultRubric;
  if (Array.isArray(ticket.rubric) && ticket.rubric.length) {
    rubric = ticket.rubric.map((r) => ({
      level: String(r.level || r.tier || ""),
      criteria: String(r.criteria || r.description || ""),
      nextStep: String(r.next_step || r.nextStep || r.action || ""),
    }));
  } else if (ticket.rubric && typeof ticket.rubric === "object") {
    const entries = [
      ["Emerging (1)", ticket.rubric.emerging],
      ["Developing (2)", ticket.rubric.developing],
      ["Proficient (3)", ticket.rubric.proficient],
    ].filter(([, val]) => Boolean(val));
    if (entries.length) {
      rubric = entries.map(([level, val], idx) => ({
        level,
        criteria: typeof val === "string" ? val : String(val.criteria || val.description || ""),
        nextStep:
          typeof val === "object" && (val.next_step || val.nextStep)
            ? String(val.next_step || val.nextStep)
            : defaultRubric[idx]?.nextStep || "",
      }));
    }
  }

  return { prompt, targetFrame, requiredVocab, lookFors, rubric };
}

function normalizeFamilyCards(familyCard, unit, primary, vocab) {
  const tj = familyCard?.translations_json || {};
  const dtp = familyCard?.dinner_table_prompts || {};
  const unitLabel =
    `Grade ${unit?.grade ?? ""} ${unit?.subject ?? ""}: ${unit?.unit_title ?? ""}`.trim();
  const klu = primary?.wida_klu || "Explain";
  const defaultWords = vocab
    .slice(0, 4)
    .map((v) => v.term)
    .filter(Boolean);
  const esWords = vocab
    .slice(0, 4)
    .map((v) => (v.cognate_es ? `${v.term} (${v.cognate_es})` : v.term))
    .filter(Boolean);

  return [
    {
      code: "EN",
      label: "English",
      dir: "ltr",
      title: tj.en?.title || unitLabel,
      summary:
        tj.en?.summary ||
        familyCard?.en_summary ||
        `In Unit ${unit?.unit_number ?? ""} (${unit?.unit_title ?? ""}), students practice the "${klu}" academic language move while learning ${unit?.unit_summary ?? ""}`,
      question:
        tj.en?.dinner_question ||
        dtp.en ||
        `Ask at home: "Can you teach me one example from ${unit?.unit_title || "this unit"}?"`,
      keyWords: Array.isArray(tj.en?.key_words) ? tj.en.key_words : defaultWords,
    },
    {
      code: "ES",
      label: "Español",
      dir: "ltr",
      title:
        tj.es?.title ||
        `Grado ${unit?.grade ?? ""} · ${unit?.subject ?? ""}: ${unit?.unit_title ?? ""}`,
      summary:
        tj.es?.summary ||
        familyCard?.es_summary ||
        `En la Unidad ${unit?.unit_number ?? ""} (${unit?.unit_title ?? ""}), los estudiantes practican el lenguaje académico (${klu}) mientras exploran los conceptos clave.`,
      question:
        tj.es?.dinner_question ||
        dtp.es ||
        `Pregunta en casa: "¿Puedes enseñarme un ejemplo de ${unit?.unit_title || "esta unidad"} en español o en inglés?"`,
      keyWords: Array.isArray(tj.es?.key_words) ? tj.es.key_words : esWords,
    },
    {
      code: "AR",
      label: "العربية",
      dir: "rtl",
      title:
        tj.ar?.title ||
        `الصف ${unit?.grade ?? ""} · ${unit?.subject ?? ""}: ${unit?.unit_title ?? ""}`,
      summary:
        tj.ar?.summary ||
        familyCard?.ar_summary ||
        `في الوحدة ${unit?.unit_number ?? ""} (${unit?.unit_title ?? ""})، يتدرب الطلاب على مهارات اللغة الأكاديمية (${klu}) مع مفاهيم الوحدة الأساسية.`,
      question:
        tj.ar?.dinner_question ||
        dtp.ar ||
        `سؤال في المنزل: "هل يمكنك أن تشرح لي مثالاً واحداً من وحدة ${unit?.unit_title || "هذه الوحدة"} بلغتنا أو بالإنجليزية؟"`,
      keyWords: Array.isArray(tj.ar?.key_words) ? tj.ar.key_words : defaultWords,
    },
    {
      code: "FR / HT",
      label: "Français / Kreyòl",
      dir: "ltr",
      title:
        tj.fr?.title ||
        tj.fr_ht?.title ||
        `${unit?.grade ?? ""}e année · ${unit?.subject ?? ""} : ${unit?.unit_title ?? ""}`,
      summary:
        tj.fr?.summary ||
        tj.fr_ht?.summary ||
        familyCard?.fr_ht_summary ||
        `Dans l'unité ${unit?.unit_number ?? ""} (${unit?.unit_title ?? ""}), les élèves pratiquent le langage académique (${klu}) tout en explorant les notions clés.`,
      question:
        tj.fr?.dinner_question ||
        tj.fr_ht?.dinner_question ||
        dtp.fr_ht ||
        dtp.fr ||
        `Demandez à la maison : « Peux-tu m'expliquer un exemple de ${unit?.unit_title || "cette unité"} en français, en créole ou en anglais ? »`,
      keyWords: Array.isArray(tj.fr?.key_words)
        ? tj.fr.key_words
        : Array.isArray(tj.fr_ht?.key_words)
          ? tj.fr_ht.key_words
          : defaultWords,
    },
  ];
}

function extractPacketData(detail, wida = "3_4") {
  const activeWida = normalizeWidaTier(wida);
  const activeTier = getTierMeta(activeWida);
  const unit = detail?.unit || {};
  const connections = Array.isArray(detail?.connections) ? detail.connections : [];
  const primary = connections[0] || {};
  const scaffolds = primary.scaffolds_json || {};
  const standards = Array.isArray(unit.core_standards) ? unit.core_standards : [];
  const vocab = Array.isArray(primary.tier2_tier3_vocab) ? primary.tier2_tier3_vocab : [];
  const l1Watchouts = normalizeL1Watchouts(primary.l1_watchouts);
  const activities = Array.isArray(detail?.activities)
    ? [...detail.activities].sort(
        (a, b) => Number(a.activity_order || 0) - Number(b.activity_order || 0),
      )
    : [];
  const transfers = Array.isArray(detail?.cross_subject_transfers)
    ? detail.cross_subject_transfers
    : [];
  const exitTicket = normalizeExitTicket(primary.language_exit_ticket_json, unit, primary, vocab);
  const familyCards = normalizeFamilyCards(detail?.family_card, unit, primary, vocab);

  const widaCards = WIDA_TIERS.map((tier) => {
    const raw = scaffolds[tier.scaffoldKey] || scaffolds[tier.key] || {};
    return {
      ...tier,
      isActive: tier.key === activeWida,
      frames: Array.isArray(raw.sentence_frames) ? raw.sentence_frames : [],
      wordBank: Array.isArray(raw.word_bank) ? raw.word_bank : [],
      teacherMove: String(raw.teacher_move || "").trim(),
    };
  });

  const activeScaffold = widaCards.find((c) => c.isActive) || widaCards[1];

  return {
    activeWida,
    activeTier,
    unit,
    primary,
    standards,
    vocab,
    l1Watchouts,
    activities,
    transfers,
    exitTicket,
    familyCards,
    widaCards,
    activeScaffold,
  };
}

// ---------------------------------------------------------------------------
// 1. HTML5 Printable / PDF-Ready Classroom Packet
// ---------------------------------------------------------------------------

export function renderUnitHtmlPacket(detail, wida = "3_4") {
  const data = extractPacketData(detail, wida);
  const {
    unit,
    primary,
    standards,
    vocab,
    l1Watchouts,
    activities,
    transfers,
    exitTicket,
    familyCards,
    widaCards,
    activeTier,
    activeScaffold,
  } = data;

  const headerBadge = `BCPSS Grade ${unit.grade ?? ""} · ${unit.subject ?? ""} · ${unit.curriculum_name ?? ""} · Unit ${unit.unit_number ?? ""}`;
  const docTitle = `${headerBadge} — ${unit.unit_title ?? "Classroom Language Packet"}`;

  const standardsHtml = standards.length
    ? `<div class="pill-row">${standards
        .map((s) => `<span class="std-pill">${escapeHtml(s)}</span>`)
        .join("")}</div>`
    : "";

  const essentialQuestionHtml = unit.essential_question
    ? `<div class="eq-box"><span class="eq-label">Essential Question</span><p>${escapeHtml(unit.essential_question)}</p></div>`
    : "";

  const vocabRowsHtml = vocab.length
    ? vocab
        .map(
          (v) => `<tr>
            <td class="vocab-term">${escapeHtml(v.term)}</td>
            <td class="vocab-tier"><span class="tier-badge tier-${escapeHtml(v.tier ?? 3)}">Tier ${escapeHtml(v.tier ?? 3)}</span></td>
            <td>${escapeHtml(v.kid_def || v.definition || "")}</td>
            <td class="vocab-cognate">${escapeHtml(v.cognate_es || v.cognate || "Visual / model bridge")}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="muted">No unit vocabulary terms recorded.</td></tr>`;

  const transfersListHtml = transfers.length
    ? `<div class="transfer-grid">${transfers
        .slice(0, 4)
        .map(
          (t) => `<div class="transfer-chip">
            <div class="transfer-meta">Grade ${escapeHtml(t.grade)} ${escapeHtml(t.subject)} · Unit ${escapeHtml(t.unit_number)} (${escapeHtml(t.curriculum_name)})</div>
            <div class="transfer-title">${escapeHtml(t.unit_title)}</div>
            ${t.unit_example_frame ? `<div class="transfer-frame">“${escapeHtml(t.unit_example_frame)}”</div>` : ""}
          </div>`,
        )
        .join("")}</div>`
    : "";

  const widaCardsHtml = widaCards
    .map(
      (card) => `<section class="wida-card${card.isActive ? " is-active" : ""}">
        <div class="wida-card-head">
          <div>
            <span class="wida-level-title">${escapeHtml(card.label)}</span>
            <span class="wida-subtitle">${escapeHtml(card.subtitle)}</span>
          </div>
          ${card.isActive ? `<span class="active-badge">Active Tier</span>` : ""}
        </div>
        <div class="wida-card-body">
          <div class="wida-col-frames">
            <div class="micro-label">Sentence Frames</div>
            <ul class="frame-list">
              ${card.frames.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
            </ul>
          </div>
          <div class="wida-col-bank">
            <div class="micro-label">Word Bank</div>
            <div class="bank-chips">
              ${card.wordBank.map((w) => `<span class="word-chip">${escapeHtml(w)}</span>`).join("")}
            </div>
          </div>
        </div>
        ${
          card.teacherMove
            ? `<div class="teacher-move"><strong>Teacher Move:</strong> ${escapeHtml(card.teacherMove)}</div>`
            : ""
        }
      </section>`,
    )
    .join("");

  const l1RowsHtml = l1Watchouts.length
    ? l1Watchouts
        .map(
          (row) => `<tr>
            <td class="l1-lang">${escapeHtml(row.language)}</td>
            <td>${escapeHtml(row.frictionPoint)}</td>
            <td class="l1-fix">${escapeHtml(row.quickFix)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="muted">No L1 watchouts recorded for this unit.</td></tr>`;

  const activitiesHtml = activities.length
    ? activities
        .slice(0, 3)
        .map(
          (act, idx) => `<article class="activity-card">
            <div class="activity-head">
              <div class="activity-day-wrap">
                <span class="day-badge">Day ${escapeHtml(act.activity_order || idx + 1)}</span>
                <span class="activity-type">${escapeHtml(act.activity_type || "Micro-Activity")}</span>
              </div>
              <span class="prep-pill">Prep: ${escapeHtml(act.prep_time_minutes ?? 5)} min</span>
            </div>
            <h3 class="activity-title">${escapeHtml(act.title || `Day ${idx + 1} Pre-Teaching Activity`)}</h3>
            <p class="activity-copy"><strong>Teacher Instructions:</strong> ${escapeHtml(act.teacher_instructions || "")}</p>
            <div class="student-prompt-box">
              <span class="micro-label">Student Prompt</span>
              <p>${escapeHtml(act.student_prompt || "")}</p>
            </div>
          </article>`,
        )
        .join("")
    : `<p class="muted">No pre-teaching micro-activities recorded.</p>`;

  const rubricRowsHtml = exitTicket.rubric
    .map(
      (r) => `<tr>
        <td class="rubric-level">${escapeHtml(r.level)}</td>
        <td>${escapeHtml(r.criteria)}</td>
        <td>${escapeHtml(r.nextStep)}</td>
      </tr>`,
    )
    .join("");

  const deskStripsHtml = [1, 2, 3, 4]
    .map(
      (n) => `<div class="desk-strip${n < 4 ? " with-cut" : ""}">
        <div class="strip-head">
          <div class="strip-unit">Grade ${escapeHtml(unit.grade)} ${escapeHtml(unit.subject)} · Unit ${escapeHtml(unit.unit_number)}: ${escapeHtml(unit.unit_title)}</div>
          <div class="strip-badges">
            <span class="klu-mini">${escapeHtml(primary.wida_klu || "Explain")}</span>
            <span class="tier-mini">${escapeHtml(activeTier.label)}</span>
          </div>
        </div>
        <div class="strip-grid">
          <div class="strip-frames">
            <div class="micro-label">My Sentence Frames</div>
            <ul>
              ${activeScaffold.frames.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
            </ul>
          </div>
          <div class="strip-bank">
            <div class="micro-label">Power Word Bank</div>
            <div class="bank-chips">
              ${activeScaffold.wordBank.map((w) => `<span class="word-chip">${escapeHtml(w)}</span>`).join("")}
            </div>
          </div>
        </div>
        ${n < 4 ? `<div class="cut-hint">✂ cut along dashed line</div>` : ""}
      </div>`,
    )
    .join("");

  const familyCardsHtml = familyCards
    .map(
      (fc) => `<article class="family-card" dir="${fc.dir}">
        <div class="family-head">
          <span class="lang-code">${escapeHtml(fc.code)}</span>
          <span class="lang-name">${escapeHtml(fc.label)}</span>
        </div>
        <h3 class="family-title">${escapeHtml(fc.title)}</h3>
        <p class="family-summary">${escapeHtml(fc.summary)}</p>
        <div class="family-question">
          <div class="family-q-label">${fc.code === "ES" ? "Pregunta para conversar en casa" : fc.code === "AR" ? "سؤال للنقاش في المنزل" : fc.code === "FR / HT" ? "Question à discuter à la maison" : "Dinner-Table Question"}</div>
          <p>${escapeHtml(fc.question)}</p>
        </div>
        ${
          fc.keyWords.length
            ? `<div class="family-words">${fc.keyWords
                .map((w) => `<span class="family-word-chip">${escapeHtml(w)}</span>`)
                .join("")}</div>`
            : ""
        }
      </article>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: letter;
      margin: 0.55in;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-family: "Atkinson Hyperlegible", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.6pt;
      line-height: 1.42;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    h1, h2, h3, .serif {
      font-family: "Fraunces", Georgia, "Times New Roman", serif;
      margin: 0;
      color: #0f172a;
    }

    p {
      margin: 0 0 6pt 0;
    }

    .packet-shell {
      max-width: 7.4in;
      margin: 0 auto;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5pt solid #075568;
      padding-bottom: 5pt;
      margin-bottom: 10pt;
      gap: 8pt;
    }

    .page-kicker {
      font-size: 7.8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #075568;
    }

    .page-num {
      font-size: 7.8pt;
      font-weight: 700;
      color: #475569;
      white-space: nowrap;
    }

    .hero-badge {
      display: inline-block;
      background: #075568;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 3.5pt 8pt;
      border-radius: 3pt;
      margin-bottom: 6pt;
    }

    .unit-title {
      font-size: 20pt;
      line-height: 1.15;
      color: #075568;
      margin-bottom: 5pt;
    }

    .unit-summary {
      font-size: 9.8pt;
      color: #1e293b;
      margin-bottom: 7pt;
    }

    .eq-box {
      background: #f8fafc;
      border-left: 3pt solid #0e7490;
      padding: 6pt 9pt;
      margin-bottom: 7pt;
    }

    .eq-label {
      display: block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #075568;
      margin-bottom: 2pt;
    }

    .eq-box p {
      margin: 0;
      font-style: italic;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4pt;
      margin-bottom: 10pt;
    }

    .std-pill {
      display: inline-block;
      background: #e8f1f2;
      color: #075568;
      border: 0.75pt solid #94b8c2;
      border-radius: 999px;
      padding: 1.5pt 7pt;
      font-size: 7.8pt;
      font-weight: 700;
    }

    .blueprint-box {
      border: 1.2pt solid #075568;
      border-radius: 5pt;
      padding: 9pt 11pt;
      background: #f4f9fa;
      margin-bottom: 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .blueprint-top {
      display: flex;
      align-items: center;
      gap: 8pt;
      flex-wrap: wrap;
      margin-bottom: 5pt;
    }

    .klu-badge {
      background: #0e7490;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2.5pt 7pt;
      border-radius: 3pt;
    }

    .move-name {
      font-family: "Fraunces", Georgia, serif;
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .syntax-line {
      font-size: 8.8pt;
      color: #334155;
      margin-bottom: 6pt;
    }

    .frame-callout {
      background: #ffffff;
      border-left: 3.5pt solid #075568;
      border-top: 0.6pt solid #cbd5e1;
      border-right: 0.6pt solid #cbd5e1;
      border-bottom: 0.6pt solid #cbd5e1;
      padding: 6.5pt 9pt;
      border-radius: 0 4pt 4pt 0;
    }

    .frame-callout-label {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #075568;
      margin-bottom: 2pt;
    }

    .frame-callout-text {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .section-title {
      font-size: 11.5pt;
      color: #075568;
      margin: 10pt 0 5pt 0;
      padding-bottom: 2.5pt;
      border-bottom: 0.9pt solid #cbd5e1;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 9pt;
      font-size: 8.8pt;
    }

    th {
      background: #e8f1f2;
      color: #075568;
      text-align: left;
      font-weight: 700;
      padding: 5pt 6.5pt;
      border: 0.75pt solid #94a3b8;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 5pt 6.5pt;
      border: 0.75pt solid #cbd5e1;
      vertical-align: top;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .vocab-term {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }

    .vocab-tier {
      white-space: nowrap;
      width: 54pt;
    }

    .tier-badge {
      display: inline-block;
      font-size: 7.4pt;
      font-weight: 700;
      padding: 1.5pt 5pt;
      border-radius: 3pt;
      background: #e2e8f0;
      color: #1e293b;
    }

    .tier-badge.tier-3 {
      background: #dbeafe;
      color: #1e3a8a;
    }

    .tier-badge.tier-2 {
      background: #fef3c7;
      color: #92400e;
    }

    .vocab-cognate {
      color: #075568;
      font-weight: 600;
    }

    .bridge-box {
      background: #f8fafc;
      border: 0.9pt solid #94b8c2;
      border-left: 3.5pt solid #0e7490;
      border-radius: 4pt;
      padding: 7.5pt 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .bridge-title {
      font-size: 8.4pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #075568;
      margin-bottom: 3pt;
    }

    .transfer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6pt;
      margin-top: 6pt;
    }

    .transfer-chip {
      background: #ffffff;
      border: 0.7pt solid #cbd5e1;
      border-radius: 3.5pt;
      padding: 5pt 7pt;
    }

    .transfer-meta {
      font-size: 7.3pt;
      font-weight: 700;
      color: #0e7490;
      text-transform: uppercase;
    }

    .transfer-title {
      font-weight: 700;
      font-size: 8.6pt;
      color: #0f172a;
    }

    .transfer-frame {
      font-size: 8pt;
      color: #475569;
      font-style: italic;
      margin-top: 2pt;
    }

    .wida-card {
      border: 0.9pt solid #cbd5e1;
      border-radius: 5pt;
      padding: 8pt 10pt;
      margin-bottom: 8pt;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .wida-card.is-active {
      border: 1.6pt solid #075568;
      background: #f4f9fa;
    }

    .wida-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 0.75pt solid #cbd5e1;
    }

    .wida-level-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 10.8pt;
      font-weight: 700;
      color: #075568;
      margin-right: 6pt;
    }

    .wida-subtitle {
      font-size: 8.3pt;
      color: #475569;
      font-weight: 600;
    }

    .active-badge {
      background: #075568;
      color: #ffffff;
      font-size: 7.3pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2pt 6.5pt;
      border-radius: 999px;
    }

    .wida-card-body {
      display: grid;
      grid-template-columns: 1.65fr 1fr;
      gap: 10pt;
      margin-bottom: 5pt;
    }

    .micro-label {
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      margin-bottom: 3pt;
    }

    .frame-list {
      margin: 0;
      padding-left: 14pt;
      font-size: 8.8pt;
    }

    .frame-list li {
      margin-bottom: 3pt;
    }

    .bank-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 3.5pt;
    }

    .word-chip {
      display: inline-block;
      background: #e8f1f2;
      border: 0.6pt solid #94b8c2;
      color: #0f172a;
      border-radius: 3pt;
      padding: 1.5pt 5pt;
      font-size: 8pt;
      font-weight: 600;
    }

    .teacher-move {
      font-size: 8.4pt;
      color: #334155;
      background: #ffffff;
      border-top: 0.6pt dashed #cbd5e1;
      padding-top: 4pt;
      margin-top: 3pt;
    }

    .l1-lang {
      font-weight: 700;
      color: #075568;
      width: 96pt;
    }

    .l1-fix {
      color: #0f172a;
      font-weight: 500;
    }

    .activity-card {
      border: 0.85pt solid #cbd5e1;
      border-radius: 5pt;
      padding: 7.5pt 9.5pt;
      margin-bottom: 7.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .activity-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3.5pt;
    }

    .activity-day-wrap {
      display: flex;
      align-items: center;
      gap: 6pt;
    }

    .day-badge {
      background: #075568;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1.5pt 6pt;
      border-radius: 3pt;
      text-transform: uppercase;
    }

    .activity-type {
      font-size: 8pt;
      font-weight: 700;
      color: #0e7490;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .prep-pill {
      font-size: 7.8pt;
      font-weight: 700;
      color: #334155;
      background: #f1f5f9;
      border: 0.6pt solid #cbd5e1;
      padding: 1.5pt 6pt;
      border-radius: 999px;
    }

    .activity-title {
      font-size: 10.2pt;
      margin-bottom: 4pt;
      color: #0f172a;
    }

    .activity-copy {
      font-size: 8.6pt;
      color: #1e293b;
      margin-bottom: 5pt;
    }

    .student-prompt-box {
      background: #f8fafc;
      border-left: 2.5pt solid #0e7490;
      padding: 4.5pt 7.5pt;
      font-size: 8.5pt;
    }

    .student-prompt-box p {
      margin: 0;
    }

    .exit-box {
      border: 1.3pt solid #075568;
      border-radius: 5pt;
      padding: 8.5pt 10pt;
      background: #f4f9fa;
      margin-top: 8pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .exit-box h3 {
      font-size: 11pt;
      color: #075568;
      margin-bottom: 5pt;
    }

    .exit-meta {
      font-size: 8.7pt;
      margin-bottom: 5pt;
    }

    .lookfor-list {
      margin: 2pt 0 7pt 0;
      padding-left: 15pt;
      font-size: 8.5pt;
    }

    .lookfor-list li {
      margin-bottom: 2pt;
    }

    .rubric-level {
      font-weight: 700;
      color: #075568;
      white-space: nowrap;
      width: 90pt;
    }

    .desk-strip {
      position: relative;
      border: 1pt solid #075568;
      border-radius: 4pt;
      padding: 8pt 10pt 10pt 10pt;
      margin-bottom: 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .desk-strip.with-cut {
      border-bottom: 1.5pt dashed #444444;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      padding-bottom: 13pt;
      margin-bottom: 12pt;
    }

    .strip-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8pt;
      border-bottom: 0.75pt solid #cbd5e1;
      padding-bottom: 4pt;
      margin-bottom: 6pt;
    }

    .strip-unit {
      font-weight: 700;
      font-size: 9pt;
      color: #0f172a;
    }

    .strip-badges {
      display: flex;
      gap: 4pt;
      flex-shrink: 0;
    }

    .klu-mini {
      background: #0e7490;
      color: #ffffff;
      font-size: 7.2pt;
      font-weight: 700;
      padding: 1.5pt 5.5pt;
      border-radius: 3pt;
      text-transform: uppercase;
    }

    .tier-mini {
      background: #075568;
      color: #ffffff;
      font-size: 7.2pt;
      font-weight: 700;
      padding: 1.5pt 5.5pt;
      border-radius: 3pt;
    }

    .strip-grid {
      display: grid;
      grid-template-columns: 1.75fr 1fr;
      gap: 10pt;
    }

    .strip-frames ul {
      margin: 0;
      padding-left: 13pt;
      font-size: 8.6pt;
    }

    .strip-frames li {
      margin-bottom: 2.5pt;
    }

    .cut-hint {
      position: absolute;
      right: 8pt;
      bottom: -8pt;
      background: #ffffff;
      padding: 0 5pt;
      font-size: 7pt;
      color: #475569;
      letter-spacing: 0.04em;
    }

    .family-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10pt;
    }

    .family-card {
      border: 1pt solid #94b8c2;
      border-radius: 6pt;
      padding: 10pt 11pt;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .family-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1pt solid #e2e8f0;
      padding-bottom: 4pt;
      margin-bottom: 6pt;
    }

    .lang-code {
      background: #075568;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1.5pt 6pt;
      border-radius: 3pt;
    }

    .lang-name {
      font-size: 8.5pt;
      font-weight: 700;
      color: #075568;
    }

    .family-title {
      font-size: 10.4pt;
      color: #0f172a;
      margin-bottom: 5pt;
    }

    .family-summary {
      font-size: 8.8pt;
      color: #1e293b;
      margin-bottom: 7pt;
    }

    .family-question {
      background: #f4f9fa;
      border-left: 2.5pt solid #0e7490;
      padding: 6pt 8pt;
      border-radius: 3pt;
      margin-bottom: 7pt;
    }

    .family-card[dir="rtl"] .family-question {
      border-left: none;
      border-right: 2.5pt solid #0e7490;
    }

    .family-q-label {
      font-size: 7.3pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #075568;
      margin-bottom: 2pt;
    }

    .family-question p {
      margin: 0;
      font-size: 8.6pt;
    }

    .family-words {
      display: flex;
      flex-wrap: wrap;
      gap: 3.5pt;
    }

    .family-word-chip {
      background: #f1f5f9;
      border: 0.6pt solid #cbd5e1;
      border-radius: 3pt;
      padding: 1.5pt 5pt;
      font-size: 7.6pt;
      color: #334155;
      font-weight: 600;
    }

    .muted {
      color: #64748b;
      font-style: italic;
    }

    @media screen {
      body {
        background: #f1f5f9;
        padding: 18pt 12pt;
      }
      .packet-shell {
        background: #ffffff;
        padding: 0.55in;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
        border-radius: 6px;
      }
    }
  </style>
</head>
<body>
  <main class="packet-shell">
    <!-- PAGE 1: Unit Language Brief & Classroom Anchor Chart -->
    <section>
      <div class="page-header">
        <span class="page-kicker">BCPSS Curriculum-to-Language Hub · Classroom Resource Packet</span>
        <span class="page-num">Page 1 of 5 · Unit Language Brief</span>
      </div>

      <div class="hero-badge">${escapeHtml(headerBadge)}</div>
      <h1 class="unit-title">${escapeHtml(unit.unit_title || "Unit Language Brief")}</h1>
      <p class="unit-summary">${escapeHtml(unit.unit_summary || "")}</p>
      ${essentialQuestionHtml}
      ${standardsHtml}

      <div class="blueprint-box">
        <div class="blueprint-top">
          <span class="klu-badge">WIDA KLU: ${escapeHtml(primary.wida_klu || "Explain")}</span>
          <span class="move-name">${escapeHtml(primary.move_name || "Academic Language Move")}</span>
        </div>
        <div class="syntax-line"><strong>Syntactic Pattern:</strong> ${escapeHtml(primary.syntax_pattern || "")}</div>
        <div class="frame-callout">
          <div class="frame-callout-label">Unit Example Anchor Frame</div>
          <p class="frame-callout-text">${escapeHtml(primary.unit_example_frame || "")}</p>
        </div>
      </div>

      <h2 class="section-title">Tier 2 &amp; Tier 3 Academic Vocabulary &amp; Cognates</h2>
      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Tier</th>
            <th>Student-Friendly Definition</th>
            <th>Cognate / Bridge Hint</th>
          </tr>
        </thead>
        <tbody>
          ${vocabRowsHtml}
        </tbody>
      </table>

      <div class="bridge-box">
        <div class="bridge-title">Cross-Subject Transfer Bridge</div>
        <p>${escapeHtml(primary.cross_subject_bridge_note || "Connect this academic language move across Grade " + (unit.grade ?? "") + " ELA, Math, Science, and Social Studies.")}</p>
        ${transfersListHtml}
      </div>
    </section>

    <!-- PAGE 2: Differentiated WIDA Scaffolds & L1 Watchouts -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(headerBadge)} · ${escapeHtml(unit.unit_title || "")}</span>
        <span class="page-num">Page 2 of 5 · WIDA Scaffolds &amp; L1 Watchouts</span>
      </div>

      <h2 class="section-title" style="margin-top: 0;">Differentiated WIDA Scaffolds (Active Selection: ${escapeHtml(activeTier.label)})</h2>
      ${widaCardsHtml}

      <h2 class="section-title">L1 Linguistic Watchouts &amp; Quick Fixes</h2>
      <table>
        <thead>
          <tr>
            <th>Home Language</th>
            <th>Linguistic Friction Point</th>
            <th>1-Sentence Quick Fix</th>
          </tr>
        </thead>
        <tbody>
          ${l1RowsHtml}
        </tbody>
      </table>
    </section>

    <!-- PAGE 3: 3-Day Pre-Teaching Micro-Activities & 3-Minute Exit Ticket -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(headerBadge)} · ${escapeHtml(unit.unit_title || "")}</span>
        <span class="page-num">Page 3 of 5 · Micro-Activities &amp; Exit Ticket</span>
      </div>

      <h2 class="section-title" style="margin-top: 0;">3-Day Pre-Teaching Micro-Activities</h2>
      ${activitiesHtml}

      <div class="exit-box">
        <h3>3-Minute Language Exit Ticket</h3>
        <div class="exit-meta"><strong>Prompt:</strong> ${escapeHtml(exitTicket.prompt)}</div>
        <div class="exit-meta"><strong>Target Frame:</strong> ${escapeHtml(exitTicket.targetFrame)}</div>
        <div class="micro-label">Teacher Look-Fors</div>
        <ul class="lookfor-list">
          ${exitTicket.lookFors.map((lf) => `<li>${escapeHtml(lf)}</li>`).join("")}
        </ul>
        <table style="margin-bottom: 0;">
          <thead>
            <tr>
              <th>Proficiency Band</th>
              <th>Look-For Evidence</th>
              <th>Immediate Instructional Next Step</th>
            </tr>
          </thead>
          <tbody>
            ${rubricRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- PAGE 4: Cuttable Student Desk Strips -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(headerBadge)} · Cuttable Student Desk Strips</span>
        <span class="page-num">Page 4 of 5 · ${escapeHtml(activeTier.label)} (4× Strips)</span>
      </div>
      ${deskStripsHtml}
    </section>

    <!-- PAGE 5: Bilingual Family Home-Connection Card -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(headerBadge)} · Family Home-Connection Card</span>
        <span class="page-num">Page 5 of 5 · EN / ES / AR / FR</span>
      </div>
      <p class="unit-summary" style="font-size: 8.8pt; color: #475569; margin-bottom: 9pt;">
        Share or send home so families can talk about <strong>${escapeHtml(unit.unit_title || "this unit")}</strong> in their home language. Strong home-language conversations accelerate English academic transfer.
      </p>
      <div class="family-grid">
        ${familyCardsHtml}
      </div>
    </section>
  </main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 2. OOXML (.docx) Classroom Packet Builder (via zipStore)
// ---------------------------------------------------------------------------

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:color w:val="1E293B"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="100" w:line="264" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="0" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:color w:val="075568"/>
      <w:sz w:val="38"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="200" w:after="100"/>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="8" w:space="4" w:color="075568"/>
      </w:pBdr>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>
      <w:b/>
      <w:color w:val="075568"/>
      <w:sz w:val="26"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="140" w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="0E7490"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`;

function wRun(text, opts = {}) {
  const rPrParts = [];
  if (opts.font) {
    rPrParts.push(`<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}"/>`);
  }
  if (opts.bold) rPrParts.push("<w:b/>");
  if (opts.italic) rPrParts.push("<w:i/>");
  if (opts.color) rPrParts.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.size) rPrParts.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  if (opts.rtl) rPrParts.push("<w:rtl/>");
  const rPr = rPrParts.length ? `<w:rPr>${rPrParts.join("")}</w:rPr>` : "";
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function wParagraph(runs, opts = {}) {
  const pPrParts = [];
  if (opts.style) pPrParts.push(`<w:pStyle w:val="${opts.style}"/>`);
  if (opts.pageBreakBefore) pPrParts.push("<w:pageBreakBefore/>");
  if (opts.keepNext) pPrParts.push("<w:keepNext/>");
  if (opts.rtl) pPrParts.push("<w:bidi/>");
  if (opts.align) pPrParts.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.shading) {
    pPrParts.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shading}"/>`);
  }
  if (opts.borderLeft || opts.borderBottomDashed || opts.boxBorder) {
    const borders = [];
    if (opts.borderLeft) {
      borders.push(`<w:left w:val="single" w:sz="18" w:space="8" w:color="${opts.borderLeft}"/>`);
    }
    if (opts.borderBottomDashed) {
      borders.push(`<w:bottom w:val="dashed" w:sz="10" w:space="6" w:color="64748B"/>`);
    }
    if (opts.boxBorder) {
      borders.push(
        `<w:top w:val="single" w:sz="6" w:space="4" w:color="${opts.boxBorder}"/>`,
        `<w:bottom w:val="single" w:sz="6" w:space="4" w:color="${opts.boxBorder}"/>`,
        `<w:left w:val="single" w:sz="6" w:space="6" w:color="${opts.boxBorder}"/>`,
        `<w:right w:val="single" w:sz="6" w:space="6" w:color="${opts.boxBorder}"/>`,
      );
    }
    pPrParts.push(`<w:pBdr>${borders.join("")}</w:pBdr>`);
  }
  if (opts.indentLeft) {
    pPrParts.push(`<w:ind w:left="${opts.indentLeft}"/>`);
  }
  if (opts.spaceBefore !== undefined || opts.spaceAfter !== undefined) {
    const before = opts.spaceBefore !== undefined ? ` w:before="${opts.spaceBefore}"` : "";
    const after = opts.spaceAfter !== undefined ? ` w:after="${opts.spaceAfter}"` : "";
    pPrParts.push(`<w:spacing${before}${after} w:line="252" w:lineRule="auto"/>`);
  }
  const pPr = pPrParts.length ? `<w:pPr>${pPrParts.join("")}</w:pPr>` : "";
  const content = typeof runs === "string" ? wRun(runs, opts.runOpts) : runs.join("");
  return `<w:p>${pPr}${content}</w:p>`;
}

function wCell(paragraphs, { widthDxa, fill, vAlign = "top" } = {}) {
  const tcPrParts = [];
  if (widthDxa) tcPrParts.push(`<w:tcW w:w="${widthDxa}" w:type="dxa"/>`);
  if (fill) tcPrParts.push(`<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>`);
  tcPrParts.push(
    `<w:tcMar><w:top w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:left w:w="130" w:type="dxa"/><w:right w:w="130" w:type="dxa"/></w:tcMar>`,
  );
  tcPrParts.push(`<w:vAlign w:val="${vAlign}"/>`);
  const body = Array.isArray(paragraphs) ? paragraphs.join("") : paragraphs;
  return `<w:tc><w:tcPr>${tcPrParts.join("")}</w:tcPr>${body}</w:tc>`;
}

function wTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const gridCols = colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const tblPr = `<w:tblPr>
    <w:tblW w:w="${totalWidth}" w:type="dxa"/>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
      <w:left w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
      <w:right w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
    </w:tblBorders>
  </w:tblPr>`;

  const headerRow = headers
    ? `<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>${headers
        .map((h, idx) =>
          wCell(
            wParagraph(wRun(h, { bold: true, color: "075568", size: 18 }), {
              spaceBefore: 0,
              spaceAfter: 0,
            }),
            { widthDxa: colWidths[idx], fill: "E8F1F2" },
          ),
        )
        .join("")}</w:tr>`
    : "";

  const bodyRows = rows
    .map(
      (cells) =>
        `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells
          .map((cellContent, idx) => {
            if (typeof cellContent === "object" && cellContent !== null && cellContent.xml) {
              return wCell(cellContent.xml, {
                widthDxa: colWidths[idx],
                fill: cellContent.fill,
              });
            }
            return wCell(
              wParagraph(wRun(String(cellContent ?? ""), { size: 19 }), {
                spaceBefore: 0,
                spaceAfter: 0,
              }),
              { widthDxa: colWidths[idx] },
            );
          })
          .join("")}</w:tr>`,
    )
    .join("");

  return `<w:tbl>${tblPr}<w:tblGrid>${gridCols}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>`;
}

/**
 * Generate a valid, styled OOXML `.docx` archive (`Uint8Array`) for any BCPSS unit.
 */
export function renderUnitDocxPacket(detail, wida = "3_4") {
  const data = extractPacketData(detail, wida);
  const {
    unit,
    primary,
    standards,
    vocab,
    l1Watchouts,
    activities,
    transfers,
    exitTicket,
    familyCards,
    widaCards,
    activeTier,
    activeScaffold,
  } = data;

  const parts = [];

  // 1. Title & Unit Metadata Table
  parts.push(
    wParagraph(
      wRun(
        `BCPSS GRADE ${unit.grade ?? ""} · ${String(unit.subject ?? "").toUpperCase()} · ${String(unit.curriculum_name ?? "").toUpperCase()} · UNIT ${unit.unit_number ?? ""}`,
        { bold: true, color: "0E7490", size: 17 },
      ),
      { spaceBefore: 0, spaceAfter: 60 },
    ),
  );
  parts.push(wParagraph(unit.unit_title || "BCPSS Classroom Language Packet", { style: "Title" }));
  if (unit.unit_summary) {
    parts.push(wParagraph(unit.unit_summary, { spaceAfter: 100 }));
  }
  if (unit.essential_question) {
    parts.push(
      wParagraph(
        [
          wRun("Essential Question: ", { bold: true, color: "075568" }),
          wRun(unit.essential_question, { italic: true }),
        ],
        { borderLeft: "0E7490", shading: "F8FAFC", spaceAfter: 120 },
      ),
    );
  }

  const metaRows = [
    [
      {
        xml: wParagraph(wRun("Grade & Subject", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      `Grade ${unit.grade ?? ""} ${unit.subject ?? ""} (${unit.curriculum_name ?? ""}) — Unit ${unit.unit_number ?? ""}`,
    ],
    [
      {
        xml: wParagraph(wRun("Core Standards", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      standards.length ? standards.join(", ") : "District core standards",
    ],
    [
      {
        xml: wParagraph(wRun("WIDA Key Language Use", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      `${primary.wida_klu || "Explain"} — ${primary.move_name || ""}`,
    ],
    [
      {
        xml: wParagraph(wRun("Syntactic Pattern", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      primary.syntax_pattern || "",
    ],
    [
      {
        xml: wParagraph(wRun("Unit Example Frame", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "E8F1F2",
      },
      {
        xml: wParagraph(wRun(primary.unit_example_frame || "", { bold: true, size: 19 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
    ],
    [
      {
        xml: wParagraph(wRun("Cross-Subject Bridge", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      primary.cross_subject_bridge_note || "",
    ],
  ];
  if (transfers.length) {
    metaRows.push([
      {
        xml: wParagraph(wRun("Same-Grade Transfers", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      transfers
        .slice(0, 4)
        .map((t) => `${t.subject} Unit ${t.unit_number}: ${t.unit_title}`)
        .join(" | "),
    ]);
  }
  parts.push(wTable(null, metaRows, [2400, 7968]));

  // 2. Tier 2 / Tier 3 Vocabulary & Cognates Table
  parts.push(wParagraph("Tier 2 & Tier 3 Academic Vocabulary & Cognates", { style: "Heading1" }));
  const vocabRows = vocab.length
    ? vocab.map((v) => [
        { xml: wParagraph(wRun(v.term || "", { bold: true, size: 19 }), { spaceAfter: 0 }) },
        `Tier ${v.tier ?? 3}`,
        v.kid_def || v.definition || "",
        v.cognate_es || v.cognate || "Visual / model bridge",
      ])
    : [["—", "—", "No unit vocabulary recorded.", "—"]];
  parts.push(
    wTable(
      ["Term", "Tier", "Student-Friendly Definition", "Cognate / Bridge Hint"],
      vocabRows,
      [2000, 968, 4900, 2500],
    ),
  );

  // 3. Differentiated WIDA Sentence Frames & Word Banks
  parts.push(
    wParagraph(`Differentiated WIDA Scaffolds (Active Tier: ${activeTier.label})`, {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  for (const card of widaCards) {
    const titleSuffix = card.isActive ? " [ACTIVE TIER]" : "";
    parts.push(
      wParagraph(`${card.label} — ${card.subtitle}${titleSuffix}`, {
        style: "Heading2",
      }),
    );
    for (const frame of card.frames) {
      parts.push(
        wParagraph([wRun("• ", { bold: true, color: "075568" }), wRun(frame)], {
          indentLeft: 320,
          spaceAfter: 50,
        }),
      );
    }
    parts.push(
      wParagraph(
        [wRun("Word Bank: ", { bold: true, color: "075568" }), wRun(card.wordBank.join(" · "))],
        { shading: card.isActive ? "E8F1F2" : "F8FAFC", spaceAfter: 60 },
      ),
    );
    if (card.teacherMove) {
      parts.push(
        wParagraph(
          [wRun("Teacher Move: ", { bold: true, color: "0E7490" }), wRun(card.teacherMove)],
          { spaceAfter: 120 },
        ),
      );
    }
  }

  // 4. L1 Watchouts Table
  parts.push(wParagraph("L1 Watchouts & 1-Sentence Quick Fixes", { style: "Heading1" }));
  const l1Rows = l1Watchouts.length
    ? l1Watchouts.map((row) => [
        {
          xml: wParagraph(wRun(row.language, { bold: true, color: "075568", size: 19 }), {
            spaceAfter: 0,
          }),
        },
        row.frictionPoint,
        row.quickFix,
      ])
    : [["—", "No L1 watchouts recorded.", "—"]];
  parts.push(
    wTable(
      ["Home Language", "Linguistic Friction Point", "1-Sentence Quick Fix"],
      l1Rows,
      [1968, 4500, 3900],
    ),
  );

  // 5. 3-Day Pre-Teaching Micro-Activities
  parts.push(
    wParagraph("3-Day Pre-Teaching Micro-Activities", {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  for (let i = 0; i < Math.min(activities.length, 3); i++) {
    const act = activities[i];
    const dayNum = act.activity_order || i + 1;
    parts.push(
      wParagraph(
        `Day ${dayNum}: ${act.activity_type || "Micro-Activity"} (${act.prep_time_minutes ?? 5} min prep) — ${act.title || ""}`,
        { style: "Heading2" },
      ),
    );
    parts.push(
      wParagraph(
        [
          wRun("Teacher Instructions: ", { bold: true, color: "075568" }),
          wRun(act.teacher_instructions || ""),
        ],
        { spaceAfter: 60 },
      ),
    );
    parts.push(
      wParagraph(
        [wRun("Student Prompt: ", { bold: true, color: "0E7490" }), wRun(act.student_prompt || "")],
        { borderLeft: "0E7490", shading: "F8FAFC", spaceAfter: 120 },
      ),
    );
  }

  // 6. 3-Minute Language Exit Ticket & Quick Rubric
  parts.push(wParagraph("3-Minute Language Exit Ticket & Quick Rubric", { style: "Heading1" }));
  parts.push(
    wParagraph([wRun("Prompt: ", { bold: true, color: "075568" }), wRun(exitTicket.prompt)], {
      spaceAfter: 60,
    }),
  );
  parts.push(
    wParagraph(
      [wRun("Target Frame: ", { bold: true, color: "075568" }), wRun(exitTicket.targetFrame)],
      { shading: "E8F1F2", spaceAfter: 80 },
    ),
  );
  parts.push(
    wParagraph("Look-Fors:", { runOpts: { bold: true, color: "0E7490" }, spaceAfter: 40 }),
  );
  for (const lf of exitTicket.lookFors) {
    parts.push(
      wParagraph([wRun("• ", { bold: true, color: "075568" }), wRun(lf)], {
        indentLeft: 320,
        spaceAfter: 40,
      }),
    );
  }
  parts.push(
    wTable(
      ["Proficiency Band", "Look-For Evidence", "Immediate Next Step"],
      exitTicket.rubric.map((r) => [
        {
          xml: wParagraph(wRun(r.level, { bold: true, color: "075568", size: 18 }), {
            spaceAfter: 0,
          }),
        },
        r.criteria,
        r.nextStep,
      ]),
      [1968, 4400, 4000],
    ),
  );

  // 7. Cuttable Student Desk Strips (4x identical strips for active WIDA tier)
  parts.push(
    wParagraph(`Cuttable Student Desk Strips — ${activeTier.label} (4× Identical Strips)`, {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  for (let stripIdx = 1; stripIdx <= 4; stripIdx++) {
    parts.push(
      wParagraph(
        [
          wRun(
            `Grade ${unit.grade ?? ""} ${unit.subject ?? ""} · Unit ${unit.unit_number ?? ""}: ${unit.unit_title ?? ""}   |   `,
            { bold: true, color: "075568", size: 19 },
          ),
          wRun(`${primary.wida_klu || "Explain"} · ${activeTier.label}`, {
            bold: true,
            color: "0E7490",
            size: 18,
          }),
        ],
        { shading: "E8F1F2", spaceBefore: stripIdx === 1 ? 40 : 100, spaceAfter: 60 },
      ),
    );
    for (const frame of activeScaffold.frames) {
      parts.push(
        wParagraph([wRun("▸ ", { bold: true, color: "075568" }), wRun(frame, { size: 19 })], {
          indentLeft: 240,
          spaceAfter: 35,
        }),
      );
    }
    parts.push(
      wParagraph(
        [
          wRun("Word Bank: ", { bold: true, color: "075568", size: 18 }),
          wRun(activeScaffold.wordBank.join("  ·  "), { size: 18 }),
        ],
        {
          borderBottomDashed: stripIdx < 4,
          spaceAfter: stripIdx < 4 ? 140 : 60,
        },
      ),
    );
  }

  // 8. Bilingual Family Home-Connection Summary (EN, ES, AR, FR)
  parts.push(
    wParagraph("Bilingual Family Home-Connection Card (EN / ES / AR / FR)", {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  for (const fc of familyCards) {
    const isRtl = fc.dir === "rtl";
    parts.push(
      wParagraph(`${fc.code} — ${fc.label}: ${fc.title}`, {
        style: "Heading2",
        rtl: isRtl,
        align: isRtl ? "right" : "left",
      }),
    );
    parts.push(
      wParagraph(wRun(fc.summary, { rtl: isRtl }), {
        rtl: isRtl,
        align: isRtl ? "right" : "left",
        spaceAfter: 60,
      }),
    );
    parts.push(
      wParagraph(wRun(fc.question, { bold: true, color: "075568", rtl: isRtl }), {
        rtl: isRtl,
        align: isRtl ? "right" : "left",
        shading: "F4F9FA",
        spaceAfter: 60,
      }),
    );
    if (fc.keyWords.length) {
      parts.push(
        wParagraph(
          wRun(fc.keyWords.join(" · "), { italic: true, color: "475569", size: 18, rtl: isRtl }),
          {
            rtl: isRtl,
            align: isRtl ? "right" : "left",
            spaceAfter: 140,
          },
        ),
      );
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${parts.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="936" w:right="936" w:bottom="936" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return zipStore({
    "[Content_Types].xml": CONTENT_TYPES_XML,
    "_rels/.rels": ROOT_RELS_XML,
    "word/_rels/document.xml.rels": DOCUMENT_RELS_XML,
    "word/styles.xml": STYLES_XML,
    "word/document.xml": documentXml,
  });
}
