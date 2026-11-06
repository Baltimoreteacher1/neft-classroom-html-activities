// Science of Reading (SoR) Interactive Research & Practice Studio
// Grounded in:
//   - Scarborough's Reading Rope (2001)
//   - The Simple View of Reading (Gough & Tunmer, 1986; Hoover & Tunmer, 2020)
//   - Linnea Ehri's 4 Phases of Word Reading Development
//   - Speech-to-Print Sound Walls (Moats, 2020) & Orthographic Mapping (Kilpatrick, 2015)
//   - CLOVER 6 Syllable Types & Syllable Division Rules
//   - Morphology & Multilingual Cognate Bridges for English Learners

import { crumbsHTML } from "../components.js";
import { BASE, esc, html, icon } from "../util.js";

// --- 1. The Simple View of Reading (SVR) Models ---
export const SVR_PROFILES = [
  {
    id: "typical",
    label: "Skilled Reader",
    d: 90,
    lc: 90,
    desc: "Strong word recognition and strong language comprehension produce effortless, fluent reading with deep text understanding.",
  },
  {
    id: "dyslexia",
    label: "Dyslexic Profile",
    d: 25,
    lc: 85,
    desc: "Strong oral language and conceptual understanding, but struggles with phonological decoding and word recognition. Multiplicative product limits overall comprehension.",
  },
  {
    id: "hyperlexia",
    label: "Hyperlexic Profile",
    d: 90,
    lc: 30,
    desc: "High decoding accuracy and rapid word reading, but struggles with vocabulary, inference, and syntax comprehension.",
  },
  {
    id: "el",
    label: "Multilingual Learner (Developing)",
    d: 65,
    lc: 45,
    desc: "Developing English phonology and vocabulary. Benefits tremendously from explicit phonics paired with rich background knowledge and cognate transfer.",
  },
];

// --- 2. Ehri's Phases of Word Reading Development ---
export const EHRI_PHASES = [
  {
    phase: "1. Pre-Alphabetic",
    focus: "Visual & Environmental Cues",
    characteristics: "Reads signs or logos based on visual context (e.g., recognizing McDonald's by golden arches) with no letter-sound connection.",
    instruction: "Phonological awareness games, rhyming, listening for beginning sounds, letter identification.",
  },
  {
    phase: "2. Early Alphabetic",
    focus: "Initial & Salient Sounds",
    characteristics: "Uses first and last letter sounds to guess words (e.g., reads 'ball' as 'bell' or 'bat'). Incomplete mapping.",
    instruction: "Systematic phonics, CVC blending, explicit sound-spelling correspondences.",
  },
  {
    phase: "3. Later Alphabetic",
    focus: "Full Phoneme-Grapheme Mapping",
    characteristics: "Maps every phoneme to its corresponding grapheme. Can decode unfamiliar regular words sound-by-sound.",
    instruction: "Consonant blends, digraphs, vowel teams, orthographic mapping of high-frequency words.",
  },
  {
    phase: "4. Consolidated Alphabetic",
    focus: "Morphemic & Multi-Syllabic Chunks",
    characteristics: "Recognizes larger recurring chunks (prefixes, roots, suffixes, syllables). Instant, automatic word retrieval.",
    instruction: "Morphology, syllable division rules, Greek and Latin roots, fluent prosodic reading.",
  },
];

// --- 3. Scarborough's Reading Rope Data ---
export const ROPE_STRANDS = {
  upper: {
    title: "Language Comprehension (Increasingly Strategic)",
    color: "#2563eb",
    strands: [
      { id: "bg-knowledge", name: "Background Knowledge", desc: "Facts, concepts, and schema about the world that anchor text comprehension.", examples: "Domain immersion, science experiments, cultural context" },
      { id: "vocabulary", name: "Vocabulary (Breadth & Depth)", desc: "Receptive and expressive vocabulary, word relationships, and Tier 2 academic terms.", examples: "Semantic mapping, morphology, multiple-meaning words" },
      { id: "language-structures", name: "Language Structures (Syntax & Semantics)", desc: "Grammatical conventions, complex syntax, sentence boundaries, and cohesive devices.", examples: "Fronted adverbials, passive voice, relative clauses" },
      { id: "verbal-reasoning", name: "Verbal Reasoning (Inference & Metaphor)", desc: "Reading between the lines, evaluating cause/effect, and understanding figurative language.", examples: "Similes, analogies, drawing logical conclusions" },
      { id: "literacy-knowledge", name: "Literacy Knowledge (Print Concepts & Genres)", desc: "Text structures, narrative vs expository text, authors' craft, and text features.", examples: "Headings, indices, story elements, dialogue tags" },
    ],
  },
  lower: {
    title: "Word Recognition (Increasingly Automatic)",
    color: "#059669",
    strands: [
      { id: "phonological-awareness", name: "Phonological Awareness", desc: "Awareness of the sound structure of spoken language: syllables, onsets, rimes, and phonemic awareness.", examples: "Phoneme segmenting, blending, isolation, manipulation" },
      { id: "decoding", name: "Decoding (Phonics & Alphabetic Principle)", desc: "Connecting graphemes (letters) to phonemes (sounds) and blending to read unfamiliar words.", examples: "Sound-spelling correspondences, syllable division, decodable text" },
      { id: "sight-recognition", name: "Sight Recognition (Orthographic Mapping)", desc: "Instant, effortless retrieval of familiar words permanently bonded in lexical memory.", examples: "Orthographic mapping, high-frequency irregular words, automaticity" },
    ],
  },
};

// --- 4. Vowel Valley & Sound Wall Data ---
export const VOWEL_VALLEY = [
  { phoneme: "/ē/", example: "see", mouth: "Smile / High Front", sound: "ee", shape: "smile" },
  { phoneme: "/ĭ/", example: "sit", mouth: "Relaxed / High Front", sound: "ih", shape: "smile" },
  { phoneme: "/ā/", example: "say", mouth: "Mid Front", sound: "ay", shape: "mid" },
  { phoneme: "/ĕ/", example: "bed", mouth: "Mid-Low Front", sound: "eh", shape: "mid" },
  { phoneme: "/ă/", example: "cat", mouth: "Low Front / Open", sound: "ah-short", shape: "open" },
  { phoneme: "/ä/", example: "father", mouth: "Lowest / Open Jaw", sound: "ah", shape: "open-wide" },
  { phoneme: "/ŏ/", example: "hot", mouth: "Low Back / Rounded", sound: "aw", shape: "round" },
  { phoneme: "/ō/", example: "boat", mouth: "Mid Back / Rounded", sound: "oh", shape: "round" },
  { phoneme: "/o͝o/", example: "book", mouth: "High-Mid Back / Pursed", sound: "uu", shape: "pursed" },
  { phoneme: "/o͞o/", example: "moon", mouth: "High Back / Tight Circle", sound: "oo", shape: "tight-round" },
  { phoneme: "/ŭ/", example: "cup", mouth: "Center / Neutral Jaw", sound: "uh", shape: "neutral" },
  { phoneme: "/ər/", example: "bird", mouth: "Center / R-Controlled", sound: "er", shape: "r-curl" },
];

export const CONSONANT_CATEGORIES = [
  {
    manner: "Stops (Plosives)",
    desc: "Airflow is completely blocked, then released in a quick burst.",
    pairs: [
      { unvoiced: "/p/ (pan)", voiced: "/b/ (bat)" },
      { unvoiced: "/t/ (top)", voiced: "/d/ (dog)" },
      { unvoiced: "/k/ (kite)", voiced: "/g/ (go)" },
    ],
  },
  {
    manner: "Fricatives (Continuous Air)",
    desc: "Air is forced through a narrow channel, making continuous friction.",
    pairs: [
      { unvoiced: "/f/ (fan)", voiced: "/v/ (van)" },
      { unvoiced: "/th/ (think)", voiced: "/th/ (they)" },
      { unvoiced: "/s/ (sun)", voiced: "/z/ (zoo)" },
      { unvoiced: "/sh/ (ship)", voiced: "/zh/ (measure)" },
      { unvoiced: "/h/ (hat)", voiced: "—" },
    ],
  },
  {
    manner: "Affricates (Stop + Friction)",
    desc: "Starts as a stop and releases with a slow friction burst.",
    pairs: [
      { unvoiced: "/ch/ (chin)", voiced: "/j/ (jam)" },
    ],
  },
  {
    manner: "Nasals (Air through Nose)",
    desc: "Mouth is closed; air resonates through the nasal cavity.",
    pairs: [
      { unvoiced: "—", voiced: "/m/ (mat)" },
      { unvoiced: "—", voiced: "/n/ (net)" },
      { unvoiced: "—", voiced: "/ng/ (sing)" },
    ],
  },
  {
    manner: "Glides & Liquids",
    desc: "Smooth vowel-like airflow with tongue position shaping the sound.",
    pairs: [
      { unvoiced: "/wh/ (whistle)", voiced: "/w/ (win)" },
      { unvoiced: "—", voiced: "/y/ (yes)" },
      { unvoiced: "—", voiced: "/l/ (lip)" },
      { unvoiced: "—", voiced: "/r/ (run)" },
    ],
  },
];

// --- 5. Orthographic Mapping Words ---
export const MAPPING_WORDS = {
  said: {
    word: "said",
    sounds: ["/s/", "/ĕ/", "/d/"],
    letters: ["s", "ai", "d"],
    hearts: [1],
    heartNote: "'ai' makes the unexpected short-e /ĕ/ sound. The 's' and 'd' are fully regular!",
  },
  could: {
    word: "could",
    sounds: ["/k/", "/o͝o/", "/d/"],
    letters: ["c", "oul", "d"],
    hearts: [1],
    heartNote: "'oul' makes the short /o͝o/ sound (as in book) with silent 'l'.",
  },
  they: {
    word: "they",
    sounds: ["/th/", "/ā/"],
    letters: ["th", "ey"],
    hearts: [1],
    heartNote: "'ey' makes the long-a /ā/ sound instead of the typical /ē/.",
  },
  heart: {
    word: "heart",
    sounds: ["/h/", "/ar/", "/t/"],
    letters: ["h", "ear", "t"],
    hearts: [1],
    heartNote: "'ear' makes the /ar/ sound (like car) instead of /eer/ or /er/.",
  },
  from: {
    word: "from",
    sounds: ["/f/", "/r/", "/ŭ/", "/m/"],
    letters: ["f", "r", "o", "m"],
    hearts: [2],
    heartNote: "'o' makes the short /ŭ/ sound (like cup).",
  },
  friend: {
    word: "friend",
    sounds: ["/f/", "/r/", "/ĕ/", "/n/", "/d/"],
    letters: ["f", "r", "ie", "n", "d"],
    hearts: [2],
    heartNote: "'ie' makes the short-e /ĕ/ sound with silent 'i'.",
  },
  cat: {
    word: "cat",
    sounds: ["/k/", "/ă/", "/t/"],
    letters: ["c", "a", "t"],
    hearts: [],
    heartNote: "Fully decodable regular CVC word: every letter maps directly to its common sound.",
  },
  ship: {
    word: "ship",
    sounds: ["/sh/", "/ĭ/", "/p/"],
    letters: ["sh", "i", "p"],
    hearts: [],
    heartNote: "Fully decodable: consonant digraph 'sh' makes one phoneme.",
  },
  catch: {
    word: "catch",
    sounds: ["/k/", "/ă/", "/ch/"],
    letters: ["c", "a", "tch"],
    hearts: [],
    heartNote: "Fully decodable: trigraph 'tch' follows a short vowel.",
  },
  train: {
    word: "train",
    sounds: ["/t/", "/r/", "/ā/", "/n/"],
    letters: ["t", "r", "ai", "n"],
    hearts: [],
    heartNote: "Fully decodable: consonant blend 'tr' + vowel team 'ai' + final 'n'.",
  },
  night: {
    word: "night",
    sounds: ["/n/", "/ī/", "/t/"],
    letters: ["n", "igh", "t"],
    hearts: [],
    heartNote: "Fully decodable: high-frequency trigraph 'igh' makes long /ī/ sound.",
  },
};

// --- 6. The 6 Syllable Types & Syllable Division Chopper ---
export const SYLLABLE_TYPES = [
  { id: "closed", code: "C", name: "Closed Syllable", rule: "One vowel followed by one or more consonants. The vowel is short (ă, ĕ, ĭ, ŏ, ŭ).", examples: ["cat", "nap-kin", "pic-nic", "sub-mit"] },
  { id: "open", code: "O", name: "Open Syllable", rule: "Ends in a single vowel. The vowel is long and says its name (ā, ē, ī, ō, ū).", examples: ["me", "ti-ger", "ro-bot", "mu-sic"] },
  { id: "vce", code: "V", name: "Vowel-Consonant-e (Magic E)", rule: "Contains a vowel, a consonant, and a silent e that signals the vowel to be long.", examples: ["cake", "rep-tile", "in-flate", "hope"] },
  { id: "vteam", code: "E", name: "Vowel Team", rule: "Two vowels working together to make one sound (e.g. ai, ea, oa, ou, oi).", examples: ["rain", "boat", "sail-or", "lead-er"] },
  { id: "rctrl", code: "R", name: "R-Controlled (Vowel-r)", rule: "A vowel followed by 'r'. The 'r' controls and alters the vowel sound (ar, er, ir, or, ur).", examples: ["bird", "doc-tor", "cir-cus", "per-son"] },
  { id: "cle", code: "L", name: "Consonant-le", rule: "Found at the end of multisyllabic words with a consonant + 'le' (silent e).", examples: ["can-dle", "bub-ble", "pur-ple", "sta-ble"] },
];

export const CHOPPER_WORDS = [
  { word: "rabbit", parts: ["rab", "bit"], splitIndex: 3, rule: "VCCV (Rabbit Rule)", explain: "Divide between the two consonants: rab | bit" },
  { word: "napkin", parts: ["nap", "kin"], splitIndex: 3, rule: "VCCV (Rabbit Rule)", explain: "Divide between two consonants: nap | kin" },
  { word: "tiger", parts: ["ti", "ger"], splitIndex: 2, rule: "VCV (Tiger Rule - 75%)", explain: "Divide after the first vowel to make it open & long: ti | ger" },
  { word: "camel", parts: ["cam", "el"], splitIndex: 3, rule: "VCV (Camel Rule - 25%)", explain: "Divide after the consonant to keep the first vowel closed & short: cam | el" },
  { word: "lion", parts: ["li", "on"], splitIndex: 2, rule: "VV (Lion Rule)", explain: "Two adjacent vowels that do not form a team divide: li | on" },
  { word: "candle", parts: ["can", "dle"], splitIndex: 3, rule: "Consonant-le (Turtle Rule)", explain: "Count back 3 letters from the end for consonant + -le: can | dle" },
];

// --- 7. Morphology Matrix Data with Spanish Cognates ---
export const MORPH_PREFIXES = [
  { aff: "re-", meaning: "again, back", example: "rebuild" },
  { aff: "un-", meaning: "not, opposite of", example: "unlock" },
  { aff: "dis-", meaning: "apart, away, not", example: "disrupt" },
  { aff: "in-/im-", meaning: "in, into, or not", example: "import" },
  { aff: "trans-", meaning: "across, beyond", example: "transport" },
  { aff: "con-/com-", meaning: "with, together", example: "construct" },
];

export const MORPH_ROOTS = [
  { root: "struct", origin: "Latin", meaning: "to build", cognate: "construcción / estructura" },
  { root: "port", origin: "Latin", meaning: "to carry", cognate: "transportar / importar" },
  { root: "tract", origin: "Latin", meaning: "to pull or drag", cognate: "atraer / contrato" },
  { root: "rupt", origin: "Latin", meaning: "to break", cognate: "interrumpir / erupción" },
  { root: "scrib / script", origin: "Latin", meaning: "to write", cognate: "escribir / manuscrito" },
  { root: "bio", origin: "Greek", meaning: "life", cognate: "biología / biografía" },
];

export const MORPH_SUFFIXES = [
  { aff: "-ion / -tion", meaning: "act, process, or state of", pos: "noun" },
  { aff: "-able / -ible", meaning: "able to be, capable of", pos: "adjective" },
  { aff: "-or / -er", meaning: "one who does", pos: "noun" },
  { aff: "-ive", meaning: "tending to, quality of", pos: "adjective" },
  { aff: "-ure", meaning: "act, result, or process", pos: "noun" },
];

// In-memory view state
let state = {
  tab: "rope", // "rope", "svr", "soundwall", "mapping", "syllables", "morphology"
  braidTightness: 75,
  mappedWord: "said",
  chopperIdx: 0,
  chopperGuess: null,
  chopperResult: null,
  morphPrefix: 5, // con-
  morphRoot: 0,   // struct
  morphSuffix: 0, // -tion
  svrD: 75,
  svrLC: 80,
};

// --- SVG Rendering Helpers ---
function renderRopeSvg(tightness) {
  // tightness 0 (loose/early) -> 100 (tight/skilled)
  const factor = tightness / 100;
  const upperY = 135 - factor * 10;
  const lowerY = 145 + factor * 10;

  return `
    <svg viewBox="0 0 760 290" class="sor-rope-svg" role="img" aria-label="Scarborough's Reading Rope interactive diagram">
      <defs>
        <linearGradient id="gradLang" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="gradWord" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
        <linearGradient id="gradSkilled" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#4f46e5"/>
          <stop offset="50%" stop-color="#0891b2"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
        <filter id="sorShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
        </filter>
      </defs>

      <!-- Upper Braids: Language Comprehension (Strategic) -->
      <g filter="url(#sorShadow)">
        <path d="M 40,25 C 240,${25 + factor * 50} 380,${85 + factor * 40} 490,${upperY}" fill="none" stroke="#60a5fa" stroke-width="${4 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,50 C 240,${50 + factor * 45} 380,${95 + factor * 35} 490,${upperY + 4}" fill="none" stroke="#3b82f6" stroke-width="${4 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,75 C 240,${75 + factor * 40} 380,${105 + factor * 30} 490,${upperY + 8}" fill="none" stroke="#2563eb" stroke-width="${4 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,100 C 240,${100 + factor * 35} 380,${115 + factor * 25} 490,${upperY + 12}" fill="none" stroke="#1d4ed8" stroke-width="${4 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,125 C 240,${125 + factor * 25} 380,${125 + factor * 15} 490,${upperY + 16}" fill="none" stroke="#1e40af" stroke-width="${4 + factor * 2}" stroke-linecap="round"/>
      </g>

      <text x="45" y="20" font-size="11" font-weight="800" fill="#1e40af">Background Knowledge (Schema &amp; Concepts)</text>
      <text x="45" y="45" font-size="11" font-weight="800" fill="#1e40af">Vocabulary (Breadth &amp; Precision)</text>
      <text x="45" y="70" font-size="11" font-weight="800" fill="#1e40af">Language Structures (Syntax &amp; Semantics)</text>
      <text x="45" y="95" font-size="11" font-weight="800" fill="#1e40af">Verbal Reasoning (Inference &amp; Metaphor)</text>
      <text x="45" y="120" font-size="11" font-weight="800" fill="#1e40af">Literacy Knowledge (Print Concepts &amp; Genre)</text>

      <!-- Lower Braids: Word Recognition (Automatic) -->
      <g filter="url(#sorShadow)">
        <path d="M 40,185 C 240,${185 - factor * 25} 380,${165 - factor * 15} 490,${lowerY - 14}" fill="none" stroke="#34d399" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,215 C 240,${215 - factor * 35} 380,${175 - factor * 25} 490,${lowerY - 8}" fill="none" stroke="#10b981" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 40,245 C 240,${245 - factor * 45} 380,${185 - factor * 35} 490,${lowerY}" fill="none" stroke="#059669" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
      </g>

      <text x="45" y="180" font-size="11" font-weight="800" fill="#065f46">Phonological Awareness (Syllables, Phonemes)</text>
      <text x="45" y="210" font-size="11" font-weight="800" fill="#065f46">Decoding (Alphabetic Principle &amp; Phonics)</text>
      <text x="45" y="240" font-size="11" font-weight="800" fill="#065f46">Sight Recognition (Orthographic Mapping)</text>

      <!-- Woven Convergence: Skilled Reading -->
      <path d="M 490,140 C 560,140 600,140 710,140" fill="none" stroke="url(#gradSkilled)" stroke-width="${10 + factor * 10}" stroke-linecap="round" stroke-dasharray="${factor < 0.4 ? '6,4' : 'none'}"/>
      
      <circle cx="710" cy="140" r="${10 + factor * 4}" fill="#0f766e"/>
      <text x="530" y="105" font-size="16" font-weight="900" fill="#0f766e">SKILLED READING</text>
      <text x="530" y="180" font-size="12" font-weight="700" fill="#334155">${factor > 0.7 ? "Fluent execution &amp; comprehension" : "Developing coordination &amp; accuracy"}</text>
    </svg>
  `;
}

// --- Mouth Shape SVG helper ---
function renderMouthShapeSvg(shape) {
  switch (shape) {
    case "smile":
      return `<svg class="vowel-mouth-shape" viewBox="0 0 50 34"><path d="M 8,16 Q 25,28 42,16" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/></svg>`;
    case "open":
    case "open-wide":
      return `<svg class="vowel-mouth-shape" viewBox="0 0 50 34"><ellipse cx="25" cy="17" rx="14" ry="${shape === 'open-wide' ? 12 : 9}" fill="#fee2e2" stroke="#ef4444" stroke-width="2.5"/></svg>`;
    case "round":
    case "tight-round":
    case "pursed":
      return `<svg class="vowel-mouth-shape" viewBox="0 0 50 34"><circle cx="25" cy="17" r="${shape === 'tight-round' ? 7 : 10}" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/></svg>`;
    default:
      return `<svg class="vowel-mouth-shape" viewBox="0 0 50 34"><ellipse cx="25" cy="17" rx="12" ry="6" fill="#f1f5f9" stroke="#64748b" stroke-width="2.5"/></svg>`;
  }
}

export async function render(ctx = {}) {
  const currentTab = state.tab;
  const mappedObj = MAPPING_WORDS[state.mappedWord] || MAPPING_WORDS.said;
  const currentChop = CHOPPER_WORDS[state.chopperIdx];

  // SVR Calculated Product
  const svrProduct = Math.round((state.svrD / 100) * (state.svrLC / 100) * 100);

  // Constructed Word
  const prefixObj = MORPH_PREFIXES[state.morphPrefix];
  const rootObj = MORPH_ROOTS[state.morphRoot];
  const suffixObj = MORPH_SUFFIXES[state.morphSuffix];
  const rawPrefix = prefixObj.aff.replace(/[\/-].*$/, "");
  const rawRoot = rootObj.root.split(" ")[0];
  const rawSuffix = suffixObj.aff.replace(/^[-\/]/, "").split(" ")[0];
  const constructedWord = `${rawPrefix}${rawRoot}${rawSuffix}`;

  const htmlContent = `
    <div class="sor-container">
      ${crumbsHTML([
        ["The Language Page", `${BASE}/`],
        ["Science of Reading Studio"],
      ])}

      <div class="sor-header">
        <div class="sor-title-wrap">
          <h1>Science of Reading Research &amp; Practice Studio</h1>
          <p class="sor-lead">
            Empowering teachers and multilingual learners with evidence-based cognitive models: Scarborough's Reading Rope, Speech-to-Print Sound Walls, Orthographic Mapping with Heart Words, and CLOVER Syllable Division.
          </p>
        </div>
        <div class="sor-evidence-badge">
          <span>🧠 Grounded in Cognitive &amp; Linguistic Science</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="sor-nav-tabs" role="tablist">
        <button type="button" class="sor-tab-btn ${currentTab === "rope" ? "active" : ""}" data-sor-tab="rope">🪢 Reading Rope Explorer</button>
        <button type="button" class="sor-tab-btn ${currentTab === "svr" ? "active" : ""}" data-sor-tab="svr">📐 Simple View of Reading</button>
        <button type="button" class="sor-tab-btn ${currentTab === "soundwall" ? "active" : ""}" data-sor-tab="soundwall">🗣️ Sound Wall &amp; Vowel Valley</button>
        <button type="button" class="sor-tab-btn ${currentTab === "mapping" ? "active" : ""}" data-sor-tab="mapping">🟩 Orthographic Mapping &amp; Heart Words</button>
        <button type="button" class="sor-tab-btn ${currentTab === "syllables" ? "active" : ""}" data-sor-tab="syllables">🧩 6 Syllables &amp; Division Chopper</button>
        <button type="button" class="sor-tab-btn ${currentTab === "morphology" ? "active" : ""}" data-sor-tab="morphology">🌱 Morphology &amp; Cognate Matrix</button>
      </div>

      <!-- Main Stage Body -->
      <div class="sor-stage-body">
        
        <!-- 1. Reading Rope Tab -->
        ${currentTab === "rope" ? `
          <div class="sor-panel-section">
            <div class="sor-rope-banner">
              <h3>Dr. Hollis Scarborough’s Reading Rope (2001)</h3>
              <p>Reading is not a single natural skill; it is a complex woven tapestry of Language Comprehension and Word Recognition. Interact with the braiding slider below to observe how isolated strands weave into automatic, fluent reading.</p>
            </div>

            <!-- Interactive Braiding Slider -->
            <div class="sor-braid-control">
              <div class="sor-braid-header">
                <span>Rope Braiding &amp; Reader Fluency:</span>
                <strong id="braidStatusLabel">${state.braidTightness < 35 ? "Novice / Early Reader (Isolated Strands)" : state.braidTightness < 70 ? "Developing Reader (Strands Braiding)" : "Skilled Fluent Reader (Integrated Automaticity)"}</strong>
              </div>
              <input type="range" class="sor-braid-slider" id="ropeBraider" min="10" max="100" value="${state.braidTightness}" aria-label="Rope braiding tightness"/>
              <div class="sor-braid-labels">
                <span>Early Emergent (Phonemic &amp; Print Concepts)</span>
                <span>Transitional (Blending &amp; Syntactic Parsing)</span>
                <span>Skilled Automatic (Fluent Comprehension)</span>
              </div>
            </div>

            <div class="sor-rope-svg-wrap">
              ${renderRopeSvg(state.braidTightness)}
            </div>

            <div class="sor-strands-comparison-grid">
              <div class="sor-strand-column lang-comp">
                <h4>${ROPE_STRANDS.upper.title}</h4>
                <div class="sor-strand-cards">
                  ${ROPE_STRANDS.upper.strands.map((s) => `
                    <div class="strand-card">
                      <strong>${esc(s.name)}</strong>
                      <p>${esc(s.desc)}</p>
                      <small>💡 Classroom Action: ${esc(s.examples)}</small>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div class="sor-strand-column word-rec">
                <h4>${ROPE_STRANDS.lower.title}</h4>
                <div class="sor-strand-cards">
                  ${ROPE_STRANDS.lower.strands.map((s) => `
                    <div class="strand-card">
                      <strong>${esc(s.name)}</strong>
                      <p>${esc(s.desc)}</p>
                      <small>💡 Classroom Action: ${esc(s.examples)}</small>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 2. Simple View of Reading Tab -->
        ${currentTab === "svr" ? `
          <div class="sor-panel-section">
            <div class="sor-rope-banner">
              <h3>The Simple View of Reading (Gough &amp; Tunmer, 1986)</h3>
              <p>Reading Comprehension (RC) is the <em>mathematical product</em> of Decoding (D) and Language Comprehension (LC):</p>
              <div style="margin:1rem 0;font-size:1.5rem;font-weight:800;color:var(--ocean-900,#075568);text-align:center;font-family:'Fraunces',Georgia,serif">
                RC = D × LC
              </div>
              <p>Because it is a multiplication equation, if either Decoding or Language Comprehension equals zero, Reading Comprehension will equal zero. Neither skill alone is sufficient.</p>
            </div>

            <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:14px;padding:1.5rem;margin-bottom:2rem">
              <h4 style="margin:0 0 1rem;font-size:1.125rem">Interactive SVR Diagnostic Calculator</h4>
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1.5rem;align-items:center">
                <div>
                  <label style="display:block;font-weight:700;margin-bottom:0.5rem">Decoding (D): <span id="valD">${state.svrD}%</span></label>
                  <input type="range" min="0" max="100" value="${state.svrD}" id="inputD" style="width:100%"/>
                  <small style="color:#64748b">Phonics, word recognition, accuracy</small>
                </div>
                <div style="text-align:center;font-size:1.75rem;font-weight:800;color:#94a3b8">×</div>
                <div>
                  <label style="display:block;font-weight:700;margin-bottom:0.5rem">Language Comp (LC): <span id="valLC">${state.svrLC}%</span></label>
                  <input type="range" min="0" max="100" value="${state.svrLC}" id="inputLC" style="width:100%"/>
                  <small style="color:#64748b">Vocabulary, background knowledge, syntax</small>
                </div>
                <div style="text-align:center;font-size:1.75rem;font-weight:800;color:#94a3b8">=</div>
                <div style="background:#ffffff;border:2px solid #0284c7;border-radius:12px;padding:1rem;text-align:center">
                  <span style="font-size:0.8125rem;font-weight:700;color:#0369a1;text-transform:uppercase">Reading Comprehension</span>
                  <div style="font-size:2.25rem;font-weight:900;color:#0284c7;font-family:'Fraunces',Georgia,serif" id="valRC">${svrProduct}%</div>
                </div>
              </div>

              <div style="margin-top:1.5rem">
                <span style="font-weight:700;font-size:0.875rem;margin-right:0.5rem">Test Archetypes:</span>
                ${SVR_PROFILES.map((p) => `
                  <button type="button" class="btn small ghost" data-svr-profile="${p.id}" style="margin:0.25rem">${p.label}</button>
                `).join("")}
              </div>
            </div>

            <!-- Ehri's 4 Phases -->
            <h4 class="sor-section-header">Linnea Ehri's 4 Phases of Word Reading Development</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:1rem">
              ${EHRI_PHASES.map((ph) => `
                <div style="background:#ffffff;border:1.5px solid #cbd5e1;border-radius:10px;padding:1.25rem">
                  <span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:0.75rem;font-weight:800;padding:0.25rem 0.5rem;border-radius:4px;margin-bottom:0.5rem">${esc(ph.phase)}</span>
                  <h5 style="margin:0 0 0.25rem;font-size:1rem;font-weight:800">${esc(ph.focus)}</h5>
                  <p style="font-size:0.8125rem;color:#475569;margin:0 0 0.5rem;line-height:1.4">${esc(ph.characteristics)}</p>
                  <div style="font-size:0.75rem;background:#f8fafc;padding:0.5rem;border-radius:6px;color:#0f766e"><strong>Targeted Instruction:</strong> ${esc(ph.instruction)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- 3. Sound Wall & Vowel Valley Tab -->
        ${currentTab === "soundwall" ? `
          <div class="sor-panel-section">
            <div class="sor-soundwall-intro">
              <h3>Speech-to-Print Sound Wall: Consonants &amp; Vowel Valley</h3>
              <p>Unlike traditional A-Z word walls that organize by print letter, a Sound Wall organizes phonemes by speech articulation: how the mouth, tongue, vocal cords, and breath create each sound.</p>
            </div>

            <h4 class="sor-section-header">Vowel Valley (Organized from Closed Smile → Open Jaw → Rounded Pursed)</h4>
            <div class="sor-vowel-valley-grid">
              ${VOWEL_VALLEY.map((v) => `
                <div class="vowel-card">
                  <span class="phoneme-symbol">${esc(v.phoneme)}</span>
                  ${renderMouthShapeSvg(v.shape)}
                  <strong class="vowel-keyword">${esc(v.example)}</strong>
                  <span class="vowel-position">${esc(v.mouth)}</span>
                  <button type="button" class="sor-audio-btn" data-say="${esc(v.example)}">🔊 Hear</button>
                </div>
              `).join("")}
            </div>

            <h4 class="sor-section-header" style="margin-top:2.5rem">Consonant Articulation Matrix (Voiced vs. Unvoiced Pairs)</h4>
            <div class="sor-consonants-grid">
              ${CONSONANT_CATEGORIES.map((cat) => `
                <div class="consonant-manner-card">
                  <h5>${esc(cat.manner)}</h5>
                  <p>${esc(cat.desc)}</p>
                  <div class="consonant-pairs-list">
                    ${cat.pairs.map((p) => `
                      <div class="consonant-row">
                        <span class="consonant-badge badge-unvoiced">${esc(p.unvoiced)}</span>
                        <span style="color:#94a3b8;font-size:0.75rem">vs</span>
                        <span class="consonant-badge badge-voiced">${esc(p.voiced)}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- 4. Orthographic Mapping & Heart Words Tab -->
        ${currentTab === "mapping" ? `
          <div class="sor-panel-section">
            <div class="sor-rope-banner">
              <h3>Orthographic Mapping &amp; Heart Word Studio</h3>
              <p>Orthographic mapping (Kilpatrick, 2015) is the mental process our brains use to turn unfamiliar words into instantly recognized sight words by bonding phonemes (sounds) to graphemes (letters).</p>
            </div>

            <div class="sor-mapping-controls">
              <span style="font-weight:700;font-size:0.875rem">Select Word:</span>
              ${Object.keys(MAPPING_WORDS).map((k) => `
                <button type="button" class="word-picker-btn ${k === state.mappedWord ? "active" : ""} ${MAPPING_WORDS[k].hearts.length ? "is-heart" : ""}" data-sor-map-word="${k}">
                  ${k} ${MAPPING_WORDS[k].hearts.length ? "❤️" : ""}
                </button>
              `).join("")}
            </div>

            <div class="sor-mapping-workbench">
              <div class="workbench-word-hero">${esc(mappedObj.word.toUpperCase())}</div>
              <div class="workbench-instruction">
                Word has <strong>${mappedObj.sounds.length} phonemes</strong> (sounds) mapped across <strong>${mappedObj.letters.length} grapheme units</strong>.
              </div>

              <!-- Elkonin Sound Boxes -->
              <div class="elkonin-boxes-container">
                ${mappedObj.sounds.map((snd, idx) => {
                  const isHeart = mappedObj.hearts.includes(idx);
                  const letter = mappedObj.letters[idx];
                  return `
                    <div class="elkonin-box-unit">
                      <div class="sound-chip" title="Tap sound" data-say="${esc(mappedObj.word)}">
                        <span>●</span>
                      </div>
                      <div class="elkonin-box ${isHeart ? "has-heart" : ""}">
                        ${isHeart ? `<span class="heart-marker" title="Learn this part by heart!">❤️</span>` : ""}
                        <span class="grapheme-letter">${esc(letter)}</span>
                        <span class="phoneme-tag">${esc(snd)}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>

              ${mappedObj.heartNote ? `
                <div class="heart-explanation">
                  💡 <strong>Orthographic Mapping Insight:</strong> ${esc(mappedObj.heartNote)}
                </div>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <!-- 5. 6 Syllable Types & Division Chopper Tab -->
        ${currentTab === "syllables" ? `
          <div class="sor-panel-section">
            <div class="sor-rope-banner">
              <h3>The 6 Syllable Types (CLOVER) &amp; Division Chopper</h3>
              <p>Recognizing syllable patterns unlocks multisyllabic decoding for upper elementary and secondary students. Every English syllable has exactly one vowel sound.</p>
            </div>

            <div class="sor-syllables-grid">
              ${SYLLABLE_TYPES.map((syl) => `
                <div class="syllable-card">
                  <div class="syllable-card-header">
                    <h4>${esc(syl.name)}</h4>
                    <span class="syllable-type-badge">${esc(syl.code)}</span>
                  </div>
                  <p class="syllable-rule">${esc(syl.rule)}</p>
                  <div class="syllable-examples-row">
                    ${syl.examples.map((ex) => `<span class="syllable-chip">${esc(ex)}</span>`).join("")}
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Syllable Division Chopper Game -->
            <div class="sor-chopper-box">
              <h4 style="margin:0 0 0.5rem;font-size:1.25rem;font-family:'Fraunces',Georgia,serif;color:#854d0e">Syllable Division Chopper</h4>
              <p style="margin:0 0 1rem;font-size:0.9375rem;color:#713f12">
                Click the scissors ✂️ where the word should be divided into syllables.
              </p>

              <div class="chopper-word-display">
                ${currentChop.word.split("").map((letter, idx) => `
                  <span class="chop-letter-block">${esc(letter)}</span>
                  ${idx < currentChop.word.length - 1 ? `
                    <button type="button" class="chop-cut-button" data-chop-cut="${idx + 1}" title="Cut here">✂️</button>
                  ` : ""}
                `).join("")}
              </div>

              <div class="chopper-feedback" id="chopFeedback">
                ${state.chopperResult === "correct" ? `
                  <span style="color:#065f46">✅ Perfect cut! <strong>${esc(currentChop.parts.join(" · "))}</strong>. Rule: ${esc(currentChop.rule)} (${esc(currentChop.explain)})</span>
                ` : state.chopperResult === "wrong" ? `
                  <span style="color:#b91c1c">❌ Try again! Hint: Look at the vowels and consonants between them.</span>
                ` : `
                  <span style="color:#854d0e">Where should you cut <strong>${esc(currentChop.word)}</strong>?</span>
                `}
              </div>

              <div style="margin-top:1.25rem">
                <button type="button" class="btn small" id="nextChopWord" style="background:#d97706;color:#ffffff;border:none">Next Word ➔</button>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 6. Morphology & Multilingual Cognate Matrix Tab -->
        ${currentTab === "morphology" ? `
          <div class="sor-panel-section">
            <div class="sor-rope-banner">
              <h3>Morphology &amp; Multilingual Cognate Matrix</h3>
              <p>Morphemes are the smallest units of meaning. Because over 60% of academic English words come from Greek and Latin roots, morphology is the greatest bridge for multilingual learners connecting Spanish cognates to academic English.</p>
            </div>

            <div class="sor-morphology-studio">
              <div class="morph-generator-grid">
                <div class="morph-column">
                  <h5>Prefixes</h5>
                  ${MORPH_PREFIXES.map((p, idx) => `
                    <button type="button" class="morph-item-btn ${idx === state.morphPrefix ? "active" : ""}" data-morph-p="${idx}">
                      <strong>${esc(p.aff)}</strong>
                      <small>${esc(p.meaning)}</small>
                    </button>
                  `).join("")}
                </div>

                <div class="morph-column">
                  <h5>Base Roots (Latin / Greek)</h5>
                  ${MORPH_ROOTS.map((r, idx) => `
                    <button type="button" class="morph-item-btn ${idx === state.morphRoot ? "active" : ""}" data-morph-r="${idx}">
                      <strong>${esc(r.root)}</strong> (${esc(r.origin)})
                      <small>Meaning: ${esc(r.meaning)}</small>
                    </button>
                  `).join("")}
                </div>

                <div class="morph-column">
                  <h5>Suffixes</h5>
                  ${MORPH_SUFFIXES.map((s, idx) => `
                    <button type="button" class="morph-item-btn ${idx === state.morphSuffix ? "active" : ""}" data-morph-s="${idx}">
                      <strong>${esc(s.aff)}</strong>
                      <small>${esc(s.meaning)} (${esc(s.pos)})</small>
                    </button>
                  `).join("")}
                </div>
              </div>

              <div class="morph-result-banner">
                <div class="morph-constructed-word">${esc(constructedWord)}</div>
                <div class="morph-constructed-def">
                  <strong>Definition:</strong> The ${esc(suffixObj.meaning)} ${esc(prefixObj.meaning)} ${esc(rootObj.meaning)}.
                </div>
                <div class="morph-cognate-bridge">
                  🌎 <strong>Spanish Cognate Bridge:</strong> <em>${esc(rootObj.cognate)}</em>
                </div>
              </div>
            </div>
          </div>
        ` : ""}

      </div>
    </div>
  `;

  return {
    title: "Science of Reading Studio",
    html: htmlContent,
  };
}

export function mount(root, ctx) {
  if (!root) return;

  // Tab switching
  root.querySelectorAll("[data-sor-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.sorTab;
      ctx.rerender();
    });
  });

  // Reading Rope slider
  const slider = root.querySelector("#ropeBraider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      state.braidTightness = Number(e.target.value);
      const svgWrap = root.querySelector(".sor-rope-svg-wrap");
      if (svgWrap) svgWrap.innerHTML = renderRopeSvg(state.braidTightness);
      const label = root.querySelector("#braidStatusLabel");
      if (label) {
        label.textContent = state.braidTightness < 35
          ? "Novice / Early Reader (Isolated Strands)"
          : state.braidTightness < 70
            ? "Developing Reader (Strands Braiding)"
            : "Skilled Fluent Reader (Integrated Automaticity)";
      }
    });
  }

  // SVR Sliders
  const inputD = root.querySelector("#inputD");
  const inputLC = root.querySelector("#inputLC");
  const updateSvr = () => {
    state.svrD = Number(inputD?.value || 75);
    state.svrLC = Number(inputLC?.value || 80);
    const prod = Math.round((state.svrD / 100) * (state.svrLC / 100) * 100);
    const valD = root.querySelector("#valD");
    const valLC = root.querySelector("#valLC");
    const valRC = root.querySelector("#valRC");
    if (valD) valD.textContent = `${state.svrD}%`;
    if (valLC) valLC.textContent = `${state.svrLC}%`;
    if (valRC) valRC.textContent = `${prod}%`;
  };
  inputD?.addEventListener("input", updateSvr);
  inputLC?.addEventListener("input", updateSvr);

  // SVR Profiles
  root.querySelectorAll("[data-svr-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prof = SVR_PROFILES.find((p) => p.id === btn.dataset.svrProfile);
      if (prof && inputD && inputLC) {
        inputD.value = prof.d;
        inputLC.value = prof.lc;
        updateSvr();
      }
    });
  });

  // Orthographic Mapping Word Picker
  root.querySelectorAll("[data-sor-map-word]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mappedWord = btn.dataset.sorMapWord;
      ctx.rerender();
    });
  });

  // Syllable Chopper Click Cut
  root.querySelectorAll("[data-chop-cut]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cutIdx = Number(btn.dataset.chopCut);
      const currentChop = CHOPPER_WORDS[state.chopperIdx];
      state.chopperGuess = cutIdx;
      state.chopperResult = cutIdx === currentChop.splitIndex ? "correct" : "wrong";
      ctx.rerender();
    });
  });

  // Syllable Next Word
  const nextChopBtn = root.querySelector("#nextChopWord");
  if (nextChopBtn) {
    nextChopBtn.addEventListener("click", () => {
      state.chopperIdx = (state.chopperIdx + 1) % CHOPPER_WORDS.length;
      state.chopperGuess = null;
      state.chopperResult = null;
      ctx.rerender();
    });
  }

  // Morphology Buttons
  root.querySelectorAll("[data-morph-p]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.morphPrefix = Number(btn.dataset.morphP);
      ctx.rerender();
    });
  });
  root.querySelectorAll("[data-morph-r]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.morphRoot = Number(btn.dataset.morphR);
      ctx.rerender();
    });
  });
  root.querySelectorAll("[data-morph-s]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.morphSuffix = Number(btn.dataset.morphS);
      ctx.rerender();
    });
  });
}
