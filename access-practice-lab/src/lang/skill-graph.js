// Explainable skill evidence derived from the existing local language ledger.
// This is instructional practice evidence, not a proficiency or psychometric model.
export const SKILL_CATALOG_VERSION = "2026-10-23.1";

const groups = {
  Listening: [
    ["main-idea", "Identify a main idea"], ["supporting-details", "Identify supporting details"],
    ["directions", "Follow multistep directions"], ["sequence", "Recognize sequence"],
    ["cause-effect", "Recognize cause and effect"], ["comparisons", "Interpret comparisons"],
    ["visual-context", "Use visual context"], ["vocabulary-context", "Understand academic vocabulary in context"],
  ],
  Reading: [
    ["main-idea", "Identify a main idea"], ["evidence", "Locate relevant evidence"],
    ["main-detail", "Distinguish main ideas from details"], ["sequence", "Interpret sequence"],
    ["cause-effect", "Interpret cause and effect"], ["compare-sources", "Compare sources"],
    ["vocabulary-context", "Determine vocabulary meaning from context"], ["explain-evidence", "Explain how evidence supports an idea"],
  ],
  Speaking: [
    ["task", "Complete the communication task"], ["clear-idea", "State a clear idea"],
    ["details", "Include relevant details"], ["reasoning", "Explain reasoning"], ["evidence", "Use evidence"],
    ["organization", "Organize connected ideas"], ["vocabulary", "Use precise vocabulary"],
    ["sentence-expansion", "Expand sentences"], ["cohesion", "Use cohesive language"], ["understandable-delivery", "Maintain understandable delivery"],
  ],
  Writing: [
    ["task", "Address the prompt"], ["central-idea", "State a central idea"], ["organization", "Organize information"],
    ["evidence", "Include relevant evidence"], ["explain-evidence", "Explain evidence"], ["transitions", "Use transitions"],
    ["vocabulary", "Use academic vocabulary"], ["sentence-expansion", "Construct expanded sentences"],
    ["clarity", "Revise for clarity"], ["independent-production", "Produce independently with appropriate scaffolding"],
  ],
};

export const SKILLS = Object.freeze(Object.entries(groups).flatMap(([domain, rows]) => rows.map(([code, name]) => ({
  id: `${domain.toLowerCase()}.${code}`, code, domain, name, description: `Practice evidence for: ${name.toLowerCase()}.`, gradeBand: "3-8", parentSkillId: null, active: true,
}))))
;

const normalize = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clamp = (x) => Math.max(0, Math.min(1, Number(x) || 0));
function skillForQuestion(domain, skill) {
  const d = domain.toLowerCase();
  const key = normalize(skill);
  const aliases = {
    "main-idea": "main-idea", "main-idea-and-details": "main-idea", detail: "supporting-details",
    "supporting-detail": "supporting-details", evidence: "evidence", inference: "explain-evidence",
    vocabulary: "vocabulary-context", "academic-vocabulary": "vocabulary-context", sequence: "sequence",
    "cause-and-effect": "cause-effect", comparison: "comparisons", compare: "compare-sources",
    "following-directions": "directions", directions: "directions",
  };
  let wanted = aliases[key] || key;
  if (!aliases[key]) {
    if (/main-idea|central-idea/.test(key)) wanted = "main-idea";
    else if (/sequence|order-of-events/.test(key)) wanted = "sequence";
    else if (/cause|effect/.test(key)) wanted = "cause-effect";
    else if (/compar|contrast|similar/.test(key)) wanted = d === "reading" ? "compare-sources" : "comparisons";
    else if (/vocab|word-meaning|academic-word|academic-verb/.test(key)) wanted = "vocabulary-context";
    else if (/direction|instruction/.test(key)) wanted = "directions";
    else if (/visual|diagram|image/.test(key) && d === "listening") wanted = "visual-context";
    else if (/supporting-detail|detail/.test(key)) wanted = d === "reading" ? "main-detail" : "supporting-details";
    else if (/evidence|proof|quote/.test(key)) wanted = d === "reading" ? "evidence" : "";
  }
  if (!wanted) return null;
  return SKILLS.find((s) => s.domain.toLowerCase() === d && (s.code === wanted || s.id.endsWith(`.${wanted}`))) || null;
}

/** The skill node id a Listening/Reading skill tag (or an activity's skill text) maps to, or null. */
export function skillIdFor(domain, skill) {
  if (!domain || !skill) return null;
  if (SKILLS.some((s) => s.id === skill)) return skill;
  return skillForQuestion(String(domain), skill)?.id || null;
}

/** Convert supported ledger shapes into normalized, traceable evidence. */
export function evidenceFromLedger(entries = []) {
  const out = [];
  for (const entry of entries) {
    if (!entry || entry.kind !== "first") continue;
    const domain = String(entry.domain || "");
    if (Array.isArray(entry.m?.questions) && /^(listening|reading)$/i.test(domain)) {
      for (const [i, q] of entry.m.questions.entries()) {
        const skill = skillForQuestion(domain, q.skill);
        if (!skill || typeof q.ok !== "boolean") continue;
        out.push({ id: `${entry.id || entry.task}:${i}`, studentId: null, activityId: entry.task, responseId: entry.id || entry.task, skillId: skill.id, domain: skill.domain, evidenceType: "first-response", rawPerformance: q.ok ? 1 : 0, normalizedPerformance: q.ok ? 1 : 0, independenceLevel: entry.stage === "independent" && !Object.values(entry.supports || {}).some(Boolean) ? "independent" : "supported", confidence: 0.7, feedbackSource: "local-rule", modelVersion: null, promptVersion: null, teacherOverride: false, createdAt: entry.t || new Date(0).toISOString() });
      }
      continue;
    }
    if (!(domain === "Speaking" || domain === "Writing") || !entry.m) continue;
    const m = entry.m;
    const add = (code, performance, confidence = 0.55) => {
      const skill = SKILLS.find((s) => s.domain === domain && s.code === code);
      if (!skill || !Number.isFinite(performance)) return;
      out.push({ id: `${entry.id || entry.task}:${skill.id}`, studentId: null, activityId: entry.task, responseId: entry.id || entry.task, skillId: skill.id, domain, evidenceType: "local-language-analysis", rawPerformance: performance, normalizedPerformance: clamp(performance), independenceLevel: entry.stage === "independent" && !Object.values(entry.supports || {}).some(Boolean) ? "independent" : "supported", confidence, feedbackSource: "local-rule", modelVersion: null, promptVersion: null, teacherOverride: false, createdAt: entry.t || new Date(0).toISOString() });
    };
    const words = Number(m.words) || 0;
    if (domain === "Speaking") {
      const requiredMoves = Object.values(m.moves || {}).map(Number);
      add("task", requiredMoves.length ? requiredMoves.reduce((a, b) => a + b, 0) / requiredMoves.length : 0.4, 0.45);
      add("clear-idea", requiredMoves.length ? Math.max(...requiredMoves) : 0.4, 0.4);
      add("details", Math.min(1, ((Number(m.cites) || 0) + (Number(m.academic) || 0) / 2) / 3), 0.5);
      add("reasoning", Object.values(m.moves || {}).length ? Object.values(m.moves).reduce((a, b) => a + Number(b || 0), 0) / Object.values(m.moves).length : 0.4, 0.5);
      add("evidence", Math.min(1, (Number(m.cites) || 0) / 2), 0.5);
      add("organization", Math.min(1, (Number(m.link) || 0) / 3), 0.55);
      add("vocabulary", Math.min(1, (Number(m.academic) || 0) / 3), 0.55);
      add("sentence-expansion", Math.min(1, (Number(m.complex) || 0) / 2), 0.55);
      add("cohesion", Math.min(1, (Number(m.link) || 0) / 3), 0.55);
      // Delivery is not inferred from pauses, duration, accent, or transcription quality.
    } else {
      const requiredMoves = Object.values(m.moves || {}).map(Number);
      add("task", requiredMoves.length ? requiredMoves.reduce((a, b) => a + b, 0) / requiredMoves.length : 0.4, 0.45);
      add("central-idea", Object.values(m.moves || {}).some(Boolean) ? 0.7 : 0.4, 0.5);
      add("organization", Math.min(1, (Number(m.link) || 0) / 3), 0.55);
      add("evidence", Math.min(1, (Number(m.cites) || 0) / 2), 0.55);
      add("explain-evidence", Math.min(1, (Number(m.cites) || 0) / 2), 0.5);
      add("transitions", Math.min(1, (Number(m.link) || 0) / 3), 0.55);
      add("vocabulary", Math.min(1, (Number(m.academic) || 0) / 3), 0.55);
      add("sentence-expansion", Math.min(1, (Number(m.complex) || 0) / 2), 0.55);
      add("clarity", Math.max(0, 1 - (Number(m.errs ? Object.values(m.errs).reduce((a, b) => a + b, 0) : 0) / Math.max(words, 1))), 0.35);
      add("independent-production", entry.stage === "independent" ? 1 : 0.4, 0.5);
    }
  }
  return out;
}

/** Reading/listening activity outcomes exported by a student-controlled share file. */
export function evidenceFromPracticeRecords(records = {}) {
  const out = [];
  for (const [key, record] of Object.entries(records || {})) {
    if (!record || !["Listening", "Reading"].includes(record.domain)) continue;
    for (const [activityId, result] of Object.entries(record.results || {})) {
      if (typeof result?.ok !== "boolean") continue;
      const skill = skillForQuestion(record.domain, result.skill);
      if (!skill) continue;
      const createdAt = typeof result.date === "string" && !Number.isNaN(Date.parse(result.date)) ? result.date : new Date(0).toISOString();
      out.push({ id: `${key}:${activityId}`, studentId: null, activityId, responseId: `${key}:${activityId}`, skillId: skill.id, domain: skill.domain, evidenceType: "first-response", rawPerformance: result.ok ? 1 : 0, normalizedPerformance: result.ok ? 1 : 0, independenceLevel: result.supportUsed ? "supported" : "independent", confidence: 0.65, feedbackSource: "rule-based-check", modelVersion: null, promptVersion: null, teacherOverride: false, createdAt });
    }
  }
  return out;
}

/** No mastery claim is made until 3 evidence events span 2 distinct activities. */
export function summarizeSkill(evidence, { now = Date.now(), teacherOverride, minEvidence = 3, minActivities = 2, threshold = 0.7, halfLifeDays = 60 } = {}) {
  const independent = evidence.filter((e) => e.independenceLevel === "independent");
  const supported = evidence.filter((e) => e.independenceLevel !== "independent");
  const enough = evidence.length >= minEvidence && new Set(evidence.map((e) => e.activityId)).size >= minActivities;
  const weighted = (rows) => {
    let total = 0; let weights = 0;
    for (const e of rows) {
      const ageDays = Math.max(0, (now - Date.parse(e.createdAt || 0)) / 864e5);
      const w = Math.pow(0.5, ageDays / halfLifeDays) * clamp(e.confidence);
      total += clamp(e.normalizedPerformance) * w; weights += w;
    }
    return weights ? total / weights : null;
  };
  const independentMean = weighted(independent);
  const supportedMean = weighted(supported);
  const overall = weighted(evidence);
  const overridden = teacherOverride && Number.isFinite(teacherOverride.value);
  const status = overridden ? teacherOverride.value >= threshold ? "demonstrated" : "developing" : !enough ? "insufficient" : independent.length >= minEvidence && independentMean >= threshold ? "demonstrated" : supported.length >= minEvidence && supportedMean >= threshold ? "supported" : "developing";
  return { status, evidenceCount: evidence.length, activityCount: new Set(evidence.map((e) => e.activityId)).size, confidence: evidence.length === 0 ? "not enough" : evidence.length < 3 ? "limited" : "repeated", masteryEstimate: overall, independentMastery: independentMean, supportedMastery: supportedMean, independentEvidenceCount: independent.length, supportedEvidenceCount: supported.length, lastEvidenceAt: evidence.map((e) => e.createdAt).sort().at(-1) || null, evidence: evidence.slice().sort((a, b) => String(b.createdAt).localeCompare(a.createdAt)), teacherOverride: Boolean(overridden) };
}

export function buildSkillGraph(entries, recordsOrOptions = {}, finalOptions = {}) {
  const wrapped = !Array.isArray(recordsOrOptions) && Object.hasOwn(recordsOrOptions || {}, "records");
  const records = Array.isArray(recordsOrOptions) ? {} : wrapped ? recordsOrOptions.records : recordsOrOptions;
  const options = Array.isArray(recordsOrOptions) || !wrapped ? finalOptions : recordsOrOptions;
  const evidence = [...evidenceFromLedger(entries), ...evidenceFromPracticeRecords(records)];
  return SKILLS.map((skill) => ({ ...skill, ...summarizeSkill(evidence.filter((e) => e.skillId === skill.id), options) }));
}

export function recommendInstructionalGroups(students, options = {}) {
  const minSize = options.minSize || 2;
  const buckets = new Map();
  for (const student of students) {
    const graph = buildSkillGraph(student.ledger?.entries || [], student.records || {}, options);
    for (const skill of graph.filter((s) => s.status === "developing" || s.status === "supported")) {
      const b = buckets.get(skill.id) || { key: skill.id, label: skill.name, domain: skill.domain, members: [], evidence: [] };
      b.members.push(student.alias || "Student");
      b.evidence.push(...skill.evidence.slice(0, 3).map((e) => ({ student: student.alias || "Student", activityId: e.activityId, createdAt: e.createdAt, stage: e.independenceLevel })));
      buckets.set(skill.id, b);
    }
  }
  return [...buckets.values()].filter((g) => g.members.length >= minSize).map((g) => ({ ...g, members: [...new Set(g.members)], why: `${g.evidence.length} recent practice evidence points across this group; review the linked tasks before teaching.` })).filter((g) => g.members.length >= minSize);
}

export function makeMiniLesson(group, { now = new Date().toISOString() } = {}) {
  const objective = `Students will practice ${group.label.toLowerCase()} in a short academic response and support the response with evidence.`;
  const id = `lesson-${Date.now().toString(36)}`;
  return { id, groupKey: group.key, groupNeed: group.label, durationMinutes: 12, languageObjective: objective, studentObjective: `I can ${group.label.toLowerCase()} and show how I know.`, materials: ["A short, teacher-selected original classroom text, audio, or visual", "Board or paper"], teacherModel: `Model one clear example of ${group.label.toLowerCase()}. Think aloud about the language move and point to the evidence that supports it.`, guidedPractice: "Work through one new example together. Invite students to name the evidence and rehearse the language move.", studentPractice: "Students try a second, different example with a partner, then independently.", formativeCheck: `Ask each student to ${group.label.toLowerCase()} and point to one piece of evidence.`, scaffolds: ["Offer a visual or short word bank", "Provide a sentence frame only when needed"], fadeScaffolds: "Remove one support on the second try; keep access supports the student chooses.", homeLanguageConnection: "Invite students to plan the idea in a home language before sharing it in English, if useful.", extension: "Compare two valid examples and explain which evidence makes each one convincing.", evidenceToCollect: "Record the task, whether the response was independent or supported, and one observable language move.", evidenceRefs: group.evidence, status: "draft", provenance: { id: `provenance-${id}`, contentId: id, contentType: "mini-lesson", authorType: "approved-template", originalContentVerified: true, sourceDescription: "EduWonderLab instructional lesson template; teacher supplies original task content.", licensingStatus: "original-template", accessibilityChecked: true, biasChecked: false, approvedForStudents: false, approvalVersion: "lesson-template-v1", reviewedAt: null, reviewerId: null, createdAt: now, updatedAt: now }, createdAt: now, history: [] };
}

export function validateSkillEvidence(evidence) {
  return Boolean(evidence && typeof evidence.skillId === "string" && SKILLS.some((s) => s.id === evidence.skillId) && Number.isFinite(evidence.normalizedPerformance) && evidence.normalizedPerformance >= 0 && evidence.normalizedPerformance <= 1 && Number.isFinite(evidence.confidence) && evidence.confidence >= 0 && evidence.confidence <= 1 && typeof evidence.createdAt === "string");
}
