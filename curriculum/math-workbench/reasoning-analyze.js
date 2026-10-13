/* Reasoning Studio analyzer. Pure functions: no DOM, no storage, no network.
 *
 * It looks for evidence that reasoning is visible and never states an answer.
 * Representation evidence comes from the board digest (what is actually filled
 * in), not from which chips were clicked. Matching is on whole words and
 * phrases, accent-folded, in English and Spanish. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;
  const { CAUSAL, CLAIM_WORDS, LINK_WORDS, ALIASES, TAG_RULES, MSG } = root.MWRMessages || {};
  if (!D || !MSG) return;

  const fold = (value) =>
    String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  /* ---------------- tokens and phrase matching ---------------- */
  function tokenize(text) {
    const source = String(text == null ? "" : text);
    const re = /\p{N}+(?:[.,]\p{N}+)*|\p{L}+(?:['’]\p{L}+)?|%/gu;
    const tokens = [];
    let m = re.exec(source);
    while (m) {
      tokens.push({ raw: m[0], norm: fold(m[0]), start: m.index, end: m.index + m[0].length });
      m = re.exec(source);
    }
    return tokens;
  }

  const compiled = new Map();
  function compile(term) {
    if (compiled.has(term)) return compiled.get(term);
    const parts = fold(term)
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.endsWith("*") ? { w: w.slice(0, -1), prefix: true } : { w, prefix: false }));
    compiled.set(term, parts);
    return parts;
  }

  function matchAt(tokens, i, parts) {
    for (let k = 0; k < parts.length; k++) {
      const tok = tokens[i + k];
      if (!tok) return false;
      if (parts[k].prefix ? !tok.norm.startsWith(parts[k].w) : tok.norm !== parts[k].w)
        return false;
    }
    return true;
  }

  /* Returns non-overlapping spans {from, to, term} (token indexes), longest first. */
  function findTerms(tokens, terms) {
    const list = terms
      .map((term) => ({ term, parts: compile(term) }))
      .sort((a, b) => b.parts.length - a.parts.length);
    const spans = [];
    const used = new Set();
    for (let i = 0; i < tokens.length; i++) {
      if (used.has(i)) continue;
      for (const { term, parts } of list) {
        if (!parts.length || !matchAt(tokens, i, parts)) continue;
        spans.push({ from: i, to: i + parts.length - 1, term });
        for (let k = 0; k < parts.length; k++) used.add(i + k);
        break;
      }
    }
    return spans;
  }

  const both = (map) => [...(map.en || []), ...(map.es || [])];

  /* ---------------- numbers ---------------- */
  function parseNum(value) {
    const s = String(value == null ? "" : value)
      .trim()
      .replace(/,/g, "");
    if (!s) return null;
    const frac = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(s);
    if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : null;
    return /^-?\d*\.?\d+$/.test(s) ? Number(s) : null;
  }

  function numbersIn(text) {
    const out = [];
    for (const tok of tokenize(text)) {
      if (/^\p{N}/u.test(tok.raw)) {
        const n = parseNum(tok.raw);
        if (n != null) out.push(n);
      }
    }
    return out;
  }

  /* ---------------- representation evidence ---------------- */
  const EQUATION_RE = /\d\s*[+\-−×x*÷/:=]\s*\d|\d\s*=|=\s*\d|[a-z]\s*[+\-−×*÷/=]\s*\d/i;

  function repVerified(rep, digest, wordCount, response) {
    if (rep.kind === "words") return wordCount >= 7;
    if (rep.kind === "equation")
      return Boolean(digest.hasEquationText) || EQUATION_RE.test(response);
    const items = digest.items || [];
    if (rep.hundred) {
      return items.some(
        (i) =>
          i.filled &&
          (i.type === "hundredgrid" ||
            (i.type === "arraymodel" && i.rows === 10 && i.cols === 10) ||
            ((i.type === "tape" || i.type === "fracbar") && (i.parts === 10 || i.parts === 100))),
      );
    }
    return items.some((i) => i.filled && rep.types.includes(i.type));
  }

  /* ---------------- model consistency checks ---------------- */
  function pairs(item) {
    const out = [];
    const n = Math.max((item.top || []).length, (item.bottom || []).length);
    for (let i = 0; i < n; i++) {
      const a = parseNum((item.top || [])[i]);
      const b = parseNum((item.bottom || [])[i]);
      if (a != null && b != null) out.push({ col: i + 1, a, b });
    }
    return out;
  }

  function ratioCheck(item) {
    const ps = pairs(item);
    if (ps.length < 2) return null;
    const ref = ps.find((p) => p.a !== 0 && p.b !== 0) || ps[0];
    const off = ps.filter(
      (p) =>
        p !== ref &&
        Math.abs(p.a * ref.b - ref.a * p.b) > 1e-9 * Math.max(1, Math.abs(p.a * ref.b)),
    );
    const list = off.map((p) => p.col).join(", ");
    if (!off.length) {
      return {
        id: "ratio-columns",
        ok: true,
        severity: "info",
        text: {
          en: "Every filled column of your table keeps the same ratio.",
          es: "Cada columna llena de tu tabla mantiene la misma razón.",
        },
      };
    }
    return {
      id: "ratio-columns",
      ok: false,
      severity: "block",
      text: {
        en: `Column ${list} of your table does not keep the same ratio as column ${ref.col}.`,
        es: `La columna ${list} de tu tabla no mantiene la misma razón que la columna ${ref.col}.`,
      },
    };
  }

  function tapeCheck(item) {
    const total = parseNum(item.total);
    const labels = (item.labels || []).map(parseNum);
    if (total == null || !labels.length || labels.some((v) => v == null)) return null;
    const sum = labels.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - total) < 1e-9) {
      return {
        id: "tape-total",
        ok: true,
        severity: "info",
        text: {
          en: "The parts of your tape add up to the whole you wrote.",
          es: "Las partes de tu cinta suman el entero que escribiste.",
        },
      };
    }
    return {
      id: "tape-total",
      ok: false,
      severity: "block",
      text: {
        en: `The parts of your tape add up to ${sum}, but the whole says ${total}.`,
        es: `Las partes de tu cinta suman ${sum}, pero el entero dice ${total}.`,
      },
    };
  }

  function runChecks(digest, response, promptText, skillId) {
    const checks = [];
    for (const item of digest.items || []) {
      if (!item.filled) continue;
      let c = null;
      if ((item.type === "ratiotable" || item.type === "dblnumline") && (skillId === "ratio" || skillId === "percent")) {
        c = ratioCheck(item);
      }
      else if (item.type === "tape") c = tapeCheck(item);
      if (c) checks.push(c);
    }
    const cited = numbersIn(response);
    const known = new Set([...(digest.numbers || []), ...numbersIn(promptText)]);
    if (cited.length >= 2 && known.size >= 2 && !cited.some((n) => known.has(n))) {
      checks.push({
        id: "numbers-on-model",
        ok: false,
        severity: "note",
        text: {
          en: "None of the numbers in your explanation appear in the problem or on your model. Point to where each number comes from.",
          es: "Ninguno de los números de tu explicación aparece en el problema ni en tu modelo. Señala de dónde sale cada número.",
        },
      });
    }
    return checks;
  }

  /* ---------------- misconception tags (keys from data/misconception-taxonomy.json) ---------------- */
  function detectTags(skillId, folded) {
    const out = [];
    for (const rule of TAG_RULES[skillId] || []) {
      if (
        rule.all.every((re) => re.test(folded)) &&
        !(rule.none || []).some((re) => re.test(folded))
      )
        out.push(rule.tag);
    }
    return out;
  }

  /* ---------------- messages ---------------- */
  const fmt = (template, vars) =>
    String(template).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ""));
  const pick = (map, lang) => map[lang] || map.en;
  const clean = (term) => term.replace(/\*$/, "");

  /* ---------------- analyze ---------------- */
  function analyze(input) {
    const skillId = D.SKILLS[input.skill] ? input.skill : "ratio";
    const skill = D.SKILLS[skillId];
    const lang = input.language === "es" ? "es" : "en";
    const response = String(input.response || "").trim();
    const promptText = String(input.prompt || "");
    const digest = input.digest && typeof input.digest === "object" ? input.digest : { items: [] };
    const tokens = tokenize(response);
    const words = tokens.filter((t) => /^\p{L}/u.test(t.raw));
    const wordCount = words.length;
    const folded = fold(response);

    const lexicon = both(skill.concepts);
    const conceptSpans = findTerms(tokens, lexicon);
    const reasonSpans = findTerms(tokens, CAUSAL).filter((s) => tokens.length - 1 - s.to >= 3);
    const unitSpans = findTerms(tokens, both(D.UNITS));
    const claimSpans = findTerms(tokens, CLAIM_WORDS);
    const linkSpans = findTerms(tokens, LINK_WORDS);

    const verified = [];
    const unverified = [];
    for (const rep of skill.reps)
      (repVerified(rep, digest, wordCount, response) ? verified : unverified).push(rep);
    const modelVerified = verified.filter((r) => r.kind !== "words");
    const chosen = Array.isArray(input.representations) ? input.representations : [];
    const chosenUnmet = unverified.filter((r) => chosen.includes(r.id));

    const mentioned = verified.filter(
      (rep) => findTerms(tokens, [...(ALIASES[rep.id] || []), rep.en, rep.es]).length,
    ).length;
    const profile = {
      claim: wordCount >= 5 && (numbersIn(response).length > 0 || claimSpans.length > 0),
      reason: reasonSpans.length > 0,
      concept: conceptSpans.length > 0,
      model: modelVerified.length >= 2,
      link: linkSpans.length > 0 && mentioned >= 1 ? true : mentioned >= 2,
      units: unitSpans.length > 0,
    };

    const promptUnits = findTerms(tokenize(promptText), both(D.UNITS)).length > 0;
    const expectUnits = input.expectUnits != null ? Boolean(input.expectUnits) : promptUnits;
    const checks = runChecks(digest, response, promptText, skillId);
    const marks = [
      ...reasonSpans.map((s) => ({
        from: tokens[s.from].start,
        to: tokens[s.to].end,
        kind: "reason",
      })),
      ...conceptSpans.map((s) => ({
        from: tokens[s.from].start,
        to: tokens[s.to].end,
        kind: "concept",
      })),
      ...unitSpans.map((s) => ({ from: tokens[s.from].start, to: tokens[s.to].end, kind: "unit" })),
    ];

    const matchedTokens = new Set();
    for (const s of [...conceptSpans, ...reasonSpans])
      for (let i = s.from; i <= s.to; i++) matchedTokens.add(i);
    const freq = {};
    for (const t of words) freq[t.norm] = (freq[t.norm] || 0) + 1;
    const maxFreq = Math.max(0, ...Object.values(freq));
    const stuffed = wordCount >= 6 && matchedTokens.size / Math.max(1, tokens.length) >= 0.5;
    const repeated = wordCount >= 8 && maxFreq >= 4 && maxFreq / wordCount >= 0.3;

    const tags = detectTags(skillId, folded);
    const earned = new Set();
    if (profile.claim && profile.reason) earned.add("MP3");
    if (profile.model) earned.add("MP4");
    if (profile.units || numbersIn(response).length >= 2) earned.add("MP6");
    if (profile.link || (profile.concept && profile.model)) earned.add("MP7");
    if (profile.concept && profile.claim) earned.add("MP2");
    const smp = skill.smp.filter((id) => earned.has(id));

    const base = {
      profile,
      checks,
      tags,
      smp,
      marks,
      verifiedReps: verified.map((r) => r.id),
      unmetReps: chosenUnmet.map((r) => r.id),
      stats: { words: wordCount, reps: modelVerified.length },
      language: lang,
    };
    const done = (status, signal, evidence, nextMove, confidence) => ({
      status,
      signal,
      evidence,
      nextMove,
      confidence,
      ...base,
    });

    if (wordCount < 7) {
      return done(
        "reasoning-not-yet-visible",
        pick(MSG.notVisible.signal, lang),
        lang === "es" ? `Se ven ${wordCount} palabras.` : `${wordCount} words are visible.`,
        pick(MSG.notVisible.next, lang),
        0.92,
      );
    }
    if (stuffed || repeated) {
      return done(
        "reasoning-not-yet-visible",
        pick(MSG.wordList.signal, lang),
        pick(MSG.wordList.evidence, lang),
        pick(MSG.wordList.next, lang),
        0.8,
      );
    }
    if (modelVerified.length < 2) {
      const unmet = chosenUnmet.map((r) => r[lang]).join(", ");
      const extra = unmet
        ? lang === "es"
          ? ` Elegiste: ${unmet}, pero todavía no está completo en el tablero.`
          : ` You chose ${unmet}, but it is not filled in on the board yet.`
        : "";
      const n = modelVerified.length;
      const count =
        lang === "es"
          ? `${n} representaci${n === 1 ? "ón completa" : "ones completas"} en el tablero.`
          : `${n} filled-in representation${n === 1 ? "" : "s"} on the board.`;
      return done(
        "representation-connection-needed",
        pick(MSG.needModel.signal, lang),
        count + extra,
        pick(MSG.needModel.next, lang),
        0.84,
      );
    }
    const failed = checks.find((c) => !c.ok && c.severity === "block");
    if (failed) {
      return done(
        "model-consistency-check",
        pick(MSG.inconsistent.signal, lang),
        pick(failed.text, lang),
        pick(MSG.inconsistent.next, lang),
        0.8,
      );
    }
    if (!profile.concept) {
      const terms = skill.concepts[lang].slice(0, 2).map(clean);
      return done(
        "concept-link-needed",
        pick(skill.signal, lang),
        fmt(pick(MSG.concept.evidence, lang), { a: terms[0], b: terms[1] }),
        pick(skill.move, lang),
        0.72,
      );
    }
    if (!profile.reason) {
      return done(
        "justification-link-needed",
        pick(MSG.reason.signal, lang),
        pick(MSG.reason.evidence, lang),
        pick(MSG.reason.next, lang),
        0.78,
      );
    }
    if (!profile.units && expectUnits) {
      return done(
        "unit-meaning-needed",
        pick(MSG.units.signal, lang),
        pick(MSG.units.evidence, lang),
        pick(MSG.units.next, lang),
        0.7,
      );
    }
    return done(
      "connected-reasoning-visible",
      pick(MSG.connected.signal, lang),
      fmt(pick(MSG.connected.evidence, lang), { reps: modelVerified.length, words: wordCount }),
      pick(profile.link ? MSG.connected.next : MSG.connected.nextLink, lang),
      0.68,
    );
  }

  /* Optional "solve it a second way" step: counts as present when both boxes
   * have real sentences and the comparison is justified. */
  function analyzeCompare(input) {
    const second = String(input.second || "").trim();
    const which = String(input.which || "").trim();
    const wordsOf = (s) => tokenize(s).filter((t) => /^\p{L}/u.test(t.raw)).length;
    const reason = findTerms(tokenize(which), CAUSAL).length > 0;
    return { present: wordsOf(second) >= 4 && wordsOf(which) >= 5, justified: reason };
  }

  /* ---------------- diff + markup ---------------- */
  function diffWords(before, after) {
    const a = String(before || "")
      .split(/\s+/)
      .filter(Boolean);
    const b = String(after || "")
      .split(/\s+/)
      .filter(Boolean);
    if (a.length * b.length > 90000) return b.map((w) => ({ t: w, type: "same" }));
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        out.push({ t: b[j], type: "same" });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        out.push({ t: a[i++], type: "del" });
      } else {
        out.push({ t: b[j++], type: "add" });
      }
    }
    while (i < a.length) out.push({ t: a[i++], type: "del" });
    while (j < b.length) out.push({ t: b[j++], type: "add" });
    return out;
  }

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* Wraps reason connectors, concept phrases and units in <mark> for display. */
  function markup(text, marks) {
    const source = String(text || "");
    const sorted = [...(marks || [])].sort((x, y) => x.from - y.from);
    let html = "";
    let at = 0;
    for (const m of sorted) {
      if (m.from < at) continue;
      html +=
        escapeHtml(source.slice(at, m.from)) +
        `<mark class="mwr-mark mwr-mark-${m.kind}">` +
        escapeHtml(source.slice(m.from, m.to)) +
        "</mark>";
      at = m.to;
    }
    return html + escapeHtml(source.slice(at));
  }

  function diffHtml(before, after) {
    return diffWords(before, after)
      .map((d) =>
        d.type === "add"
          ? `<mark class="mwr-add">${escapeHtml(d.t)}</mark>`
          : d.type === "del"
            ? `<del class="mwr-del">${escapeHtml(d.t)}</del>`
            : escapeHtml(d.t),
      )
      .join(" ");
  }

  const api = {
    repVerified,
    analyze,
    analyzeCompare,
    diffWords,
    diffHtml,
    markup,
    escapeHtml,
    tokenize,
    fold,
    parseNum,
    numbersIn,
    findTerms,
  };
  root.MWRAnalyzer = Object.freeze(api);
  root.MWReasoningData.analyze = analyze;
  root.MWReasoningData.analyzeCompare = analyzeCompare;
})(window);
