// A5 Unified Search — pure ESM, zero DOM, zero network.
// Accent-insensitive full-text + standard-code + Reveal-number search over all BCPSS units.

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "de",
  "del",
  "el",
  "en",
  "for",
  "from",
  "how",
  "in",
  "is",
  "la",
  "las",
  "los",
  "of",
  "on",
  "or",
  "para",
  "por",
  "the",
  "to",
  "un",
  "una",
  "with",
  "y",
]);

const FIELD_WEIGHTS = {
  standards: 120,
  reveal: 85,
  title: 48,
  spanish_vocab: 44,
  vocab: 42,
  klu: 24,
  summary: 16,
  spanish_text: 14,
  vocab_def: 12,
  meta: 10,
};

const PHRASE_BONUS = {
  title: 80,
  spanish_vocab: 75,
  vocab: 70,
  reveal: 70,
};

/**
 * Accent-insensitive normalization: NFD decompose, strip combining diacritics,
 * lowercase, and collapse punctuation/whitespace.
 */
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`"“”«»()[\]{},;:!?¿¡/\\|&—–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize a curriculum standard code while preserving dots and hyphens. */
export function normalizeStandardCode(code) {
  return String(code ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "")
    .replace(/\.+$/g, "")
    .trim();
}

/**
 * Generate shorthand aliases for a standard code (e.g. `6.NS.A.1` -> `6.ns.1`,
 * `K.CC.A.1` -> `k.cc.1`) so teacher shorthand queries match exact standards.
 */
function standardAliases(rawCode) {
  const norm = normalizeStandardCode(rawCode);
  if (!norm) return [];
  const out = new Set([norm]);
  // CCSS Math: <grade>.<domain>.<clusterLetter>.<num> -> <grade>.<domain>.<num>
  const m = norm.match(/^([k0-8])\.([a-z]{1,4})\.[a-z]\.(\d+[a-z]?)$/);
  if (m) out.add(`${m[1]}.${m[2]}.${m[3]}`);
  // Strip trailing sub-letter (e.g., 6.rp.a.3c -> 6.rp.a.3)
  const sub = norm.match(/^(.+\.\d+)[a-z]$/);
  if (sub) out.add(sub[1]);
  return [...out];
}

/** Tokenize prose into accent-stripped alphanumeric tokens. */
export function tokenize(value) {
  const norm = normalizeText(value);
  if (!norm) return [];
  return norm.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Extract code-like tokens (standards or Reveal lesson ids like `5-6`) from a raw query. */
function extractCodeTokens(query) {
  const raw = String(query ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const matches = raw.match(/[a-z0-9]+(?:[.-][a-z0-9]+)+/g) || [];
  return matches.filter((t) => /\d/.test(t));
}

function isStandardLike(token) {
  return /\d/.test(token) && /[a-z]/.test(token) && /[.-]/.test(token);
}

function asArray(val) {
  return Array.isArray(val) ? val : [];
}

/** Normalize input from loadDataset(), { units, lessons }, or an array of unit docs/summaries. */
function unpackInput(input, extraLessons) {
  let rawUnits = [];
  let lessonsByUnit = new Map();

  if (Array.isArray(input)) {
    rawUnits = input;
  } else if (input && typeof input === "object") {
    rawUnits = asArray(input.units?.length ? input.units : input.summaries);
    for (const ldoc of asArray(input.lessons)) {
      if (ldoc?.unit_id) lessonsByUnit.set(ldoc.unit_id, ldoc);
    }
  }

  for (const ldoc of asArray(extraLessons)) {
    if (ldoc?.unit_id) lessonsByUnit.set(ldoc.unit_id, ldoc);
  }

  return { rawUnits, lessonsByUnit };
}

function addPosting(postings, token, docIdx, field) {
  if (!token) return;
  let list = postings.get(token);
  if (!list) {
    list = [];
    postings.set(token, list);
  }
  // Deduplicate (docIdx, field) for the same token
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (p.docIdx !== docIdx) break;
    if (p.field === field) return;
  }
  list.push({ docIdx, field });
}

function indexText(postings, text, docIdx, field) {
  for (const tok of tokenize(text)) {
    addPosting(postings, tok, docIdx, field);
  }
}

/**
 * Build an in-memory search index over all BCPSS units.
 * Accepts either `loadDataset()` output (`{ summaries, units, lessons }`) or an array of units.
 */
export function buildSearchIndex(unitsInput, options = {}) {
  const { rawUnits, lessonsByUnit } = unpackInput(unitsInput, options.lessons);
  const docs = [];
  const postings = new Map();
  const standardPostings = new Map();
  const revealPostings = new Map();

  for (const entry of rawUnits) {
    const u = entry?.unit ? entry.unit : entry;
    if (!u || !u.id) continue;

    const docIdx = docs.length;
    const unitId = String(u.id);
    const title = String(u.unit_title ?? u.title ?? "");
    const grade = String(u.grade ?? "");
    const subject = String(u.subject ?? "");
    const summary = String(u.unit_summary ?? u.summary ?? "");
    const essentialQuestion = String(u.essential_question ?? "");
    const standards = asArray(u.core_standards ?? u.standards);
    const connections = asArray(entry?.connections);
    const familyCard = entry?.family_card || {};
    const family = entry?.family || {};
    const moduleDoc = entry?.module || {};
    const lessonDoc = lessonsByUnit.get(unitId) || entry?.lessonDoc || null;

    const enVocabPhrases = [];
    const esVocabPhrases = [];
    const standardCodes = [];
    const revealRefs = [];

    // 1. Title
    const normTitle = normalizeText(title);
    indexText(postings, title, docIdx, "title");
    if (moduleDoc.title) indexText(postings, moduleDoc.title, docIdx, "title");

    // 2. Summary & essential question & module intro
    indexText(postings, summary, docIdx, "summary");
    indexText(postings, essentialQuestion, docIdx, "summary");
    if (moduleDoc.introduction) indexText(postings, moduleDoc.introduction, docIdx, "summary");

    // 3. Standards codes (exact + shorthand aliases)
    for (const rawStd of standards) {
      const aliases = standardAliases(rawStd);
      for (const code of aliases) {
        standardCodes.push(code);
        addPosting(standardPostings, code, docIdx, "standards");
        addPosting(postings, code, docIdx, "standards");
      }
      indexText(postings, rawStd, docIdx, "standards");
    }

    // 4. Unit number & Reveal unit/lesson numbers
    if (u.unit_number != null) {
      addPosting(postings, `u${u.unit_number}`, docIdx, "reveal");
      addPosting(postings, `unit${u.unit_number}`, docIdx, "reveal");
    }
    if (lessonDoc?.lessons) {
      for (const l of asArray(lessonDoc.lessons)) {
        for (const rev of asArray(l.reveal)) {
          if (rev.id) {
            const rid = normalizeStandardCode(rev.id);
            revealRefs.push(rid);
            addPosting(revealPostings, rid, docIdx, "reveal");
            addPosting(postings, rid, docIdx, "reveal");
          }
          if (rev.unit != null) {
            addPosting(postings, `reveal`, docIdx, "reveal");
            addPosting(postings, `u${rev.unit}`, docIdx, "reveal");
          }
          if (rev.title) indexText(postings, rev.title, docIdx, "reveal");
        }
      }
    }

    // 5. Connections: KLU, move name, vocab terms & definitions, Spanish cognates
    const klus = new Set();
    if (u.primary_klu) klus.add(String(u.primary_klu));
    if (u.move_name) indexText(postings, u.move_name, docIdx, "klu");

    for (const conn of connections) {
      if (conn.wida_klu) klus.add(String(conn.wida_klu));
      if (conn.move_name) indexText(postings, conn.move_name, docIdx, "klu");

      for (const v of asArray(conn.tier2_tier3_vocab)) {
        if (v.term) {
          const nt = normalizeText(v.term);
          if (nt) enVocabPhrases.push(nt);
          indexText(postings, v.term, docIdx, "vocab");
        }
        for (const fam of asArray(v.family)) {
          indexText(postings, fam, docIdx, "vocab");
        }
        if (v.student_friendly_def)
          indexText(postings, v.student_friendly_def, docIdx, "vocab_def");
        if (v.kid_def && v.kid_def !== v.student_friendly_def) {
          indexText(postings, v.kid_def, docIdx, "vocab_def");
        }
        if (v.cognate_es) {
          const nes = normalizeText(v.cognate_es);
          if (nes) esVocabPhrases.push(nes);
          indexText(postings, v.cognate_es, docIdx, "spanish_vocab");
        }
        if (v.cognate_hint) {
          indexText(postings, v.cognate_hint, docIdx, "spanish_text");
        }
      }
    }

    for (const klu of klus) {
      indexText(postings, klu, docIdx, "klu");
    }

    // 6. Spanish translations from family_card & family
    if (familyCard.es_summary) {
      indexText(postings, familyCard.es_summary, docIdx, "spanish_text");
    }
    if (family.summary?.es) {
      indexText(postings, family.summary.es, docIdx, "spanish_text");
    }
    for (const fv of asArray(family.vocab)) {
      if (fv.term) indexText(postings, fv.term, docIdx, "vocab");
      if (fv.def_es) indexText(postings, fv.def_es, docIdx, "spanish_text");
      if (fv.example_es) indexText(postings, fv.example_es, docIdx, "spanish_text");
    }

    // 7. Meta: grade, subject, curriculum_name, unitId
    indexText(postings, `${grade} g${grade} grade ${grade}`, docIdx, "meta");
    if (grade.toLowerCase() === "k") indexText(postings, "kindergarten", docIdx, "meta");
    indexText(postings, subject, docIdx, "meta");
    if (u.curriculum_name) indexText(postings, u.curriculum_name, docIdx, "meta");
    addPosting(postings, unitId.toLowerCase(), docIdx, "meta");

    docs.push({
      unitId,
      title,
      grade,
      subject,
      normGrade: grade.toLowerCase(),
      normSubject: normalizeText(subject),
      normTitle,
      enVocabPhrases: [...new Set(enVocabPhrases)],
      esVocabPhrases: [...new Set(esVocabPhrases)],
      standardCodes: [...new Set(standardCodes)],
      revealRefs: [...new Set(revealRefs)],
    });
  }

  // Precompute document frequency per posting token for IDF scoring
  const docFreq = new Map();
  for (const [tok, list] of postings) {
    const seen = new Set();
    for (const p of list) seen.add(p.docIdx);
    docFreq.set(tok, seen.size);
  }

  return {
    docs,
    postings,
    standardPostings,
    revealPostings,
    docFreq,
  };
}

/**
 * Search indexed units with accent-insensitive English, Spanish, standard-code,
 * and Reveal lesson queries.
 */
export function searchUnits(index, query, options = {}) {
  const { grade, subject, limit = 10 } = options;
  if (!index || !Array.isArray(index.docs) || index.docs.length === 0) return [];

  const filterGrade = grade != null && grade !== "" ? String(grade).toLowerCase() : null;
  const filterSubject = subject != null && subject !== "" ? normalizeText(subject) : null;

  const rawQuery = String(query ?? "").trim();
  if (!rawQuery) {
    return index.docs
      .filter(
        (d) =>
          (!filterGrade || d.normGrade === filterGrade) &&
          (!filterSubject || d.normSubject === filterSubject),
      )
      .slice(0, limit)
      .map((d) => ({
        unitId: d.unitId,
        title: d.title,
        grade: d.grade,
        subject: d.subject,
        score: 0,
        matchedIn: [],
      }));
  }

  const N = index.docs.length;
  const normQuery = normalizeText(rawQuery);
  const codeTokens = extractCodeTokens(rawQuery);
  const allWordTokens = tokenize(rawQuery);
  const meaningfulWords = allWordTokens.filter((t) => !STOP_WORDS.has(t));
  const queryWords = meaningfulWords.length > 0 ? meaningfulWords : allWordTokens;

  // Map docIdx -> { score, matchedFields: Set<string>, matchedTerms: Set<string> }
  const scores = new Map();
  const ensure = (docIdx) => {
    let s = scores.get(docIdx);
    if (!s) {
      s = { score: 0, matchedFields: new Set(), matchedTerms: new Set() };
      scores.set(docIdx, s);
    }
    return s;
  };

  const passesFilter = (docIdx) => {
    const d = index.docs[docIdx];
    if (!d) return false;
    if (filterGrade && d.normGrade !== filterGrade) return false;
    if (filterSubject && d.normSubject !== filterSubject) return false;
    return true;
  };

  // 1. Standard-code and Reveal-id matching (highest priority)
  const standardQueryTokens = [];
  for (const code of codeTokens) {
    const normCode = normalizeStandardCode(code);
    if (!normCode) continue;

    if (isStandardLike(normCode)) {
      standardQueryTokens.push(normCode);
      const exact = index.standardPostings.get(normCode);
      if (exact) {
        for (const p of exact) {
          if (!passesFilter(p.docIdx)) continue;
          const rec = ensure(p.docIdx);
          rec.score += FIELD_WEIGHTS.standards * 2.5;
          rec.matchedFields.add("standards");
          rec.matchedTerms.add(normCode);
        }
      } else {
        // Prefix match on standard codes (e.g. `6.rp` matches `6.rp.a.1`)
        for (const [stdKey, list] of index.standardPostings) {
          if (stdKey.startsWith(normCode)) {
            for (const p of list) {
              if (!passesFilter(p.docIdx)) continue;
              const rec = ensure(p.docIdx);
              rec.score += FIELD_WEIGHTS.standards * 1.4;
              rec.matchedFields.add("standards");
              rec.matchedTerms.add(normCode);
            }
          }
        }
      }
    } else {
      // Pure numeric-dash like `5-6` -> Reveal lesson id
      const revList = index.revealPostings.get(normCode);
      if (revList) {
        for (const p of revList) {
          if (!passesFilter(p.docIdx)) continue;
          const rec = ensure(p.docIdx);
          rec.score += FIELD_WEIGHTS.reveal * 2;
          rec.matchedFields.add("reveal");
          rec.matchedTerms.add(normCode);
        }
      }
    }
  }

  // 2. Inverted-index token scoring (exact + morphological prefix fallback)
  const effectiveTokens =
    standardQueryTokens.length > 0 && queryWords.every((w) => codeTokens.some((c) => c.includes(w)))
      ? []
      : queryWords;

  for (const tok of effectiveTokens) {
    const exactList = index.postings.get(tok);
    if (exactList && exactList.length > 0) {
      const df = index.docFreq.get(tok) || exactList.length;
      const idf = 1 + Math.log((N + 1) / (df + 1));
      // Best field weight per doc for this token, plus small additive bonus for secondary fields
      const perDoc = new Map();
      for (const p of exactList) {
        if (!passesFilter(p.docIdx)) continue;
        const w = (FIELD_WEIGHTS[p.field] || 10) * idf;
        const prev = perDoc.get(p.docIdx);
        if (!prev) {
          perDoc.set(p.docIdx, { best: w, bonus: 0, fields: [p.field] });
        } else {
          if (w > prev.best) {
            prev.bonus += prev.best * 0.15;
            prev.best = w;
          } else {
            prev.bonus += w * 0.15;
          }
          prev.fields.push(p.field);
        }
      }
      for (const [docIdx, info] of perDoc) {
        const rec = ensure(docIdx);
        rec.score += info.best + info.bonus;
        for (const f of info.fields) rec.matchedFields.add(f);
        rec.matchedTerms.add(tok);
      }
    }

    // Morphological / prefix fallback for tokens >= 4 chars (handles Spanish plurals/stems like proporcion -> proporcional, fracciones -> fraccion)
    if (tok.length >= 4) {
      const perDocPrefix = new Map();
      for (const [idxTok, list] of index.postings) {
        if (idxTok === tok || idxTok.length < 4) continue;
        const isPrefix = idxTok.startsWith(tok) || tok.startsWith(idxTok);
        if (!isPrefix) continue;
        // Require substantial overlap (>= 70% of longer token or >= 6 chars shared)
        const minLen = Math.min(idxTok.length, tok.length);
        const maxLen = Math.max(idxTok.length, tok.length);
        if (minLen < 5 && minLen / maxLen < 0.7) continue;

        const df = index.docFreq.get(idxTok) || list.length;
        const idf = 1 + Math.log((N + 1) / (df + 1));
        for (const p of list) {
          if (!passesFilter(p.docIdx)) continue;
          const w = (FIELD_WEIGHTS[p.field] || 10) * idf * 0.72;
          const prev = perDocPrefix.get(p.docIdx);
          if (!prev || w > prev.best) {
            perDocPrefix.set(p.docIdx, { best: w, field: p.field });
          }
        }
      }
      for (const [docIdx, info] of perDocPrefix) {
        const rec = ensure(docIdx);
        if (!rec.matchedTerms.has(tok)) {
          rec.score += info.best;
          rec.matchedFields.add(info.field);
          rec.matchedTerms.add(tok);
        }
      }
    }
  }

  // 3. Phrase match bonuses & multi-token coverage scaling
  const totalExpectedTerms =
    effectiveTokens.length > 0 ? effectiveTokens.length : standardQueryTokens.length || 1;

  const ranked = [];
  for (const [docIdx, rec] of scores) {
    const doc = index.docs[docIdx];
    if (!doc) continue;

    let finalScore = rec.score;

    // Phrase bonuses only when the document already matched via index postings
    if (normQuery.length >= 3) {
      if (doc.normTitle === normQuery) {
        finalScore += PHRASE_BONUS.title * 2;
        rec.matchedFields.add("title");
      } else if (doc.normTitle.includes(normQuery)) {
        finalScore += PHRASE_BONUS.title;
        rec.matchedFields.add("title");
      }

      if (doc.esVocabPhrases.includes(normQuery)) {
        finalScore += PHRASE_BONUS.spanish_vocab * 1.5;
        rec.matchedFields.add("spanish_vocab");
      } else if (doc.esVocabPhrases.some((p) => p.includes(normQuery))) {
        finalScore += PHRASE_BONUS.spanish_vocab * 0.6;
        rec.matchedFields.add("spanish_vocab");
      }

      if (doc.enVocabPhrases.includes(normQuery)) {
        finalScore += PHRASE_BONUS.vocab * 1.4;
        rec.matchedFields.add("vocab");
      } else if (doc.enVocabPhrases.some((p) => p.includes(normQuery))) {
        finalScore += PHRASE_BONUS.vocab * 0.5;
        rec.matchedFields.add("vocab");
      }
    }

    // Coverage multiplier for multi-token queries
    if (totalExpectedTerms > 1) {
      const coverage = Math.min(1, rec.matchedTerms.size / totalExpectedTerms);
      finalScore *= coverage ** 1.5;
      if (rec.matchedTerms.size >= totalExpectedTerms) {
        finalScore *= 1.25;
      }
    }

    ranked.push({
      unitId: doc.unitId,
      title: doc.title,
      grade: doc.grade,
      subject: doc.subject,
      score: Math.round(finalScore * 100) / 100,
      matchedIn: [...rec.matchedFields].sort(),
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.unitId.localeCompare(b.unitId));
  return ranked.slice(0, limit);
}
