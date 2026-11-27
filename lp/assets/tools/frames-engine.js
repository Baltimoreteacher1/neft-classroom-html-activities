// Deterministic language engine shared by the Frame Generator, the Warm-Up Generator and the Scaffold Generator.
// Same input -> same output. Phrase banks come from tools/lp/data/phrase-banks.json (embedded in the page).

/** Small stable hash so choices are deterministic for a given input. */
export function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = (list, seed, n = 1) => {
  if (!list?.length) return [];
  const out = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(seed + i * 7) % list.length]);
  return [...new Set(out)];
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const splitTerms = (s) =>
  String(s || "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);

export function buildFrames({ area = "general", topic = "", terms = "", klu = "Explain", bands = ["L1-2", "L3-4", "L5-6"] }, banks) {
  const A = banks.areas[area] || banks.areas.general;
  const K = banks.klu[klu] || banks.klu.Explain;
  const t = topic.trim() || "today's topic";
  const list = splitTerms(terms);
  const seed = hash(`${area}|${t}|${klu}`);
  const source = pick(A.sources, seed)[0];
  const content = {
    Narrate: `Students will describe the sequence of events in ${t} using ${source}.`,
    Inform: `Students will describe and compare key features of ${t} using ${source}.`,
    Explain: `Students will explain ${t} using ${source}.`,
    Argue: `Students will make and support a claim about ${t} using evidence from ${source}.`,
  }[klu];
  const termFrames = {
    "L1-2": list[0] ? [`${cap(list[0])} is ___.`, `This is ___. It is ${list[0]}.`] : [],
    "L3-4": list[0] ? [`${cap(list[0])} is important in ${t} because ___.`] : [],
    "L5-6": list[1] ? [`The relationship between ${list[0]} and ${list[1]} is that ___.`] : list[0] ? [`Without ${list[0]}, ___ would ___ because ___.`] : [],
  };
  const out = { contentObjective: content, language: {}, frames: {}, wordBank: [], area: A.label, eld: A.eld, klu };
  for (const band of bands) {
    out.language[band] = `Students will ${K.verb} ${t} ${K.mode[band]} using ${K.feature[band]}, with ${banks.bands[band].support}.`;
    const generic = K.frames[band].map((f) => f.replaceAll("{topic}", t));
    const areaFrames = (A.frames[klu]?.[band] || []).map((f) => f.replaceAll("{topic}", t));
    const chosen = [...pick(generic, seed, band === "L1-2" ? 3 : 3), ...areaFrames, ...termFrames[band]];
    out.frames[band] = [...new Set(chosen)].slice(0, 5);
  }
  out.wordBank = [...new Set([...list, ...pick(K.connectors, seed, 5), ...pick(A.words, seed + 3, 4)])];
  return out;
}

export function framesToText(r, bandLabels) {
  const lines = [`Content objective: ${r.contentObjective}`, "", "Language objectives:"];
  for (const [b, l] of Object.entries(r.language)) lines.push(`  ${bandLabels[b]}: ${l}`);
  lines.push("", "Sentence frames:");
  for (const [b, fs] of Object.entries(r.frames)) {
    lines.push(`  ${bandLabels[b]}:`);
    for (const f of fs) lines.push(`    - ${f}`);
  }
  lines.push("", `Word bank: ${r.wordBank.join(", ")}`);
  return lines.join("\n");
}

/* ---------- warm-ups ---------- */
export function buildWarmup({ type = "which-one", area = "general", topic = "", terms = "", band = "L3-4" }, banks) {
  const A = banks.areas[area] || banks.areas.general;
  const t = topic.trim() || "today's topic";
  const list = splitTerms(terms);
  const seed = hash(`${type}|${area}|${t}|${terms}`);
  const typeInfo = banks.warmups.types.find((w) => w.id === type) || banks.warmups.types[0];
  const K = banks.klu[typeInfo.klu];
  const frames = K.frames[band].slice(0, 3).map((f) => f.replaceAll("{topic}", t));
  const words = list.length ? list : pick(A.words, seed, 4);
  const base = { title: typeInfo.label, klu: typeInfo.klu, frames, words };
  switch (type) {
    case "which-one": {
      const four = words.slice(0, 4);
      return { ...base, prompt: `Which one does not belong? Choose one and explain why.`, display: four, note: four.length < 4 ? "Add four key words for this warm-up." : "" };
    }
    case "picture-talk":
      return { ...base, prompt: `Look at the picture or object for ${t}. What do you notice? What do you wonder?`, display: words.slice(0, 2), frames: ["I notice ___.", "I wonder ___.", "It reminds me of ___."] };
    case "sentence-stretch": {
      const w = words[0] || t;
      return { ...base, prompt: `Stretch this sentence. Add who, where, when or why.`, display: [`The ${w} changed.`], frames: ["The ___ changed when ___.", "The ___ changed because ___.", "In ___, the ___ changed ___."] };
    }
    case "because-chain":
      return { ...base, prompt: `${cap(t)} matters because ___. That matters because ___. Keep the chain going with a partner.`, display: words.slice(0, 3) };
    case "story-steps":
      return { ...base, prompt: `Tell what happened in ${t} in three steps: first, next, last.`, display: words.slice(0, 3), frames: ["First, ___.", "Next, ___.", "Last, ___."] };
    case "agree-disagree": {
      const w = words[0] || t;
      return { ...base, prompt: `Agree or disagree: "${cap(w)} is the most important idea in ${t}." Give one reason.`, display: [] };
    }
    default:
      return { ...base, prompt: t, display: words };
  }
}
