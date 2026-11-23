// BCPSS Teacher Studio — Visual Vocabulary Studio
// Uses every unit's verified tier2_tier3_vocab + l1_watchouts across all 162 K–8 units.
// Generates original programmatic educational SVG visual models tailored to subject & concept.

import { keepView } from "./keep-view.js";

const containerState = new WeakMap();

const MORPHOLOGY_PARTS = [
  { pattern: /^un(.{3,})/i, parts: (m) => `un- (not) + ${m[1]}` },
  { pattern: /^re(.{3,})/i, parts: (m) => `re- (again) + ${m[1]}` },
  { pattern: /^pre(.{3,})/i, parts: (m) => `pre- (before) + ${m[1]}` },
  { pattern: /^sub(.{3,})/i, parts: (m) => `sub- (under) + ${m[1]}` },
  { pattern: /^inter(.{3,})/i, parts: (m) => `inter- (between) + ${m[1]}` },
  { pattern: /^equi(.{2,})/i, parts: (m) => `equi- (equal) + ${m[1]}` },
  { pattern: /^poly(.{2,})/i, parts: (m) => `poly- (many) + ${m[1]}` },
  { pattern: /(.{3,})tion$/i, parts: (m) => `${m[1]} + -tion (process/state)` },
  { pattern: /(.{3,})ment$/i, parts: (m) => `${m[1]} + -ment (result/action)` },
  { pattern: /(.{3,})ity$/i, parts: (m) => `${m[1]} + -ity (quality/state)` },
  { pattern: /(.{3,})able$/i, parts: (m) => `${m[1]} + -able (capable of)` },
  { pattern: /(.{3,})al$/i, parts: (m) => `${m[1]} + -al (relating to)` },
];

const FALSE_COGNATE_WATCH = {
  actual: "False cognate alert: Spanish 'actual' means 'current', not 'real/actual'.",
  argument: "Cognate bridge: Spanish 'argumento' can mean plot or claim — clarify academic evidence.",
  data: "Cognate bridge: Spanish 'datos' is always plural ('los datos').",
  library: "False cognate alert: Spanish 'librería' is bookstore; 'biblioteca' is library.",
  record: "False cognate alert: Spanish 'recordar' means 'to remember', not 'to record data'.",
  support: "False cognate alert: Spanish 'soportar' means 'to tolerate'; use 'apoyar' for evidence support.",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safeParseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function gradeBandFor(grade) {
  const g = String(grade || "").toUpperCase();
  if (["K", "1", "2"].includes(g)) return "k2";
  if (["3", "4", "5"].includes(g)) return "35";
  return "68";
}

function bandLabel(band) {
  if (band === "k2") return "K–2 Early Elementary";
  if (band === "35") return "3–5 Upper Elementary";
  return "6–8 Middle School";
}

function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return { word: item.trim(), tier: "Tier 2", definition: "", cognate: "" };
      }
      if (!item || typeof item !== "object") return null;
      const word = String(item.word || item.term || "").trim();
      const definition = String(
        item.student_friendly_def || item.kid_def || item.definition || item.note || "",
      ).trim();
      const cognate = String(
        item.cognate_hint ||
          (item.cognate_es ? `Spanish cognate: ${item.cognate_es}` : "") ||
          item.cognate ||
          item.es_cognate ||
          "",
      ).trim();
      const tier = item.tier
        ? String(item.tier).toLowerCase().startsWith("tier")
          ? String(item.tier)
          : `Tier ${item.tier}`
        : "Tier 2";
      return { word, tier, definition, cognate };
    })
    .filter((v) => v?.word);
}

function extractMorphology(word) {
  const clean = String(word || "").trim();
  const single = clean.split(/\s+/)[0] || clean;
  for (const rule of MORPHOLOGY_PARTS) {
    const m = single.match(rule.pattern);
    if (m) return rule.parts(m);
  }
  if (clean.includes(" ")) {
    const parts = clean.split(/\s+/);
    return `Phrase: "${parts[0]}" + "${parts.slice(1).join(" ")}"`;
  }
  return `Root word: ${clean.toLowerCase()} (${clean.length} letters)`;
}

function falseCognateNote(word, l1Watchouts) {
  const lower = String(word || "").toLowerCase();
  for (const [k, note] of Object.entries(FALSE_COGNATE_WATCH)) {
    if (lower.includes(k)) return note;
  }
  const watchList = Array.isArray(l1Watchouts) ? l1Watchouts : [];
  const hit = watchList.find((w) => {
    const text = `${w?.friction_point || ""} ${w?.watchout || ""} ${w?.note || ""}`.toLowerCase();
    return lower.length >= 4 && text.includes(lower);
  });
  if (hit) {
    return String(hit.friction_point || hit.watchout || hit.note || "").trim();
  }
  return "";
}

function subjectMeaning(word, subject, unitTitle) {
  const s = String(subject || "").toLowerCase();
  if (s.includes("math")) {
    return `In Math (${unitTitle}), "${word}" names a precise relationship, quantity, or representation students model and justify.`;
  }
  if (s.includes("science")) {
    return `In Science (${unitTitle}), "${word}" describes an observable mechanism, variable, or system interaction supported by evidence.`;
  }
  if (s.includes("social")) {
    return `In Social Studies (${unitTitle}), "${word}" helps analyze historical events, perspectives, or civic systems using sources.`;
  }
  return `In ELA (${unitTitle}), "${word}" helps readers analyze text structure, author craft, and textual evidence.`;
}

function buildContextExample(word, subject, unitTitle, frame) {
  if (frame && frame.length > 18) {
    return `Using "${word}" in ${unitTitle}: ${frame.replace(/___+/g, word)}`;
  }
  const s = String(subject || "").toLowerCase();
  if (s.includes("math")) {
    return `Example: "I checked the ${word.toLowerCase()} in my diagram to verify that both quantities scale equally."`;
  }
  if (s.includes("science")) {
    return `Example: "Our investigation data shows how ${word.toLowerCase()} changes the outcome of the system."`;
  }
  if (s.includes("social")) {
    return `Example: "The primary source illustrates ${word.toLowerCase()} by showing how communities responded over time."`;
  }
  return `Example: "The author develops ${word.toLowerCase()} through key details in paragraph two."`;
}

function buildNonExample(word, subject) {
  const s = String(subject || "").toLowerCase();
  if (s.includes("math")) {
    return `Non-example: Guessing a number without labeling units or showing how "${word}" connects the two quantities.`;
  }
  if (s.includes("science")) {
    return `Non-example: Stating a personal opinion without connecting "${word}" to observed evidence or cause and effect.`;
  }
  if (s.includes("social")) {
    return `Non-example: Describing an event from only one viewpoint without citing a source for "${word}".`;
  }
  return `Non-example: Using "${word}" as a vague label without pointing to specific words or details in the text.`;
}

/**
 * Generates an original programmatic educational SVG visual model tailored to subject & concept.
 */
export function generateConceptSvg(word, subject, index = 0) {
  const label = esc(String(word || "Concept").slice(0, 26));
  const subj = String(subject || "ELA").toLowerCase();
  const variant = index % 3;

  if (subj.includes("math")) {
    if (variant === 0) {
      // Ratio Tape Diagram
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
        <title>Math ratio tape diagram for ${label}</title>
        <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
        <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#1e3a5f">TAPE MODEL · ${label}</text>
        <text x="14" y="53" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#475467">Part A</text>
        <rect x="64" y="36" width="52" height="24" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
        <rect x="120" y="36" width="52" height="24" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
        <rect x="176" y="36" width="52" height="24" rx="4" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="90" y="52" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">1 unit</text>
        <text x="146" y="52" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">1 unit</text>
        <text x="202" y="52" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#1e3a5f">1 unit</text>
        <text x="14" y="91" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#475467">Part B</text>
        <rect x="64" y="74" width="52" height="24" rx="4" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
        <rect x="120" y="74" width="52" height="24" rx="4" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
        <text x="90" y="90" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#0f766e">1 unit</text>
        <text x="146" y="90" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#0f766e">1 unit</text>
        <text x="242" y="72" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="#b45309">3 : 2</text>
        <text x="14" y="118" font-family="Inter, sans-serif" font-size="10" fill="#586377">Equal-sized parts show how quantities relate proportionally.</text>
      </svg>`;
    }
    if (variant === 1) {
      // Double Number Line
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
        <title>Math double number line for ${label}</title>
        <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
        <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#1e3a5f">DOUBLE NUMBER LINE · ${label}</text>
        <line x1="28" y1="54" x2="296" y2="54" stroke="#1e3a5f" stroke-width="2"/>
        <line x1="28" y1="90" x2="296" y2="90" stroke="#0f766e" stroke-width="2"/>
        <line x1="48" y1="48" x2="48" y2="96" stroke="#cbd5e1" stroke-dasharray="3 2"/>
        <line x1="128" y1="48" x2="128" y2="96" stroke="#cbd5e1" stroke-dasharray="3 2"/>
        <line x1="208" y1="48" x2="208" y2="96" stroke="#cbd5e1" stroke-dasharray="3 2"/>
        <line x1="278" y1="48" x2="278" y2="96" stroke="#cbd5e1" stroke-dasharray="3 2"/>
        <circle cx="48" cy="54" r="4" fill="#1e3a5f"/><circle cx="128" cy="54" r="4" fill="#1e3a5f"/><circle cx="208" cy="54" r="4" fill="#b45309"/><circle cx="278" cy="54" r="4" fill="#1e3a5f"/>
        <circle cx="48" cy="90" r="4" fill="#0f766e"/><circle cx="128" cy="90" r="4" fill="#0f766e"/><circle cx="208" cy="90" r="4" fill="#b45309"/><circle cx="278" cy="90" r="4" fill="#0f766e"/>
        <text x="48" y="43" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#182230">0</text>
        <text x="128" y="43" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#182230">1x</text>
        <text x="208" y="43" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#b45309">2x</text>
        <text x="278" y="43" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#182230">3x</text>
        <text x="48" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#0f766e">0</text>
        <text x="128" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#0f766e">a</text>
        <text x="208" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#b45309">2a</text>
        <text x="278" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#0f766e">3a</text>
        <text x="14" y="124" font-family="Inter, sans-serif" font-size="10" fill="#586377">Aligned tick marks preserve equivalent relationships.</text>
      </svg>`;
    }
    // Area / Array Model
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
      <title>Math area model for ${label}</title>
      <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
      <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#1e3a5f">AREA MODEL · ${label}</text>
      <rect x="44" y="38" width="140" height="62" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
      <rect x="184" y="38" width="84" height="62" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
      <text x="114" y="73" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#1e3a5f">Part 1</text>
      <text x="226" y="73" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#0f766e">Part 2</text>
      <text x="156" y="118" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#586377">Decompose into known parts to compose the total.</text>
    </svg>`;
  }

  if (subj.includes("science")) {
    if (variant === 0) {
      // Cause -> Mechanism -> Effect system flow
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
        <title>Science cause and effect system model for ${label}</title>
        <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
        <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#0f766e">SYSTEM FLOW · ${label}</text>
        <rect x="14" y="42" width="82" height="48" rx="6" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
        <text x="55" y="64" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#1e3a5f">INPUT</text>
        <text x="55" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Cause / Energy</text>
        <line x1="98" y1="66" x2="116" y2="66" stroke="#b45309" stroke-width="2"/>
        <polygon points="116,61 124,66 116,71" fill="#b45309"/>
        <rect x="124" y="42" width="82" height="48" rx="6" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
        <text x="165" y="64" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#0f766e">PROCESS</text>
        <text x="165" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Interaction</text>
        <line x1="208" y1="66" x2="226" y2="66" stroke="#b45309" stroke-width="2"/>
        <polygon points="226,61 234,66 226,71" fill="#b45309"/>
        <rect x="234" y="42" width="74" height="48" rx="6" fill="#fffbeb" stroke="#b45309" stroke-width="1.5"/>
        <text x="271" y="64" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#92400e">EFFECT</text>
        <text x="271" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Observed</text>
        <text x="14" y="114" font-family="Inter, sans-serif" font-size="10" fill="#586377">Track how a change in input drives an observable effect.</text>
      </svg>`;
    }
    // Evidence -> Claim cycle
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
      <title>Science claim and evidence diagram for ${label}</title>
      <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
      <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#0f766e">SCIENTIFIC EXPLANATION · ${label}</text>
      <circle cx="72" cy="70" r="32" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
      <text x="72" y="74" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#0f766e">Evidence</text>
      <line x1="106" y1="70" x2="128" y2="70" stroke="#1e3a5f" stroke-width="2"/>
      <polygon points="128,65 136,70 128,75" fill="#1e3a5f"/>
      <rect x="138" y="46" width="166" height="48" rx="8" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
      <text x="221" y="66" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#1e3a5f">Scientific Reasoning</text>
      <text x="221" y="82" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Connects data to ${label}</text>
      <text x="14" y="120" font-family="Inter, sans-serif" font-size="10" fill="#586377">Every scientific claim is anchored in observable data.</text>
    </svg>`;
  }

  if (subj.includes("social")) {
    if (variant === 0) {
      // Chronology Timeline
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
        <title>Social Studies timeline model for ${label}</title>
        <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
        <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#884326">HISTORICAL TIMELINE · ${label}</text>
        <line x1="28" y1="68" x2="292" y2="68" stroke="#1e3a5f" stroke-width="2.5"/>
        <circle cx="58" cy="68" r="6" fill="#1e3a5f"/>
        <circle cx="160" cy="68" r="7" fill="#b45309"/>
        <circle cx="262" cy="68" r="6" fill="#0f766e"/>
        <text x="58" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#1e3a5f">Context</text>
        <text x="160" y="48" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#b45309">Turning Point</text>
        <text x="262" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#0f766e">Impact</text>
        <text x="58" y="92" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Before</text>
        <text x="160" y="92" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Key Event</text>
        <text x="262" y="92" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Change</text>
        <text x="14" y="118" font-family="Inter, sans-serif" font-size="10" fill="#586377">Trace cause, continuity, and change across primary sources.</text>
      </svg>`;
    }
    // Perspective Comparison
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
      <title>Social Studies perspective comparison for ${label}</title>
      <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
      <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#884326">MULTIPLE PERSPECTIVES · ${label}</text>
      <rect x="16" y="40" width="124" height="54" rx="6" fill="#e8eef6" stroke="#1e3a5f" stroke-width="1.5"/>
      <text x="78" y="64" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#1e3a5f">Source A Viewpoint</text>
      <text x="78" y="80" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Who spoke &amp; why?</text>
      <rect x="180" y="40" width="124" height="54" rx="6" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
      <text x="242" y="64" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#0f766e">Source B Viewpoint</text>
      <text x="242" y="80" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">How does it differ?</text>
      <text x="160" y="72" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="#b45309">vs</text>
      <text x="14" y="116" font-family="Inter, sans-serif" font-size="10" fill="#586377">Corroborate claims by comparing multiple historical accounts.</text>
    </svg>`;
  }

  // ELA: Story Arc or Quote-to-Inference Bridge
  if (variant === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
      <title>ELA text evidence to inference bridge for ${label}</title>
      <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
      <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#1e3a5f">EVIDENCE BRIDGE · ${label}</text>
      <rect x="14" y="42" width="114" height="50" rx="6" fill="#f2efe9" stroke="#1e3a5f" stroke-width="1.5"/>
      <text x="71" y="63" text-anchor="middle" font-family="Source Serif 4, Georgia, serif" font-size="11" font-weight="600" fill="#182230">“Text Quote”</text>
      <text x="71" y="79" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">What the text says</text>
      <line x1="132" y1="67" x2="176" y2="67" stroke="#0f766e" stroke-width="2"/>
      <polygon points="176,62 184,67 176,72" fill="#0f766e"/>
      <rect x="188" y="42" width="118" height="50" rx="6" fill="#e1f2ef" stroke="#0f766e" stroke-width="1.5"/>
      <text x="247" y="63" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#0f766e">Inference / Claim</text>
      <text x="247" y="79" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">What it shows</text>
      <text x="14" y="116" font-family="Inter, sans-serif" font-size="10" fill="#586377">Connect exact words from the text to your academic claim.</text>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 132" width="320" height="132" role="img" style="background:#ffffff">
    <title>ELA narrative arc diagram for ${label}</title>
    <rect x="0" y="0" width="320" height="132" fill="#ffffff"/>
    <text x="14" y="22" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="700" fill="#1e3a5f">TEXT ARC · ${label}</text>
    <path d="M 24 94 Q 112 86 164 42 Q 222 86 296 94" fill="none" stroke="#1e3a5f" stroke-width="2.5"/>
    <circle cx="44" cy="91" r="5" fill="#1e3a5f"/>
    <circle cx="164" cy="42" r="6" fill="#b45309"/>
    <circle cx="280" cy="91" r="5" fill="#0f766e"/>
    <text x="44" y="109" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Setup</text>
    <text x="164" y="34" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#b45309">Key Shift</text>
    <text x="280" y="109" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="#475467">Resolution</text>
    <text x="14" y="124" font-family="Inter, sans-serif" font-size="10" fill="#586377">Notice how ideas or characters develop across the text.</text>
  </svg>`;
}

function speakWord(text, statusEl) {
  const clean = String(text || "").trim();
  if (!clean) return;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "en-US";
      utter.rate = 0.88;
      window.speechSynthesis.speak(utter);
      if (statusEl) statusEl.textContent = `Reading aloud: "${clean}"`;
      return;
    } catch {
      // Fallback below
    }
  }
  if (statusEl) statusEl.textContent = `Pronunciation support: read "${clean}" aloud together in syllables.`;
}

export function renderVisualVocabStudio(container, { unit, connection, blueprint, wida, onTelemetry } = {}) {
  if (!container) return;
  if (!unit) {
    container.innerHTML = `<div class="bh-empty">Choose a grade, subject, and unit above to open the Visual Vocabulary Studio.</div>`;
    return;
  }

  const vocab = normalizeVocab(connection?.tier2_tier3_vocab);
  const l1Raw = safeParseJson(connection?.l1_watchouts, []);
  const l1List = Array.isArray(l1Raw) ? l1Raw : l1Raw && typeof l1Raw === "object" ? Object.values(l1Raw) : [];
  const klu = blueprint?.wida_klu || unit.primary_klu || "Explain";
  const defaultBand = gradeBandFor(unit.grade);

  const prev = containerState.get(container);
  const st =
    prev && prev.unitId === unit.id
      ? prev
      : {
          unitId: unit.id,
          mode: "cards", // cards | practice | print
          band: defaultBand,
          tierFilter: "All",
          practiceMode: "match", // match | cloze | sentence
          selectedWord: null,
          matchedWords: new Set(),
          matchFeedback: "",
          clozeAnswers: {},
          sentenceDraft: "",
          sentenceFeedback: "",
        };
  containerState.set(container, st);

  function render() {
    keepView(container, draw);
  }

  function draw() {
    const filteredVocab = vocab.filter((v) => {
      if (st.tierFilter === "All") return true;
      return v.tier.toLowerCase().includes(st.tierFilter.toLowerCase());
    });

    container.innerHTML = `
      <div class="vs-shell is-band-${esc(st.band)}">
        <div class="vs-toolbar">
          <div>
            <span class="studio-kicker">Visual Vocabulary Studio · Unit ${esc(unit.unit_number)}</span>
            <h3 style="margin:0.15rem 0 0">${esc(unit.unit_title)} (${vocab.length} Verified Terms)</h3>
          </div>
          <div class="vs-mode-tabs" role="group" aria-label="Vocabulary classroom mode">
            <button type="button" class="vs-pill" data-vs-mode="cards" aria-pressed="${st.mode === "cards"}">Visual Word Cards</button>
            <button type="button" class="vs-pill" data-vs-mode="practice" aria-pressed="${st.mode === "practice"}">Interactive Practice</button>
            <button type="button" class="vs-pill" data-vs-mode="print" aria-pressed="${st.mode === "print"}">Printable Set</button>
          </div>
          <div class="vs-band-group" role="group" aria-label="Grade band layout mode">
            <button type="button" class="vs-pill" data-vs-band="k2" aria-pressed="${st.band === "k2"}">K–2</button>
            <button type="button" class="vs-pill" data-vs-band="35" aria-pressed="${st.band === "35"}">3–5</button>
            <button type="button" class="vs-pill" data-vs-band="68" aria-pressed="${st.band === "68"}">6–8</button>
          </div>
        </div>

        <p id="vsSpeechStatus" class="bh-muted" role="status" aria-live="polite" style="margin:0">
          Layout: <strong>${esc(bandLabel(st.band))}</strong> · WIDA Function: <strong>${esc(klu)}</strong> · Support Tier: <strong>${esc(wida || "3_4").replace("_", "–")}</strong>
        </p>

        ${st.mode === "cards" ? renderCardsMode(filteredVocab) : ""}
        ${st.mode === "practice" ? renderPracticeMode() : ""}
        ${st.mode === "print" ? renderPrintMode() : ""}
      </div>
    `;
  }

  function renderCardsMode(items) {
    if (!items.length) {
      return `<div class="bh-empty">No vocabulary items match this filter.</div>`;
    }
    return `
      <div class="vs-band-group" role="group" aria-label="Filter vocabulary tier">
        <button type="button" class="vs-pill" data-vs-tier="All" aria-pressed="${st.tierFilter === "All"}">All Tiers (${vocab.length})</button>
        <button type="button" class="vs-pill" data-vs-tier="Tier 2" aria-pressed="${st.tierFilter === "Tier 2"}">Tier 2 Academic</button>
        <button type="button" class="vs-pill" data-vs-tier="Tier 3" aria-pressed="${st.tierFilter === "Tier 3"}">Tier 3 Domain</button>
      </div>
      <div class="vs-cards-grid">
        ${items
          .map((v, idx) => {
            const morph = extractMorphology(v.word);
            const watch = falseCognateNote(v.word, l1List);
            const example = buildContextExample(v.word, unit.subject, unit.unit_title, connection?.unit_example_frame);
            const nonEx = buildNonExample(v.word, unit.subject);
            return `
              <article class="vs-card">
                <div class="vs-card-head">
                  <div>
                    <h4 class="vs-word-title">${esc(v.word)}</h4>
                    <span class="bh-tier-badge">${esc(v.tier)}</span>
                    <span class="bh-standard-chip">WIDA: ${esc(klu)}</span>
                  </div>
                  <button
                    type="button"
                    class="bh-btn bh-btn-secondary bh-btn-sm"
                    data-vs-speak="${esc(`${v.word}. ${v.definition || ""}`)}"
                    aria-label="Hear pronunciation of ${esc(v.word)}"
                  >
                    Listen
                  </button>
                </div>

                <div class="vs-svg-frame">
                  ${generateConceptSvg(v.word, unit.subject, idx)}
                </div>

                <div class="vs-meta-grid">
                  <p class="vs-meta-row vs-def"><strong>Student-Friendly Definition:</strong> ${esc(v.definition || `Key ${unit.subject} concept in ${unit.unit_title}.`)}</p>
                  <p class="vs-meta-row"><strong>Subject Meaning:</strong> ${esc(subjectMeaning(v.word, unit.subject, unit.unit_title))}</p>
                  <p class="vs-meta-row"><strong>Example in Context:</strong> ${esc(example)}</p>
                  ${st.band !== "k2" ? `<p class="vs-meta-row"><strong>Non-Example:</strong> ${esc(nonEx)}</p>` : ""}
                  <p class="vs-meta-row"><strong>Word Parts / Morphology:</strong> <span class="wida-code">${esc(morph)}</span></p>
                  ${v.cognate ? `<div><span class="vs-cognate-pill">${esc(v.cognate)}</span></div>` : ""}
                  ${watch ? `<div class="vs-feedback is-warn">${esc(watch)}</div>` : ""}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderPracticeMode() {
    const sample = vocab.slice(0, 4);
    if (!sample.length) {
      return `<div class="bh-empty">No vocabulary terms available for practice in this unit.</div>`;
    }

    return `
      <div class="vs-practice-box">
        <div class="vs-mode-tabs" role="group" aria-label="Vocabulary practice activity type">
          <button type="button" class="vs-pill" data-vs-practice="match" aria-pressed="${st.practiceMode === "match"}">1. Term Matching</button>
          <button type="button" class="vs-pill" data-vs-practice="cloze" aria-pressed="${st.practiceMode === "cloze"}">2. Context Cloze</button>
          <button type="button" class="vs-pill" data-vs-practice="sentence" aria-pressed="${st.practiceMode === "sentence"}">3. Sentence Builder</button>
        </div>

        ${
          st.practiceMode === "match"
            ? `
              <p class="bh-muted" style="margin:0">Select a target word, then select its matching student-friendly meaning.</p>
              <div class="vs-match-grid">
                <div style="display:grid;gap:0.5rem">
                  <strong>Target Terms</strong>
                  ${sample
                    .map((v) => {
                      const matched = st.matchedWords.has(v.word);
                      const selected = st.selectedWord === v.word;
                      return `<button type="button" class="vs-match-btn ${matched ? "is-matched" : selected ? "is-selected" : ""}" data-vs-match-word="${esc(v.word)}" ${matched ? "disabled" : ""}>${esc(v.word)} ${matched ? "✓" : ""}</button>`;
                    })
                    .join("")}
                </div>
                <div style="display:grid;gap:0.5rem">
                  <strong>Meanings</strong>
                  ${[...sample]
                    .reverse()
                    .map((v) => {
                      const matched = st.matchedWords.has(v.word);
                      return `<button type="button" class="vs-match-btn ${matched ? "is-matched" : ""}" data-vs-match-def="${esc(v.word)}" ${matched ? "disabled" : ""}>${esc(v.definition || `Key term for ${unit.unit_title}`)}</button>`;
                    })
                    .join("")}
                </div>
              </div>
              ${st.matchFeedback ? `<div class="vs-feedback ${st.matchFeedback.startsWith("Matched") ? "is-good" : "is-warn"}" role="status">${esc(st.matchFeedback)}</div>` : ""}
            `
            : ""
        }

        ${
          st.practiceMode === "cloze"
            ? `
              <p class="bh-muted" style="margin:0">Choose the exact academic term that completes each unit definition.</p>
              <div style="display:grid;gap:0.85rem">
                ${sample
                  .map((v, idx) => {
                    const picked = st.clozeAnswers[idx] || "";
                    const isRight = picked === v.word;
                    return `
                      <div class="cs-item-card">
                        <p style="margin:0"><strong>${idx + 1}.</strong> In ${esc(unit.unit_title)}, the term <strong>_____</strong> means: ${esc(v.definition || v.word)}</p>
                        <div class="vs-mode-tabs">
                          ${sample
                            .map(
                              (opt) => `
                                <button type="button" class="vs-pill" data-vs-cloze-idx="${idx}" data-vs-cloze-val="${esc(opt.word)}" aria-pressed="${picked === opt.word}">
                                  ${esc(opt.word)}
                                </button>
                              `,
                            )
                            .join("")}
                        </div>
                        ${
                          picked
                            ? `<div class="vs-feedback ${isRight ? "is-good" : "is-warn"}" role="status">${
                                isRight
                                  ? `Correct! "${v.word}" fits this academic meaning.`
                                  : `Not yet — re-read the meaning and try another term from the unit bank.`
                              }</div>`
                            : ""
                        }
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `
            : ""
        }

        ${
          st.practiceMode === "sentence"
            ? `
              <p class="bh-muted" style="margin:0">Write one complete ${esc(unit.subject)} sentence using at least one target term and a WIDA ${esc(klu)} connector (e.g., because, therefore, shows that).</p>
              <div class="vs-mode-tabs">
                ${sample
                  .map(
                    (v) =>
                      `<button type="button" class="vs-pill" data-vs-insert-term="${esc(v.word)}">+ ${esc(v.word)}</button>`,
                  )
                  .join("")}
              </div>
              <label for="vsSentenceInput" class="visually-hidden">Academic vocabulary sentence</label>
              <textarea id="vsSentenceInput" class="bh-seq-input" rows="3" placeholder="Write your academic sentence here…">${esc(st.sentenceDraft)}</textarea>
              <div>
                <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-vs-check-sentence>Check Sentence</button>
              </div>
              ${st.sentenceFeedback ? `<div class="vs-feedback ${st.sentenceFeedback.startsWith("Strong") ? "is-good" : "is-warn"}" role="status">${esc(st.sentenceFeedback)}</div>` : ""}
            `
            : ""
        }
      </div>
    `;
  }

  function renderPrintMode() {
    return `
      <div class="vs-practice-box">
        <div class="vs-card-head">
          <div>
            <h4 style="margin:0">Printable Vocabulary Card Set — Unit ${esc(unit.unit_number)}: ${esc(unit.unit_title)}</h4>
            <p class="bh-muted" style="margin:0.2rem 0 0">Formatted for student word walls, notebooks, and small-group cut-out cards.</p>
          </div>
          <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-vs-print-set>Print Vocabulary Set</button>
        </div>
        <div class="vs-cards-grid">
          ${vocab
            .map(
              (v, idx) => `
                <article class="vs-card">
                  <div class="vs-card-head">
                    <strong>${esc(v.word)}</strong>
                    <span class="bh-tier-badge">${esc(v.tier)}</span>
                  </div>
                  <div class="vs-svg-frame">${generateConceptSvg(v.word, unit.subject, idx)}</div>
                  <p style="margin:0;font-size:0.9rem">${esc(v.definition || "")}</p>
                  ${v.cognate ? `<p style="margin:0;font-size:0.84rem;color:var(--cognate-ink)"><strong>${esc(v.cognate)}</strong></p>` : ""}
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (!container.dataset.vsBound) {
    container.dataset.vsBound = "1";
    container.addEventListener("click", (e) => {
      const s = containerState.get(container);
      if (!s) return;

      const modeBtn = e.target.closest("[data-vs-mode]");
      if (modeBtn) {
        s.mode = modeBtn.dataset.vsMode;
        onTelemetry?.("vocab_lookup");
        render();
        return;
      }

      const bandBtn = e.target.closest("[data-vs-band]");
      if (bandBtn) {
        s.band = bandBtn.dataset.vsBand;
        render();
        return;
      }

      const tierBtn = e.target.closest("[data-vs-tier]");
      if (tierBtn) {
        s.tierFilter = tierBtn.dataset.vsTier;
        render();
        return;
      }

      const speakBtn = e.target.closest("[data-vs-speak]");
      if (speakBtn) {
        speakWord(speakBtn.dataset.vsSpeak, container.querySelector("#vsSpeechStatus"));
        onTelemetry?.("vocab_lookup");
        return;
      }

      const pBtn = e.target.closest("[data-vs-practice]");
      if (pBtn) {
        s.practiceMode = pBtn.dataset.vsPractice;
        render();
        return;
      }

      const mWord = e.target.closest("[data-vs-match-word]");
      if (mWord) {
        s.selectedWord = mWord.dataset.vsMatchWord;
        s.matchFeedback = `Selected "${s.selectedWord}". Now choose its matching meaning.`;
        render();
        return;
      }

      const mDef = e.target.closest("[data-vs-match-def]");
      if (mDef) {
        if (!s.selectedWord) {
          s.matchFeedback = "Choose a target term on the left first.";
        } else if (mDef.dataset.vsMatchDef === s.selectedWord) {
          s.matchedWords.add(s.selectedWord);
          s.matchFeedback = `Matched "${s.selectedWord}" accurately!`;
          s.selectedWord = null;
        } else {
          s.matchFeedback = `Look closely at "${s.selectedWord}" and try another meaning.`;
        }
        render();
        return;
      }

      const clozeBtn = e.target.closest("[data-vs-cloze-idx]");
      if (clozeBtn) {
        s.clozeAnswers[Number(clozeBtn.dataset.vsClozeIdx)] = clozeBtn.dataset.vsClozeVal;
        render();
        return;
      }

      const insBtn = e.target.closest("[data-vs-insert-term]");
      if (insBtn) {
        const input = container.querySelector("#vsSentenceInput");
        const cur = input ? input.value : s.sentenceDraft;
        const term = insBtn.dataset.vsInsertTerm;
        s.sentenceDraft = cur ? `${cur.trim()} ${term} ` : `${term} `;
        render();
        return;
      }

      if (e.target.closest("[data-vs-check-sentence]")) {
        const input = container.querySelector("#vsSentenceInput");
        s.sentenceDraft = input ? input.value.trim() : s.sentenceDraft.trim();
        const lower = s.sentenceDraft.toLowerCase();
        const usedTerm = vocab.some((v) => lower.includes(v.word.toLowerCase()));
        const wordCount = s.sentenceDraft ? s.sentenceDraft.split(/\s+/).length : 0;
        if (usedTerm && wordCount >= 7) {
          s.sentenceFeedback = "Strong academic sentence! You used unit vocabulary in a complete explanation.";
        } else if (!usedTerm) {
          s.sentenceFeedback = "Revision hint: include at least one target vocabulary term from this unit.";
        } else {
          s.sentenceFeedback = "Revision hint: expand your sentence with 'because', 'so', or an example from the lesson.";
        }
        render();
        return;
      }

      if (e.target.closest("[data-vs-print-set]")) {
        window.print();
      }
    });

    container.addEventListener("input", (e) => {
      if (e.target.id === "vsSentenceInput") {
        const s = containerState.get(container);
        if (s) s.sentenceDraft = e.target.value;
      }
    });
  }

  draw();
}
