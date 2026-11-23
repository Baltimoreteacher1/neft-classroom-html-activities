// Shared canonical builders for BCPSS Curriculum-to-Language Ecosystem seeds.
// Converts authentic per-unit specifications into normalized bcpss_units,
// unit_connections, unit_activities, and bcpss_family_cards records.

import { CURRICULUM_BY_GRADE_SUBJECT, LANGUAGE_BLUEPRINTS } from "./blueprints.mjs";

const BLUEPRINT_BY_ID = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));

function isEarlyPrimary(grade) {
  return grade === "K" || grade === "1" || grade === "2" || grade === "3";
}

function buildDefaultL1Watchouts(spec) {
  const { grade, subject, blueprint_id, vocab = [], unit_title } = spec;
  const bp = BLUEPRINT_BY_ID.get(blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const firstTerm = vocab[0]?.term || unit_title;
  const secondTerm = vocab[1]?.term || firstTerm;
  const cognateExample = vocab.find((v) => v.cognate_es)?.cognate_es;
  const fundationsNote =
    subject === "ELA" && isEarlyPrimary(grade)
      ? " Fundations tie-in: explicitly tap out English short-vowel contrasts (/a/ vs. /u/, /i/ vs. /e/) and consonant digraphs (sh, ch, th, wh) when decoding unit words."
      : "";

  const spanishWatchout =
    subject === "Math"
      ? `Leverage Spanish cognates (${cognateExample ? `"${cognateExample}"` : `terms like "${firstTerm}"`}), but watch false friends and prepositions: English "by/per/for every" maps to "por/para", and Spanish decimals/commas differ in notation.`
      : subject === "Science"
        ? `Bridge Latin-root science cognates (${cognateExample ? `"${cognateExample}"` : `"${firstTerm}"`}); coach students on English subject pronouns ("It moves..." rather than omitting "it") and passive/causal connectors in ${klu} sentences.`
        : `Highlight Spanish cognates (${cognateExample ? `"${cognateExample}"` : `"${firstTerm}"`}) while explicitly modeling English auxiliary verbs ("did/does") and adjective-before-noun word order in "${unit_title}".${fundationsNote}`;

  const arabicWatchout =
    subject === "Math" || subject === "Science"
      ? `Arabic reads right-to-left while English equations, number lines, and cause-effect arrows track left-to-right; explicitly trace directionality and present-tense copula ("is/are") when defining "${firstTerm}" and "${secondTerm}".`
      : `Arabic omits the present-tense "to be" verb and uses different article/consonant-cluster patterns; provide oral rehearsal for "is/are/was" and consonant blends when discussing "${unit_title}".${fundationsNote}`;

  const frenchCreoleWatchout =
    subject === "Math" || subject === "Science"
      ? `French and Haitian Creole share strong academic cognates with English ("${firstTerm}", "${secondTerm}"), but watch Haitian Creole tense markers (te/ap/pral) vs. English -ed/-s inflections and English prepositions ("per", "across", "into").`
      : `Draw on French/Haitian Creole cognates for "${firstTerm}" while explicitly scaffolding English past-tense -ed endings, third-person -s, and possessive "'s" (French/Creole uses "de/pou" structures).${fundationsNote}`;

  return [
    { language: "Spanish", watchout: spanishWatchout },
    { language: "Arabic", watchout: arabicWatchout },
    { language: "French / Haitian Creole", watchout: frenchCreoleWatchout },
  ];
}

function buildDefaultExitTicket(spec) {
  const bp = BLUEPRINT_BY_ID.get(spec.blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const requiredVocab = (spec.vocab || []).slice(0, 3).map((v) => v.term);
  return {
    wida_klu: klu,
    blueprint_id: spec.blueprint_id,
    prompt: `In 2–3 sentences about "${spec.unit_title}", use the ${bp?.move_name || klu} frame and include at least two unit terms (${requiredVocab.join(", ")}).`,
    target_frame: spec.unit_example_frame,
    required_vocab: requiredVocab,
    success_criteria: [
      `Uses the target ${klu} connector accurately in context.`,
      `Integrates at least two Tier 2/Tier 3 terms (${requiredVocab.join(", ")}).`,
      `Cites a specific detail, model, or example from "${spec.unit_title}".`,
    ],
  };
}

export function buildUnitsAndConnections(specs) {
  const units = [];
  const connections = [];

  for (const spec of specs) {
    const curriculumName =
      spec.curriculum_name || CURRICULUM_BY_GRADE_SUBJECT[spec.grade]?.[spec.subject];
    if (!curriculumName) {
      throw new Error(`Missing curriculum mapping for Grade ${spec.grade} ${spec.subject}`);
    }
    if (!BLUEPRINT_BY_ID.has(spec.blueprint_id)) {
      throw new Error(`Unknown blueprint_id "${spec.blueprint_id}" on unit "${spec.id}"`);
    }

    units.push({
      id: spec.id,
      grade: String(spec.grade),
      subject: spec.subject,
      curriculum_name: curriculumName,
      unit_number: Number(spec.unit_number),
      unit_title: spec.unit_title,
      unit_summary: spec.unit_summary,
      core_standards: spec.core_standards,
      external_content_lab_url: spec.external_content_lab_url ?? null,
      external_content_lab_label: spec.external_content_lab_label ?? null,
    });

    connections.push({
      id: `conn-${spec.id}`,
      unit_id: spec.id,
      blueprint_id: spec.blueprint_id,
      unit_example_frame: spec.unit_example_frame,
      cross_subject_bridge_note: spec.cross_subject_bridge_note,
      l1_watchouts: spec.l1_watchouts || buildDefaultL1Watchouts(spec),
      tier2_tier3_vocab: spec.vocab,
      language_exit_ticket_json: spec.exit_ticket || buildDefaultExitTicket(spec),
    });
  }

  return { units, connections };
}

export function buildActivitiesForSubject(units, connections) {
  const connByUnit = new Map(connections.map((c) => [c.unit_id, c]));
  const activities = [];

  for (const unit of units) {
    const conn = connByUnit.get(unit.id);
    if (!conn) {
      throw new Error(`Missing unit_connection for unit ${unit.id}`);
    }
    const bp = BLUEPRINT_BY_ID.get(conn.blueprint_id);
    const vocabList = (conn.tier2_tier3_vocab || []).map((v) => v.term);
    const keyTerms = vocabList.slice(0, 3).join(", ");
    const cognateTerms = (conn.tier2_tier3_vocab || [])
      .filter((v) => v.cognate_es)
      .slice(0, 2)
      .map((v) => `${v.term} (${v.cognate_es})`)
      .join(" and ");
    const isStem = unit.subject === "Math" || unit.subject === "Science";
    const thirdType = isStem ? "Visual/Model Justification" : "Structured Partner Talk";
    const thirdRoute = isStem
      ? "/access-practice-lab/access-prep"
      : "/access-practice-lab/speak";

    // Activity 1: Sentence Architect
    activities.push({
      id: `act-${unit.id}-1`,
      unit_id: unit.id,
      activity_order: 1,
      activity_type: "Sentence Architect",
      title: `Sentence Architect: ${unit.unit_title}`,
      prep_time_minutes: 5,
      teacher_instructions: `Display the Grade ${unit.grade} ${unit.subject} target frame ("${conn.unit_example_frame}") alongside a word bank of ${keyTerms}. Model assembling one clause aloud using the ${bp.wida_klu} move (${bp.move_name}), then have students build and revise two unit sentences in pairs.`,
      student_prompt: `Use the Sentence Architect blocks to build a complete ${bp.wida_klu} sentence about "${unit.unit_title}" using the frame "${conn.unit_example_frame}" and at least two terms from: ${keyTerms}.`,
      target_lab_route: "/access-practice-lab/sentences",
    });

    // Activity 2: Cognate & Syntax Warm-Up
    activities.push({
      id: `act-${unit.id}-2`,
      unit_id: unit.id,
      activity_order: 2,
      activity_type: "Cognate & Syntax Warm-Up",
      title: `Cognate & Syntax Warm-Up: ${keyTerms}`,
      prep_time_minutes: 4,
      teacher_instructions: `Launch class with a 4-minute WordLab warm-up spotlighting ${cognateTerms || keyTerms} from "${unit.unit_title}". Have students sort Tier 2 connectors vs. Tier 3 content words, check L1 cognates (ES/AR/FR), and rehearse pronunciation before reading or problem-solving.`,
      student_prompt: `Sort the key terms (${keyTerms}) for "${unit.unit_title}", match each word to its home-language cognate or visual cue, and plug one term into the unit frame: "${conn.unit_example_frame}".`,
      target_lab_route: "/access-practice-lab/wordlab",
    });

    // Activity 3: Visual/Model Justification (Math/Science) OR Structured Partner Talk (ELA/Social Studies)
    activities.push({
      id: `act-${unit.id}-3`,
      unit_id: unit.id,
      activity_order: 3,
      activity_type: thirdType,
      title: isStem
        ? `Visual/Model Justification: ${unit.unit_title}`
        : `Structured Partner Talk: ${unit.unit_title}`,
      prep_time_minutes: 6,
      teacher_instructions: isStem
        ? `Give pairs a diagram, table, or worked model from Grade ${unit.grade} ${unit.subject} ("${unit.unit_title}"). Require each student to point to evidence on the model while orally rehearsing "${conn.unit_example_frame}" with ${keyTerms}, then record their justification.`
        : `Pair students in an A/B academic conversation about "${unit.unit_title}" using "${conn.unit_example_frame}". Partner A cites text or historical evidence using ${keyTerms}; Partner B paraphrases and extends using the ${bp.move_name} language move.`,
      student_prompt: isStem
        ? `Inspect the model for "${unit.unit_title}". Point to the key feature, explain your thinking using "${conn.unit_example_frame}", and include ${keyTerms} in your justification.`
        : `Take turns with your partner discussing "${unit.unit_title}". Use the frame "${conn.unit_example_frame}" and weave in ${keyTerms}, then listen and build on your partner's idea.`,
      target_lab_route: thirdRoute,
    });
  }

  return activities;
}

const SUBJECT_LABELS = {
  ELA: {
    en: "English Language Arts",
    es: "Artes del Lenguaje en Inglés",
    ar: "اللغة الإنجليزية وفنونها",
    fr: "Français / Arts du langage (ELA)",
  },
  Math: {
    en: "Mathematics",
    es: "Matemáticas",
    ar: "الرياضيات",
    fr: "Mathématiques",
  },
  Science: {
    en: "Science",
    es: "Ciencias",
    ar: "العلوم",
    fr: "Sciences",
  },
  "Social Studies": {
    en: "Social Studies",
    es: "Estudios Sociales",
    ar: "الدراسات الاجتماعية",
    fr: "Études sociales",
  },
};

export function buildFamilyCard(unit, conn, override = null) {
  if (override) {
    return {
      unit_id: unit.id,
      translations_json: override,
    };
  }

  const bp = BLUEPRINT_BY_ID.get(conn.blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const vocab = (conn.tier2_tier3_vocab || []).slice(0, 3);
  const enWords = vocab.map((v) => v.term);
  const esWords = vocab.map((v) => (v.cognate_es ? `${v.term} (${v.cognate_es})` : v.term));
  const gradeLabel = unit.grade === "K" ? "Kindergarten" : `Grade ${unit.grade}`;
  const gradeEs = unit.grade === "K" ? "Kínder" : `Grado ${unit.grade}`;
  const gradeAr = unit.grade === "K" ? "رياض الأطفال" : `الصف ${unit.grade}`;
  const gradeFr = unit.grade === "K" ? "Maternelle" : `${unit.grade}e année`;
  const subj = SUBJECT_LABELS[unit.subject] || SUBJECT_LABELS.ELA;

  return {
    unit_id: unit.id,
    translations_json: {
      en: {
        title: `${gradeLabel} ${subj.en}: ${unit.unit_title}`,
        summary: `In ${unit.curriculum_name}, your child is learning about ${unit.unit_title.toLowerCase()}. ${unit.unit_summary} In class, we are practicing how to ${klu.toLowerCase()} ideas clearly using words like ${enWords.join(", ")}.`,
        dinner_question: `Ask at home: "Can you teach me what '${enWords[0] || unit.unit_title}' means from your '${unit.unit_title}' unit and give me an example?"`,
        key_words: enWords,
      },
      es: {
        title: `${gradeEs} · ${subj.es}: ${unit.unit_title}`,
        summary: `En ${unit.curriculum_name}, su hijo/a está estudiando "${unit.unit_title}". En clase practicamos cómo explicar y compartir ideas completas en inglés usando vocabulario clave como ${esWords.join(", ")}.`,
        dinner_question: `Pregunte en casa: "¿Puedes explicarme con tus propias palabras qué significa '${esWords[0] || unit.unit_title}' en tu unidad de '${unit.unit_title}'?"`,
        key_words: esWords,
      },
      ar: {
        title: `${gradeAr} · ${subj.ar}: ${unit.unit_title}`,
        summary: `في منهج ${unit.curriculum_name}، يتعلّم طفلكم وحدة "${unit.unit_title}". ندرّب الطلاب في الصف على التعبير عن أفكارهم بجمل أكاديمية واضحة باستخدام كلمات مفتاحية مثل: ${enWords.join("، ")}.`,
        dinner_question: `اسألوا في المنزل: "هل يمكنك أن تشرح لي بلغتنا ما معنى '${enWords[0] || unit.unit_title}' في درس '${unit.unit_title}' وتعطيني مثالاً؟"`,
        key_words: enWords,
      },
      fr: {
        title: `${gradeFr} · ${subj.fr} : ${unit.unit_title}`,
        summary: `Avec ${unit.curriculum_name}, votre enfant étudie « ${unit.unit_title} ». En classe, nous pratiquons comment formuler des phrases académiques complètes avec des mots clés comme ${enWords.join(", ")}.`,
        dinner_question: `Demandez à la maison : « Peux-tu m'expliquer ce que signifie '${enWords[0] || unit.unit_title}' dans ton unité '${unit.unit_title}' et me donner un exemple ? »`,
        key_words: enWords,
      },
    },
  };
}
