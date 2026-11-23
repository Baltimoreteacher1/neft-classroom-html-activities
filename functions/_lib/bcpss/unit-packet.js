/**
 * Unified BCPSS K–8 Classroom Resource Packet Generator (HTML5 + OOXML DOCX).
 *
 * Pure Web-runtime ES module — runs identically in Cloudflare Pages Functions /
 * Workers and Node 18+ with zero Node-only APIs and zero external network
 * dependencies.
 */

import { zipStore } from "../../../assets/lib/zip-store.js";
import { renderEsolPacketPage } from "./esol-packet-html.js";

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
  return "Pre-teach the target connector with a visual cue and have students rehearse the frame aloud with a partner before writing.";
}

const EXCLUDED_L1_PATTERN = /\b(arabic|french|français|haitian|creole|krey[oò]l)\b/i;

function normalizeL1Watchouts(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const language = String(item.l1_group || item.language || "Spanish-English").trim();
      if (EXCLUDED_L1_PATTERN.test(language)) return null;
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
  ];
}

function maybeJson(val) {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return val;
    }
  }
  return val;
}

const CHUNK_TONES = {
  teal: { bg: "#e8f1f2", fg: "#075568", border: "#94b8c2", docxFill: "E8F1F2", docxText: "075568" },
  blue: { bg: "#dbeafe", fg: "#1e3a8a", border: "#93c5fd", docxFill: "DBEAFE", docxText: "1E3A8A" },
  amber: {
    bg: "#fef3c7",
    fg: "#92400e",
    border: "#fcd34d",
    docxFill: "FEF3C7",
    docxText: "92400E",
  },
  emerald: {
    bg: "#d1fae5",
    fg: "#065f46",
    border: "#6ee7b7",
    docxFill: "D1FAE5",
    docxText: "065F46",
  },
  coral: {
    bg: "#ffedd5",
    fg: "#9a3412",
    border: "#fdba74",
    docxFill: "FFEDD5",
    docxText: "9A3412",
  },
  slate: {
    bg: "#f1f5f9",
    fg: "#334155",
    border: "#cbd5e1",
    docxFill: "F1F5F9",
    docxText: "334155",
  },
};

const CHUNK_TONE_CYCLE = [
  CHUNK_TONES.teal,
  CHUNK_TONES.blue,
  CHUNK_TONES.amber,
  CHUNK_TONES.emerald,
  CHUNK_TONES.coral,
  CHUNK_TONES.slate,
];

function resolveChunkTone(colorToken, index = 0) {
  const key = String(colorToken || "")
    .trim()
    .toLowerCase();
  if (key.includes("teal") || key.includes("cyan")) return CHUNK_TONES.teal;
  if (key.includes("blue") || key.includes("navy") || key.includes("indigo")) {
    return CHUNK_TONES.blue;
  }
  if (key.includes("amber") || key.includes("gold") || key.includes("yellow")) {
    return CHUNK_TONES.amber;
  }
  if (key.includes("green") || key.includes("emerald") || key.includes("mint")) {
    return CHUNK_TONES.emerald;
  }
  if (
    key.includes("coral") ||
    key.includes("orange") ||
    key.includes("rose") ||
    key.includes("red")
  ) {
    return CHUNK_TONES.coral;
  }
  if (key.includes("slate") || key.includes("gray") || key.includes("grey")) {
    return CHUNK_TONES.slate;
  }
  return CHUNK_TONE_CYCLE[index % CHUNK_TONE_CYCLE.length];
}

function formatMinutesLabel(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") return "";
  if (typeof minutes === "number" && Number.isFinite(minutes)) return `${minutes} min`;
  const str = String(minutes).trim();
  if (!str) return "";
  return /\bmin/i.test(str) ? str : `${str} min`;
}

function formatClozeHtml(sentence) {
  const escaped = escapeHtml(sentence || "");
  return escaped.replace(
    /(?:_{3,}|\[blank\]|\{\{blank\}\})/gi,
    '<span class="cloze-blank"></span>',
  );
}

function formatClozeDocx(sentence) {
  return String(sentence || "").replace(/(?:_{3,}|\[blank\]|\{\{blank\}\})/gi, "________________");
}

function normalizePublisherMeta(raw, unit) {
  const pm = maybeJson(raw);
  const obj = pm && typeof pm === "object" && !Array.isArray(pm) ? pm : {};
  const fallbackImprint = [
    unit?.curriculum_name,
    unit?.subject,
    unit?.grade ? `Grade ${unit.grade}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    publisherImprint:
      String(obj.publisher_imprint || "").trim() || fallbackImprint || "BCPSS Core Curriculum",
    gradeBand: String(obj.grade_band || "").trim() || (unit?.grade ? `Grade ${unit.grade}` : ""),
    signatureProtocol: String(obj.signature_protocol || "").trim(),
  };
}

function normalizeMentorSentenceUnpacking(raw) {
  const parsed = maybeJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const mentorSentence = String(parsed.mentor_sentence || "").trim();
  const chunks = Array.isArray(parsed.chunks)
    ? parsed.chunks
        .filter((c) => c && typeof c === "object" && (c.text || c.role || c.student_question))
        .map((c, idx) => ({
          text: String(c.text || "").trim(),
          role: String(c.role || "").trim(),
          colorToken: String(c.color_token || "").trim(),
          studentQuestion: String(c.student_question || "").trim(),
          tone: resolveChunkTone(c.color_token, idx),
        }))
    : [];
  if (!mentorSentence && !chunks.length) return null;
  return { mentorSentence, chunks };
}

function normalizeLessonArc(raw) {
  const parsed = maybeJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (step) => step && typeof step === "object" && (step.phase || step.focus || step.teacher_move),
    )
    .map((step, idx) => ({
      phase: String(step.phase || `Phase ${idx + 1}`).trim(),
      minutesLabel: formatMinutesLabel(step.minutes),
      focus: String(step.focus || "").trim(),
      teacherMove: String(step.teacher_move || "").trim(),
      studentMove: String(step.student_move || "").trim(),
    }));
}

function normalizeClozeItems(raw) {
  const parsed = maybeJson(raw);
  if (!Array.isArray(parsed)) return { items: [], wordBank: [] };
  const items = parsed
    .filter((item) => item && typeof item === "object" && item.sentence_with_blank)
    .map((item) => ({
      sentenceWithBlank: String(item.sentence_with_blank || "").trim(),
      answer: String(item.answer || "").trim(),
      hint: String(item.hint || "").trim(),
    }));
  const seen = new Set();
  const wordBank = [];
  for (const item of items) {
    const key = item.answer.toLowerCase();
    if (item.answer && !seen.has(key)) {
      seen.add(key);
      wordBank.push(item.answer);
    }
  }
  wordBank.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return { items, wordBank };
}

function normalizePartnerTalk(raw) {
  const parsed = maybeJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const protocolName = String(parsed.protocol_name || "").trim();
  const roleATitle = String(parsed.role_a_title || "Partner A").trim();
  const roleAPrompt = String(parsed.role_a_prompt || "").trim();
  const roleBTitle = String(parsed.role_b_title || "Partner B").trim();
  const roleBPrompt = String(parsed.role_b_prompt || "").trim();
  const talkMoves = Array.isArray(parsed.talk_moves)
    ? parsed.talk_moves
        .filter((tm) => tm && typeof tm === "object" && (tm.label || tm.stem))
        .map((tm) => ({
          label: String(tm.label || "Talk Move").trim(),
          stem: String(tm.stem || "").trim(),
        }))
    : [];
  if (!protocolName && !roleAPrompt && !roleBPrompt && !talkMoves.length) return null;
  return {
    protocolName: protocolName || "Structured Partner Talk",
    roleATitle,
    roleAPrompt,
    roleBTitle,
    roleBPrompt,
    talkMoves,
  };
}

function normalizeMisconception(raw) {
  const parsed = maybeJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const misconceptionPattern = String(parsed.misconception_pattern || "").trim();
  const teacherRedirect = String(parsed.teacher_redirect || "").trim();
  if (!misconceptionPattern && !teacherRedirect) return null;
  return { misconceptionPattern, teacherRedirect };
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
  const publisherMeta = normalizePublisherMeta(unit.publisher_meta, unit);
  const mentorDive = normalizeMentorSentenceUnpacking(primary.mentor_sentence_unpacking);
  const lessonArc = normalizeLessonArc(primary.lesson_arc);
  const cloze = normalizeClozeItems(primary.interactive_cloze_items);
  const partnerTalk = normalizePartnerTalk(primary.partner_talk_protocol);
  const misconception = normalizeMisconception(primary.common_language_misconception);

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
    publisherMeta,
    mentorDive,
    lessonArc,
    cloze,
    partnerTalk,
    misconception,
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
    publisherMeta,
    mentorDive,
    lessonArc,
    cloze,
    partnerTalk,
    misconception,
  } = data;

  const headerBadge = `BCPSS Grade ${unit.grade ?? ""} · ${unit.subject ?? ""} · ${unit.curriculum_name ?? ""} · Unit ${unit.unit_number ?? ""}`;
  const runningImprint = publisherMeta.publisherImprint || headerBadge;
  const docTitle = `${runningImprint} · Unit ${unit.unit_number ?? ""} — ${unit.unit_title ?? "Classroom Language Packet"}`;

  const hasLessonDesignPage = Boolean(mentorDive || lessonArc.length || misconception);
  const hasStudentPracticePage = Boolean(cloze.items.length || partnerTalk);
  let pageCursor = 1;
  const pageBrief = pageCursor++;
  const pageLessonDesign = hasLessonDesignPage ? pageCursor++ : 0;
  const pageScaffolds = pageCursor++;
  const pageActivities = pageCursor++;
  const pageStudentPractice = hasStudentPracticePage ? pageCursor++ : 0;
  const pageDeskStrips = pageCursor++;
  const hasEsolPage = Boolean(detail?.esol_pack);
  const pageEsol = hasEsolPage ? pageCursor++ : 0;
  const pageFamily = pageCursor++;
  const totalPages = pageCursor - 1;

  const signatureProtocolHtml = publisherMeta.signatureProtocol
    ? `<span class="protocol-badge">${escapeHtml(publisherMeta.signatureProtocol)}</span>`
    : "";

  const mentorDiveHtml = mentorDive
    ? `<div class="mentor-dive-box">
        <div class="mentor-dive-head">
          <span class="mentor-kicker">Mentor Sentence Language Dive</span>
          <span class="klu-mini">${escapeHtml(primary.wida_klu || "Explain")}</span>
        </div>
        ${
          mentorDive.mentorSentence
            ? `<div class="mentor-quote">“${escapeHtml(mentorDive.mentorSentence)}”</div>`
            : ""
        }
        ${
          mentorDive.chunks.length
            ? `<table style="margin-bottom: 0;">
                <thead>
                  <tr>
                    <th style="width: 28%;">Syntactic Chunk</th>
                    <th style="width: 24%;">Language Role</th>
                    <th>Guiding Student Question</th>
                  </tr>
                </thead>
                <tbody>
                  ${mentorDive.chunks
                    .map(
                      (c) => `<tr>
                        <td><span class="chunk-pill" style="background:${c.tone.bg};color:${c.tone.fg};border-color:${c.tone.border};">${escapeHtml(c.text)}</span></td>
                        <td class="chunk-role">${escapeHtml(c.role)}</td>
                        <td>${escapeHtml(c.studentQuestion)}</td>
                      </tr>`,
                    )
                    .join("")}
                </tbody>
              </table>`
            : ""
        }
      </div>`
    : "";

  const lessonArcHtml = lessonArc.length
    ? `<h2 class="section-title">4-Phase Language-Embedded Lesson Arc</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 19%;">Phase &amp; Time</th>
            <th style="width: 23%;">Instructional Focus</th>
            <th style="width: 29%;">Teacher Move</th>
            <th style="width: 29%;">Student Move</th>
          </tr>
        </thead>
        <tbody>
          ${lessonArc
            .map(
              (step) => `<tr>
                <td>
                  <div class="phase-name">${escapeHtml(step.phase)}</div>
                  ${step.minutesLabel ? `<span class="phase-time">${escapeHtml(step.minutesLabel)}</span>` : ""}
                </td>
                <td class="phase-focus">${escapeHtml(step.focus)}</td>
                <td>${escapeHtml(step.teacherMove)}</td>
                <td>${escapeHtml(step.studentMove)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>`
    : "";

  const misconceptionHtml = misconception
    ? `<div class="misconception-box">
        <div class="misconception-title">Common Language Misconception &amp; Quick Redirect</div>
        ${
          misconception.misconceptionPattern
            ? `<p class="misconception-row"><strong>Watch For:</strong> ${escapeHtml(misconception.misconceptionPattern)}</p>`
            : ""
        }
        ${
          misconception.teacherRedirect
            ? `<p class="misconception-row" style="margin-bottom: 0;"><strong>Teacher Redirect:</strong> ${escapeHtml(misconception.teacherRedirect)}</p>`
            : ""
        }
      </div>`
    : "";

  const clozeHtml = cloze.items.length
    ? `<div class="cloze-section">
        <h2 class="section-title" style="margin-top: 0;">Context Cloze Practice — Academic Language in Use</h2>
        <p class="student-directions">Choose the best term from the Word Bank to complete each sentence accurately. Re-read your completed sentence aloud with a partner to check that it makes sense.</p>
        ${
          cloze.wordBank.length
            ? `<div class="cloze-bank-box">
                <div class="micro-label">Word Bank</div>
                <div class="bank-chips">
                  ${cloze.wordBank.map((w) => `<span class="word-chip">${escapeHtml(w)}</span>`).join("")}
                </div>
              </div>`
            : ""
        }
        <ol class="cloze-list">
          ${cloze.items
            .map(
              (item) => `<li>
                <div class="cloze-sentence">${formatClozeHtml(item.sentenceWithBlank)}</div>
                ${item.hint ? `<div class="cloze-hint">Hint: ${escapeHtml(item.hint)}</div>` : ""}
              </li>`,
            )
            .join("")}
        </ol>
      </div>`
    : "";

  const partnerTalkHtml = partnerTalk
    ? `<div class="partner-card">
        <div class="partner-head">
          <h2 class="partner-title">${escapeHtml(partnerTalk.protocolName)}</h2>
          <span class="klu-mini">Partner Talk Protocol</span>
        </div>
        <div class="partner-grid">
          <div class="role-box">
            <div class="role-badge">Role A · ${escapeHtml(partnerTalk.roleATitle)}</div>
            <p class="role-prompt">${escapeHtml(partnerTalk.roleAPrompt)}</p>
          </div>
          <div class="role-box">
            <div class="role-badge role-b">Role B · ${escapeHtml(partnerTalk.roleBTitle)}</div>
            <p class="role-prompt">${escapeHtml(partnerTalk.roleBPrompt)}</p>
          </div>
        </div>
        ${
          partnerTalk.talkMoves.length
            ? `<div class="talk-moves-wrap">
                <div class="micro-label">Academic Talk Moves</div>
                <div class="talk-moves-grid">
                  ${partnerTalk.talkMoves
                    .map(
                      (tm) => `<div class="talk-move-chip">
                        <span class="talk-move-label">${escapeHtml(tm.label)}</span>
                        <span class="talk-move-stem">“${escapeHtml(tm.stem)}”</span>
                      </div>`,
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
      </div>`
    : "";

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
        .map((act, idx) => {
          const dayLabel = act.day_label || `Day ${act.activity_order || idx + 1}`;
          const metaPills = [
            act.domain ? `<span class="activity-meta-pill">${escapeHtml(act.domain)}</span>` : "",
            act.grouping
              ? `<span class="activity-meta-pill">${escapeHtml(act.grouping)}</span>`
              : "",
            act.duration_minutes != null
              ? `<span class="activity-meta-pill">${escapeHtml(act.duration_minutes)} min</span>`
              : "",
            `<span class="prep-pill">Prep: ${escapeHtml(act.prep_time_minutes ?? 3)} min</span>`,
          ]
            .filter(Boolean)
            .join("");

          return `<article class="activity-card">
            <div class="activity-head">
              <div class="activity-day-wrap">
                <span class="day-badge">${escapeHtml(dayLabel)}</span>
                <span class="activity-type">${escapeHtml(act.activity_type || "Micro-Activity")}</span>
              </div>
              <div class="activity-meta-pills">${metaPills}</div>
            </div>
            <h3 class="activity-title">${escapeHtml(act.title || `Day ${idx + 1} Pre-Teaching Activity`)}</h3>
            <p class="activity-copy"><strong>Teacher Instructions:</strong> ${escapeHtml(act.teacher_instructions || "")}</p>
            <div class="student-prompt-box">
              <span class="micro-label">Student Prompt</span>
              <p>${escapeHtml(act.student_prompt || "")}</p>
            </div>
            ${
              act.worked_example
                ? `<div class="worked-example-box">
                    <span class="micro-label">Worked Example</span>
                    <p>${escapeHtml(act.worked_example)}</p>
                  </div>`
                : ""
            }
            ${
              act.check_for_understanding
                ? `<p class="cfu-line"><strong>Check for Understanding:</strong> ${escapeHtml(act.check_for_understanding)}</p>`
                : ""
            }
          </article>`;
        })
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
          <div class="family-q-label">${fc.code === "ES" ? "Pregunta para conversar en casa" : "Dinner-Table Question"}</div>
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

    .activity-meta-pills {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4pt;
    }

    .activity-meta-pill {
      font-size: 7.4pt;
      font-weight: 700;
      color: #075568;
      background: #e8f1f2;
      border: 0.6pt solid #94b8c2;
      padding: 1.5pt 5.5pt;
      border-radius: 999px;
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
      margin-bottom: 5pt;
    }

    .student-prompt-box p {
      margin: 0;
    }

    .worked-example-box {
      background: #f4f9fa;
      border-left: 2.5pt solid #075568;
      padding: 4.5pt 7.5pt;
      font-size: 8.4pt;
      margin-bottom: 5pt;
    }

    .worked-example-box p {
      margin: 0;
      font-style: italic;
      color: #0f172a;
    }

    .cfu-line {
      font-size: 8.2pt;
      color: #334155;
      margin: 0;
      padding-top: 3pt;
      border-top: 0.6pt dashed #cbd5e1;
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

    .masthead-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5pt;
      margin-bottom: 6pt;
    }

    .masthead-badges .hero-badge {
      margin-bottom: 0;
    }

    .protocol-badge {
      display: inline-block;
      background: #e8f1f2;
      color: #075568;
      border: 0.9pt solid #0e7490;
      font-size: 7.8pt;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 2.8pt 7.5pt;
      border-radius: 3pt;
    }

    .mentor-dive-box {
      border: 1.1pt solid #075568;
      border-radius: 5pt;
      padding: 8.5pt 10pt;
      background: #ffffff;
      margin-bottom: 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .mentor-dive-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5pt;
    }

    .mentor-kicker {
      font-family: "Fraunces", Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      color: #075568;
    }

    .mentor-quote {
      background: #f4f9fa;
      border-left: 3pt solid #0e7490;
      padding: 6.5pt 9pt;
      margin-bottom: 7pt;
      font-family: "Fraunces", Georgia, serif;
      font-size: 10.2pt;
      font-weight: 600;
      color: #0f172a;
      border-radius: 0 3.5pt 3.5pt 0;
    }

    .chunk-pill {
      display: inline-block;
      border: 0.75pt solid #94b8c2;
      border-radius: 3pt;
      padding: 2pt 5.5pt;
      font-weight: 700;
      font-size: 8.3pt;
      line-height: 1.3;
    }

    .chunk-role {
      font-weight: 700;
      color: #075568;
    }

    .phase-name {
      font-weight: 700;
      color: #075568;
      margin-bottom: 2pt;
    }

    .phase-time {
      display: inline-block;
      background: #e8f1f2;
      color: #0e7490;
      border-radius: 999px;
      padding: 1pt 5.5pt;
      font-size: 7.3pt;
      font-weight: 700;
    }

    .phase-focus {
      font-weight: 600;
      color: #0f172a;
    }

    .misconception-box {
      background: #fffbeb;
      border: 0.9pt solid #f59e0b;
      border-left: 3.5pt solid #b45309;
      border-radius: 4pt;
      padding: 7.5pt 10pt;
      margin-top: 8pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .misconception-title {
      font-size: 8.4pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #92400e;
      margin-bottom: 4pt;
    }

    .misconception-row {
      font-size: 8.7pt;
      color: #1e293b;
      margin-bottom: 4pt;
    }

    .student-sheet-bar {
      display: flex;
      justify-content: space-between;
      gap: 12pt;
      border: 0.9pt solid #94a3b8;
      background: #f8fafc;
      border-radius: 4pt;
      padding: 6.5pt 9pt;
      margin-bottom: 10pt;
      font-size: 8.6pt;
      font-weight: 700;
      color: #334155;
    }

    .student-directions {
      font-size: 8.6pt;
      color: #334155;
      margin-bottom: 7pt;
    }

    .cloze-bank-box {
      background: #f4f9fa;
      border: 1pt dashed #0e7490;
      border-radius: 4pt;
      padding: 6.5pt 9pt;
      margin-bottom: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .cloze-list {
      margin: 0 0 11pt 0;
      padding-left: 16pt;
      font-size: 9.2pt;
    }

    .cloze-list li {
      margin-bottom: 8.5pt;
      line-height: 1.65;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .cloze-blank {
      display: inline-block;
      min-width: 96pt;
      border-bottom: 1.1pt solid #0f172a;
      margin: 0 3pt;
      vertical-align: baseline;
    }

    .cloze-hint {
      font-size: 7.9pt;
      color: #475569;
      font-style: italic;
      margin-top: 1.5pt;
      line-height: 1.3;
    }

    .partner-card {
      border: 1.2pt solid #075568;
      border-radius: 5pt;
      padding: 9pt 10pt;
      background: #f4f9fa;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .partner-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8pt;
      margin-bottom: 7pt;
    }

    .partner-title {
      font-size: 11pt;
      color: #075568;
    }

    .partner-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt;
      margin-bottom: 8pt;
    }

    .role-box {
      background: #ffffff;
      border: 0.8pt solid #94b8c2;
      border-radius: 4pt;
      padding: 7pt 8.5pt;
    }

    .role-badge {
      display: inline-block;
      background: #075568;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1.5pt 6pt;
      border-radius: 3pt;
      margin-bottom: 4.5pt;
    }

    .role-badge.role-b {
      background: #0e7490;
    }

    .role-prompt {
      font-size: 8.7pt;
      color: #0f172a;
      margin: 0;
    }

    .talk-moves-wrap {
      background: #ffffff;
      border: 0.75pt solid #cbd5e1;
      border-radius: 4pt;
      padding: 6.5pt 8.5pt;
    }

    .talk-moves-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5pt 10pt;
    }

    .talk-move-chip {
      font-size: 8.3pt;
      line-height: 1.35;
    }

    .talk-move-label {
      font-weight: 700;
      color: #075568;
      margin-right: 4pt;
    }

    .talk-move-stem {
      color: #1e293b;
      font-style: italic;
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
    <!-- PAGE ${pageBrief}: Unit Language Brief & Classroom Anchor Chart -->
    <section>
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · BCPSS Classroom Resource Packet</span>
        <span class="page-num">Page ${pageBrief} of ${totalPages} · Unit Language Brief</span>
      </div>

      <div class="masthead-badges">
        <span class="hero-badge">${escapeHtml(headerBadge)}</span>
        ${signatureProtocolHtml}
      </div>
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

    ${
      hasLessonDesignPage
        ? `<!-- PAGE ${pageLessonDesign}: Mentor Sentence Dive, Lesson Arc & Misconception Redirect -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · ${escapeHtml(unit.unit_title || "")}</span>
        <span class="page-num">Page ${pageLessonDesign} of ${totalPages} · Language Dive &amp; Lesson Arc</span>
      </div>
      ${mentorDiveHtml}
      ${lessonArcHtml}
      ${misconceptionHtml}
    </section>`
        : ""
    }

    <!-- PAGE ${pageScaffolds}: Differentiated WIDA Scaffolds & L1 Watchouts -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · ${escapeHtml(unit.unit_title || "")}</span>
        <span class="page-num">Page ${pageScaffolds} of ${totalPages} · WIDA Scaffolds &amp; L1 Watchouts</span>
      </div>

      <h2 class="section-title" style="margin-top: 0;">Differentiated WIDA Scaffolds (Active Selection: ${escapeHtml(activeTier.label)})</h2>
      ${widaCardsHtml}

      <h2 class="section-title">Spanish–English L1 Linguistic Watchouts &amp; Quick Fixes</h2>
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

    <!-- PAGE ${pageActivities}: 5-Day Pre-Teaching & Practice Sequence & 3-Minute Exit Ticket -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · ${escapeHtml(unit.unit_title || "")}</span>
        <span class="page-num">Page ${pageActivities} of ${totalPages} · 5-Day Sequence &amp; Exit Ticket</span>
      </div>

      <h2 class="section-title" style="margin-top: 0;">5-Day Pre-Teaching &amp; Practice Sequence</h2>
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

    ${
      hasStudentPracticePage
        ? `<!-- PAGE ${pageStudentPractice}: Student-Ready Context Cloze & Partner Talk Card -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · Student Practice Sheet</span>
        <span class="page-num">Page ${pageStudentPractice} of ${totalPages} · Cloze &amp; Partner Talk</span>
      </div>
      <div class="student-sheet-bar">
        <span>Name: ____________________________________</span>
        <span>Date: _________________</span>
        <span>Period: _______</span>
      </div>
      ${clozeHtml}
      ${partnerTalkHtml}
    </section>`
        : ""
    }

    <!-- PAGE ${pageDeskStrips}: Cuttable Student Desk Strips -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · Cuttable Student Desk Strips</span>
        <span class="page-num">Page ${pageDeskStrips} of ${totalPages} · ${escapeHtml(activeTier.label)} (4× Strips)</span>
      </div>
      ${deskStripsHtml}
    </section>

    ${hasEsolPage ? renderEsolPacketPage({ pack: detail.esol_pack, unit, wida, esc: escapeHtml, pageNum: pageEsol, totalPages, runningImprint }) : ""}

    <!-- PAGE ${pageFamily}: Bilingual Family Home-Connection Card -->
    <section class="page-break">
      <div class="page-header">
        <span class="page-kicker">${escapeHtml(runningImprint)} · Family Home-Connection Card</span>
        <span class="page-num">Page ${pageFamily} of ${totalPages} · English / Español</span>
      </div>
      <p class="unit-summary" style="font-size: 8.8pt; color: #475569; margin-bottom: 9pt;">
        Share or send home so families can talk about <strong>${escapeHtml(unit.unit_title || "this unit")}</strong> in English or Spanish. Strong home-language conversations accelerate English academic transfer.
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
    publisherMeta,
    mentorDive,
    lessonArc,
    cloze,
    partnerTalk,
    misconception,
  } = data;

  const parts = [];

  // 1. Title & Unit Metadata Table
  const topKickerParts = [publisherMeta.publisherImprint, `UNIT ${unit.unit_number ?? ""}`].filter(
    Boolean,
  );
  if (publisherMeta.signatureProtocol) {
    topKickerParts.push(publisherMeta.signatureProtocol);
  }
  parts.push(
    wParagraph(
      wRun(topKickerParts.join("  ·  ").toUpperCase(), { bold: true, color: "0E7490", size: 17 }),
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
        xml: wParagraph(wRun("Publisher Imprint", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "F4F9FA",
      },
      publisherMeta.publisherImprint,
    ],
  ];
  if (publisherMeta.signatureProtocol) {
    metaRows.push([
      {
        xml: wParagraph(wRun("Signature Protocol", { bold: true, color: "075568", size: 18 }), {
          spaceAfter: 0,
        }),
        fill: "E8F1F2",
      },
      {
        xml: wParagraph(
          wRun(publisherMeta.signatureProtocol, { bold: true, color: "075568", size: 19 }),
          { spaceAfter: 0 },
        ),
        fill: "F4F9FA",
      },
    ]);
  }
  metaRows.push(
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
  );
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

  // 2b. Mentor Sentence Language Dive & 4-Phase Lesson Arc (when present)
  if (mentorDive || lessonArc.length || misconception) {
    let brokeLessonPage = false;
    if (mentorDive) {
      parts.push(
        wParagraph("Mentor Sentence Language Dive", {
          style: "Heading1",
          pageBreakBefore: true,
        }),
      );
      brokeLessonPage = true;
      if (mentorDive.mentorSentence) {
        parts.push(
          wParagraph(
            [
              wRun("Mentor Sentence: ", { bold: true, color: "075568" }),
              wRun(`“${mentorDive.mentorSentence}”`, { bold: true, font: "Georgia", size: 21 }),
            ],
            { borderLeft: "0E7490", shading: "F4F9FA", spaceAfter: 100 },
          ),
        );
      }
      if (mentorDive.chunks.length) {
        parts.push(
          wTable(
            ["Chunk", "Syntactic Role", "Guiding Question"],
            mentorDive.chunks.map((c) => [
              {
                xml: wParagraph(wRun(c.text, { bold: true, color: c.tone.docxText, size: 19 }), {
                  spaceAfter: 0,
                }),
                fill: c.tone.docxFill,
              },
              {
                xml: wParagraph(wRun(c.role, { bold: true, color: "075568", size: 18 }), {
                  spaceAfter: 0,
                }),
              },
              c.studentQuestion,
            ]),
            [2668, 2500, 5200],
          ),
        );
      }
    }

    if (lessonArc.length) {
      parts.push(
        wParagraph("4-Phase Language-Embedded Lesson Arc", {
          style: "Heading1",
          pageBreakBefore: !brokeLessonPage,
        }),
      );
      brokeLessonPage = true;
      parts.push(
        wTable(
          ["Phase & Time", "Instructional Focus", "Teacher Move", "Student Move"],
          lessonArc.map((step) => [
            {
              xml: [
                wParagraph(wRun(step.phase, { bold: true, color: "075568", size: 19 }), {
                  spaceAfter: step.minutesLabel ? 20 : 0,
                }),
                ...(step.minutesLabel
                  ? [
                      wParagraph(
                        wRun(step.minutesLabel, { bold: true, color: "0E7490", size: 17 }),
                        {
                          spaceAfter: 0,
                        },
                      ),
                    ]
                  : []),
              ],
              fill: "F4F9FA",
            },
            {
              xml: wParagraph(wRun(step.focus, { bold: true, size: 18 }), { spaceAfter: 0 }),
            },
            step.teacherMove,
            step.studentMove,
          ]),
          [1868, 2400, 3050, 3050],
        ),
      );
    }

    if (misconception) {
      parts.push(
        wParagraph("Common Language Misconception & Quick Redirect", {
          style: "Heading2",
          pageBreakBefore: !brokeLessonPage,
        }),
      );
      const miscRuns = [];
      if (misconception.misconceptionPattern) {
        miscRuns.push(wRun("Watch For: ", { bold: true, color: "92400E" }));
        miscRuns.push(wRun(`${misconception.misconceptionPattern}   `));
      }
      if (misconception.teacherRedirect) {
        miscRuns.push(wRun("Teacher Redirect: ", { bold: true, color: "075568" }));
        miscRuns.push(wRun(misconception.teacherRedirect));
      }
      parts.push(
        wParagraph(miscRuns, {
          borderLeft: "B45309",
          shading: "FFFBEB",
          spaceAfter: 120,
        }),
      );
    }
  }

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

  // 4. L1 Watchouts Table (Spanish-English only)
  parts.push(
    wParagraph("Spanish–English L1 Watchouts & 1-Sentence Quick Fixes", { style: "Heading1" }),
  );
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

  // 5. 5-Day Pre-Teaching & Practice Sequence
  parts.push(
    wParagraph("5-Day Pre-Teaching & Practice Sequence", {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const dayLabel = act.day_label || `Day ${act.activity_order || i + 1}`;
    parts.push(
      wParagraph(`${dayLabel} — ${act.activity_type || "Micro-Activity"}: ${act.title || ""}`, {
        style: "Heading2",
      }),
    );
    const metaTokens = [
      act.domain ? `Domain: ${act.domain}` : "",
      act.grouping ? `Grouping: ${act.grouping}` : "",
      act.duration_minutes != null ? `Duration: ${act.duration_minutes} min` : "",
      `Prep: ${act.prep_time_minutes ?? 3} min`,
    ].filter(Boolean);
    parts.push(
      wParagraph(wRun(metaTokens.join("  ·  "), { bold: true, color: "0E7490", size: 18 }), {
        spaceAfter: 50,
      }),
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
        { borderLeft: "0E7490", shading: "F8FAFC", spaceAfter: 60 },
      ),
    );
    if (act.worked_example) {
      parts.push(
        wParagraph(
          [
            wRun("Worked Example: ", { bold: true, color: "075568" }),
            wRun(act.worked_example, { italic: true }),
          ],
          { borderLeft: "075568", shading: "F4F9FA", spaceAfter: 60 },
        ),
      );
    }
    if (act.check_for_understanding) {
      parts.push(
        wParagraph(
          [
            wRun("Check for Understanding: ", { bold: true, color: "075568" }),
            wRun(act.check_for_understanding),
          ],
          { spaceAfter: 120 },
        ),
      );
    }
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

  // 6b. Student Practice Sheet: Context Cloze & Partner Talk (when present)
  if (cloze.items.length || partnerTalk) {
    parts.push(
      wParagraph("Student Practice Sheet — Context Cloze & Partner Talk", {
        style: "Heading1",
        pageBreakBefore: true,
      }),
    );
    parts.push(
      wParagraph(
        wRun("Name: _____________________________     Date: _______________     Period: _______", {
          bold: true,
          color: "334155",
          size: 19,
        }),
        { shading: "F8FAFC", boxBorder: "CBD5E1", spaceAfter: 120 },
      ),
    );

    if (cloze.items.length) {
      parts.push(wParagraph("Context Cloze Practice", { style: "Heading2" }));
      parts.push(
        wParagraph(
          "Choose the best word from the Word Bank to complete each sentence. Re-read your completed sentence aloud with a partner.",
          { runOpts: { italic: true, color: "475569", size: 19 }, spaceAfter: 80 },
        ),
      );
      if (cloze.wordBank.length) {
        parts.push(
          wParagraph(
            [
              wRun("Word Bank:  ", { bold: true, color: "075568", size: 19 }),
              wRun(cloze.wordBank.join("   ·   "), { bold: true, size: 19 }),
            ],
            { shading: "E8F1F2", boxBorder: "0E7490", spaceAfter: 120 },
          ),
        );
      }
      cloze.items.forEach((item, idx) => {
        parts.push(
          wParagraph(
            [
              wRun(`${idx + 1}. `, { bold: true, color: "075568", size: 20 }),
              wRun(formatClozeDocx(item.sentenceWithBlank), { size: 20 }),
            ],
            { spaceAfter: item.hint ? 25 : 100 },
          ),
        );
        if (item.hint) {
          parts.push(
            wParagraph(wRun(`Hint: ${item.hint}`, { italic: true, color: "475569", size: 18 }), {
              indentLeft: 320,
              spaceAfter: 90,
            }),
          );
        }
      });
    }

    if (partnerTalk) {
      parts.push(
        wParagraph(`Partner Talk Protocol — ${partnerTalk.protocolName}`, { style: "Heading2" }),
      );
      parts.push(
        wTable(
          [`Role A · ${partnerTalk.roleATitle}`, `Role B · ${partnerTalk.roleBTitle}`],
          [[partnerTalk.roleAPrompt || "—", partnerTalk.roleBPrompt || "—"]],
          [5184, 5184],
        ),
      );
      if (partnerTalk.talkMoves.length) {
        parts.push(
          wParagraph("Academic Talk Moves", {
            runOpts: { bold: true, color: "075568", size: 19 },
            spaceBefore: 100,
            spaceAfter: 40,
          }),
        );
        parts.push(
          wTable(
            ["Talk Move", "Sentence Stem"],
            partnerTalk.talkMoves.map((tm) => [
              {
                xml: wParagraph(wRun(tm.label, { bold: true, color: "075568", size: 18 }), {
                  spaceAfter: 0,
                }),
                fill: "F4F9FA",
              },
              {
                xml: wParagraph(wRun(`“${tm.stem}”`, { italic: true, size: 19 }), {
                  spaceAfter: 0,
                }),
              },
            ]),
            [2668, 7700],
          ),
        );
      }
    }
  }

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

  // 8. Bilingual Family Home-Connection Summary (English & Español side-by-side)
  parts.push(
    wParagraph("Bilingual Family Home-Connection Card (English / Español)", {
      style: "Heading1",
      pageBreakBefore: true,
    }),
  );
  parts.push(
    wParagraph(
      `Share or send home so families can talk about "${unit.unit_title || "this unit"}" in English or Spanish. Strong home-language conversations accelerate English academic transfer.`,
      { runOpts: { italic: true, color: "475569", size: 19 }, spaceAfter: 100 },
    ),
  );
  const familyCells = familyCards.slice(0, 2).map((fc) => {
    const qLabel = fc.code === "ES" ? "Pregunta para conversar en casa:" : "Dinner-Table Question:";
    const cellParas = [
      wParagraph(wRun(fc.title, { bold: true, color: "075568", size: 20 }), { spaceAfter: 60 }),
      wParagraph(wRun(fc.summary, { size: 19 }), { spaceAfter: 80 }),
      wParagraph(
        [
          wRun(`${qLabel} `, { bold: true, color: "075568", size: 18 }),
          wRun(fc.question, { size: 18 }),
        ],
        { shading: "F4F9FA", borderLeft: "0E7490", spaceAfter: 80 },
      ),
    ];
    if (fc.keyWords.length) {
      cellParas.push(
        wParagraph(wRun(fc.keyWords.join(" · "), { italic: true, color: "475569", size: 18 }), {
          spaceAfter: 0,
        }),
      );
    }
    return { xml: cellParas };
  });
  parts.push(
    wTable(
      familyCards.slice(0, 2).map((fc) => `${fc.code} — ${fc.label}`),
      [familyCells],
      [5184, 5184],
    ),
  );

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
