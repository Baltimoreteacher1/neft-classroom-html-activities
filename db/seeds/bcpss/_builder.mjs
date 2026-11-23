// Shared canonical builders for BCPSS Curriculum-to-Language Ecosystem seeds.
// Converts authentic per-unit specifications into normalized bcpss_units,
// unit_connections, unit_activities, and bcpss_family_cards records.

import { CURRICULUM_BY_GRADE_SUBJECT, LANGUAGE_BLUEPRINTS } from "./blueprints.mjs";

const BLUEPRINT_BY_ID = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));

function isEarlyPrimary(grade) {
  return grade === "K" || grade === "1" || grade === "2" || grade === "3";
}

function getGradeBand(grade) {
  if (grade === "K" || grade === "1" || grade === "2") return "K-2";
  if (grade === "3" || grade === "4" || grade === "5") return "3-5";
  return "6-8";
}

function formatStudentDef(rawDef, term, unitTitle) {
  const cleaned = String(rawDef || "").trim();
  if (!cleaned) {
    return `Key academic term used in "${unitTitle}" (${term}).`;
  }
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function normalizeVocabList(vocab = [], unitTitle = "") {
  return vocab.map((item) => {
    const term = String(item?.term || "").trim();
    const tier = Number(item?.tier) === 3 ? 3 : 2;
    const studentFriendlyDef = formatStudentDef(
      item?.student_friendly_def || item?.kid_def,
      term,
      unitTitle,
    );
    const cognateEs = item?.cognate_es ? String(item.cognate_es).trim() : null;
    const cognateHint = item?.cognate_hint
      ? String(item.cognate_hint).trim()
      : cognateEs
        ? `Spanish cognate: ${cognateEs}`
        : null;

    return {
      term,
      tier,
      student_friendly_def: studentFriendlyDef,
      cognate_hint: cognateHint,
      kid_def: studentFriendlyDef,
      cognate_es: cognateEs,
    };
  });
}

function buildDefaultEssentialQuestion(spec, normalizedVocab) {
  if (spec.essential_question && String(spec.essential_question).trim()) {
    return String(spec.essential_question).trim();
  }
  const title = String(spec.unit_title || "").trim();
  if (title.endsWith("?")) {
    return title;
  }
  const band = getGradeBand(String(spec.grade));
  const firstTerm = normalizedVocab[0]?.term || "key concepts";
  const secondTerm = normalizedVocab[1]?.term || "evidence";

  if (spec.subject === "Math") {
    if (band === "K-2") {
      return `How can we use ${firstTerm} and visual models to solve problems in ${title}?`;
    }
    if (band === "3-5") {
      return `How do ${firstTerm} and ${secondTerm} help us represent and justify solutions in ${title}?`;
    }
    return `How can we use ${firstTerm}, ${secondTerm}, and mathematical models to reason about ${title}?`;
  }

  if (spec.subject === "Science") {
    if (band === "K-2") {
      return `What can we observe in ${title}, and how does ${firstTerm} help explain what happens?`;
    }
    if (band === "3-5") {
      return `How do observations and models of ${firstTerm} explain patterns in ${title}?`;
    }
    return `How do evidence and scientific models of ${firstTerm} and ${secondTerm} explain ${title}?`;
  }

  if (spec.subject === "Social Studies") {
    if (band === "K-2") {
      return `How do ${firstTerm} and ${secondTerm} help people live and work together in ${title}?`;
    }
    if (band === "3-5") {
      return `How did ${firstTerm} and ${secondTerm} shape communities and decisions in ${title}?`;
    }
    return `How did ${firstTerm}, ${secondTerm}, and historical choices shape societies in ${title}?`;
  }

  // ELA
  if (band === "K-2") {
    return `What can we learn from texts about ${title}, and how can we share our ideas clearly?`;
  }
  if (band === "3-5") {
    return `How do authors use details, ${firstTerm}, and ${secondTerm} to deepen our understanding of ${title}?`;
  }
  return `How do texts and perspectives on ${title} reveal ideas about ${firstTerm} and ${secondTerm}?`;
}

function buildDefaultL1Watchouts(spec, normalizedVocab) {
  const { grade, subject, blueprint_id, unit_title } = spec;
  const bp = BLUEPRINT_BY_ID.get(blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const firstTerm = normalizedVocab[0]?.term || unit_title;
  const secondTerm = normalizedVocab[1]?.term || firstTerm;
  const cognateEntry = normalizedVocab.find((v) => v.cognate_es);
  const cognateLabel = cognateEntry
    ? `"${cognateEntry.term}" / "${cognateEntry.cognate_es}"`
    : `terms like "${firstTerm}"`;
  const isK3Ela = subject === "ELA" && isEarlyPrimary(String(grade));

  let spanishFriction;
  let spanishFix;
  if (subject === "Math") {
    spanishFriction = `English rate and comparison prepositions ("by", "per", "for every") collapse into "por/para", and Spanish decimal/comma conventions differ when expressing "${firstTerm}" and "${secondTerm}".`;
    spanishFix = `Anchor Spanish cognates (${cognateLabel}), color-code English prepositions on the model, and orally rehearse the ${klu} frame before solving.`;
  } else if (subject === "Science") {
    spanishFriction = `Spanish often omits dummy subject pronouns ("it") and uses reflexive verbs where English ${klu} science sentences require explicit subjects and causal connectors around "${firstTerm}".`;
    spanishFix = `Bridge Latin-root cognates (${cognateLabel}) and prompt students to underline the explicit subject ("It / The ${firstTerm}") before writing their ${klu} response.`;
  } else if (isK3Ela) {
    spanishFriction = `Spanish uses five pure vowels and noun-before-adjective order, creating friction with English short-vowel contrasts (/a/ vs. /u/, /i/ vs. /e/), consonant digraphs (sh, ch, th, wh), and auxiliary "do/did" in "${unit_title}".`;
    spanishFix = `Connect Spanish cognates (${cognateLabel}), tap out Fundations short vowels and digraphs on "${firstTerm}", and choral-read the ${klu} frame before partner talk.`;
  } else {
    spanishFriction = `Spanish places adjectives after nouns and omits English auxiliary "do/did" in questions, which can disrupt complex ${klu} clauses when analyzing "${firstTerm}" and "${secondTerm}" in "${unit_title}".`;
    spanishFix = `Spotlight Spanish cognates (${cognateLabel}) on a word wall and model English subject–verb–connector order directly inside the unit frame.`;
  }

  let arabicFriction;
  let arabicFix;
  if (subject === "Math" || subject === "Science") {
    arabicFriction = `Arabic reads right-to-left and omits the present-tense "to be" verb ("is/are"), creating friction when tracking left-to-right equations, number lines, or cause–effect arrows for "${firstTerm}" and "${secondTerm}".`;
    arabicFix = `Trace left-to-right arrows physically on diagrams or models and embed bolded "is/are" copula stems inside the ${klu} frame during oral rehearsal.`;
  } else if (isK3Ela) {
    arabicFriction = `Arabic omits present-tense "is/are", tracks right-to-left, and lacks English /p/ vs. /b/ and multi-consonant blends needed during Fundations decoding in "${unit_title}".`;
    arabicFix = `Use left-to-right finger tracking, practice /p/–/b/ pairs and Fundations consonant blends aloud on "${firstTerm}", and keep "is/are/was" visible in the ${klu} frame.`;
  } else {
    arabicFriction = `Arabic omits present-tense "to be" ("is/are") and uses different article ("al-") and relative-clause patterns, which can blur ${klu} links when discussing "${firstTerm}" in "${unit_title}".`;
    arabicFix = `Run a brief oral rehearsal round with explicit "is/are/was" verbs and highlight English articles ("a/an/the") beside "${firstTerm}" and "${secondTerm}".`;
  }

  let frenchCreoleFriction;
  let frenchCreoleFix;
  if (subject === "Math" || subject === "Science") {
    frenchCreoleFriction = `Haitian Creole marks tense with pre-verbal particles ("te/ap/pral") rather than English "-ed/-s" endings, and English directional prepositions ("per", "across", "into") differ when explaining "${firstTerm}" and "${secondTerm}".`;
    frenchCreoleFix = `Leverage shared French/Creole cognates ("${firstTerm}", "${secondTerm}"), pair prepositions with gestures on the visual model, and check verb endings in the ${klu} frame.`;
  } else if (isK3Ela) {
    frenchCreoleFriction = `French and Haitian Creole do not use English "'s" possessives or "-ed" past endings, and silent final consonants in French can interfere with Fundations decoding of "${firstTerm}" in "${unit_title}".`;
    frenchCreoleFix = `Activate French/Creole cognates for "${firstTerm}", tap every final consonant sound in Fundations routines, and model "'s" and "-ed" aloud in the ${klu} frame.`;
  } else {
    frenchCreoleFriction = `French and Haitian Creole form possessives with "de/pou" and mark tense differently from English "-ed" and third-person "-s", which often surfaces in academic ${klu} writing about "${unit_title}".`;
    frenchCreoleFix = `Draw on French/Creole cognates for "${firstTerm}" and "${secondTerm}", then run a 60-second partner check specifically for "-ed", "-s", and "'s" endings.`;
  }

  return [
    {
      l1_group: "Spanish",
      friction_point: spanishFriction,
      quick_fix: spanishFix,
    },
    {
      l1_group: "Arabic",
      friction_point: arabicFriction,
      quick_fix: arabicFix,
    },
    {
      l1_group: "French / Haitian Creole",
      friction_point: frenchCreoleFriction,
      quick_fix: frenchCreoleFix,
    },
  ];
}

function getSubjectEvidenceSource(subject) {
  if (subject === "Math") return "worked model, diagram, or calculation";
  if (subject === "Science") return "investigation data, model, or observation";
  if (subject === "Social Studies") return "map, timeline, or primary source";
  return "text detail or quotation";
}

function buildDefaultExitTicket(spec, normalizedVocab) {
  const bp = BLUEPRINT_BY_ID.get(spec.blueprint_id);
  const klu = bp?.wida_klu || "Explain";
  const moveName = bp?.move_name || klu;
  const band = getGradeBand(String(spec.grade));
  const requiredVocab = normalizedVocab.slice(0, 3).map((v) => v.term);
  const vocabInline = requiredVocab.join(", ");
  const evidenceSource = getSubjectEvidenceSource(spec.subject);

  let prompt;
  let lookFors;
  let quickRubric;

  if (band === "K-2") {
    prompt = `Draw or point to a ${evidenceSource} from "${spec.unit_title}", then orally share (or dictate/write) 1–2 sentences using the ${moveName} frame and key words (${vocabInline}).`;
    lookFors = [
      `Uses the target ${klu} frame orally, via dictation, or in writing with a clear connector.`,
      `Includes at least 1–2 unit terms (${vocabInline}) matched to a drawing, label, or model.`,
      `Points to a specific ${evidenceSource} from "${spec.unit_title}" to support the idea.`,
    ];
    quickRubric = {
      emerging:
        "Points to a drawing or model and uses 1 unit term with a WIDA 1–2 oral starter or teacher dictation.",
      developing: `Completes the target frame orally or in writing with 2 unit terms and a clear ${klu} connector.`,
      proficient: `Shares or writes 2 connected sentences using precise Tier 2/3 vocabulary and a specific ${evidenceSource}.`,
    };
  } else if (band === "3-5") {
    prompt = `Write a structured paragraph (2–3 sentences) about "${spec.unit_title}" using the ${moveName} frame, at least two unit terms (${vocabInline}), and a specific ${evidenceSource}.`;
    lookFors = [
      `Connects ideas accurately using the target ${klu} syntax pattern.`,
      `Integrates at least two Tier 2/Tier 3 terms (${vocabInline}) in context.`,
      `Cites a concrete ${evidenceSource} from "${spec.unit_title}".`,
    ];
    quickRubric = {
      emerging:
        "Uses 1 unit term with a provided WIDA 1–2 starter or labeled visual/model.",
      developing: `Completes the target frame with 2 unit terms and a clear ${klu} connector.`,
      proficient: `Produces a cohesive 2–3 sentence academic paragraph using precise Tier 2/3 vocabulary and ${evidenceSource} evidence.`,
    };
  } else {
    prompt = `Compose an academic justification (2–4 sentences) for "${spec.unit_title}" using the ${moveName} frame, at least two unit terms (${vocabInline}), and cited ${evidenceSource}.`;
    lookFors = [
      `Constructs a complex ${klu} clause using precise academic connectors.`,
      `Applies at least two Tier 2/Tier 3 terms (${vocabInline}) accurately to justify reasoning.`,
      `Cites and warrants specific ${evidenceSource} from "${spec.unit_title}".`,
    ];
    quickRubric = {
      emerging:
        "Uses 1 unit term with a provided WIDA 1–2 starter or labeled visual/model.",
      developing: `Completes the target frame with 2 unit terms, a clear ${klu} connector, and 1 piece of evidence.`,
      proficient: `Produces 2–4 connected academic sentences justifying thinking with precise Tier 2/3 vocabulary and warranted ${evidenceSource}.`,
    };
  }

  return {
    wida_klu: klu,
    blueprint_id: spec.blueprint_id,
    prompt,
    target_frame: spec.unit_example_frame,
    required_vocab: requiredVocab,
    look_fors: lookFors,
    quick_rubric: quickRubric,
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

    const normalizedVocab = normalizeVocabList(spec.vocab, spec.unit_title);
    const essentialQuestion = buildDefaultEssentialQuestion(spec, normalizedVocab);

    units.push({
      id: spec.id,
      grade: String(spec.grade),
      subject: spec.subject,
      curriculum_name: curriculumName,
      unit_number: Number(spec.unit_number),
      unit_title: spec.unit_title,
      unit_summary: spec.unit_summary,
      essential_question: essentialQuestion,
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
      l1_watchouts: spec.l1_watchouts || buildDefaultL1Watchouts(spec, normalizedVocab),
      tier2_tier3_vocab: normalizedVocab,
      language_exit_ticket_json:
        spec.exit_ticket || buildDefaultExitTicket(spec, normalizedVocab),
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
