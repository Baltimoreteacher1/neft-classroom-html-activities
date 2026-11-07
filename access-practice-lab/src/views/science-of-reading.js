// Science of Reading (SoR) Interactive Research & Practice Studio
// Grounded in:
//   - Scarborough's Reading Rope (2001)
//   - The Simple View of Reading (Gough & Tunmer, 1986; Hoover & Tunmer, 2020)
//   - Linnea Ehri's 4 Phases of Word Reading Development
//   - Speech-to-Print Sound Walls (Moats, 2020) & Orthographic Mapping (Kilpatrick, 2015)
//   - CLOVER 6 Syllable Types & Syllable Division Rules
//   - Morphology & Multilingual Cognate Bridges for English Learners

import { BASE, esc, icon as rawIcon, raw } from "../util.js";

const icon = (name) => {
  const marked = rawIcon(name);
  return marked[Object.getOwnPropertySymbols(marked)[0]];
};

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
    desc: "Specific decoding weakness paired with average or high oral language comprehension. Needs explicit, systematic phonics & orthographic mapping.",
  },
  {
    id: "hyperlexia",
    label: "Hyperlexic Profile",
    d: 90,
    lc: 25,
    desc: "Accurate, rapid word recognition paired with significant deficits in oral language comprehension, vocabulary, and linguistic inference.",
  },
  {
    id: "mixed",
    label: "Mixed Reading Difficulty",
    d: 30,
    lc: 35,
    desc: "Both decoding and language comprehension are depressed. Needs simultaneous, dual-track intervention across foundational phonics and rich oral language.",
  },
];

export const EHRI_PHASES = [
  {
    phase: "1. Pre-Alphabetic",
    focus: "Visual & Environmental Cues",
    characteristics: "Reads signs or logos based on visual context (e.g., recognizing logos) with no letter-sound connection.",
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

// --- 2. Scarborough's Reading Rope Strands ---
export const ROPE_STRANDS = {
  upper: {
    title: "Language Comprehension",
    subtitle: "Increasingly Strategic over time",
    strands: [
      {
        name: "Background Knowledge",
        desc: "Schema, concepts, factual foundations, and life experiences that make new texts comprehensible.",
        examples: "Explicit pre-teaching, concept maps, virtual field trips, culturally responsive texts.",
      },
      {
        name: "Vocabulary",
        desc: "Breadth, depth, and precision of lexical understanding, including academic Tier 2/3 words.",
        examples: "Semantic word webs, student-friendly definitions, morphological root study.",
      },
      {
        name: "Language Structures",
        desc: "Syntax (sentence grammar, clause order) and semantics (how word arrangements produce meaning).",
        examples: "Sentence anagrams, subordinating conjunction ladders, passive-to-active transformations.",
      },
      {
        name: "Verbal Reasoning",
        desc: "Inferencing, metaphor, figurative idioms, and distinguishing literal vs. non-literal meaning.",
        examples: "Think-aloud inference modeling, idiom bridge cards, evidence-reasoning stems.",
      },
      {
        name: "Literacy Knowledge",
        desc: "Print concepts, textual discourse structures, genre expectations, and bibliographic awareness.",
        examples: "Text structure analysis (problem/solution, cause/effect, chronological recount).",
      },
    ],
  },
  lower: {
    title: "Word Recognition",
    subtitle: "Increasingly Automatic over time",
    strands: [
      {
        name: "Phonological Awareness",
        desc: "Metalinguistic sensitivity to speech sounds: syllables, onsets/rimes, and individual phonemes.",
        examples: "Oral phoneme segmentation, sound deletion & substitution drills, Elkonin chip sliding.",
      },
      {
        name: "Decoding",
        desc: "The alphabetic principle: translating printed graphemes into speech sounds and blending them.",
        examples: "Systematic, explicit synthetic phonics scope and sequence, blending routines.",
      },
      {
        name: "Sight Recognition",
        desc: "Instant, effortless recognition of familiar words via orthographic mapping (not visual memory).",
        examples: "Orthographic mapping routines, phoneme-grapheme mapping, Heart Word strategies.",
      },
    ],
  },
};

// --- 3. Vowel Valley & Sound Wall Data ---
export const VOWEL_VALLEY = [
  { phoneme: "/ē/", example: "see", mouth: "Front · High · Smile", shape: "smile" },
  { phoneme: "/ĭ/", example: "sit", mouth: "Front · Mid-High · Slight Smile", shape: "smile" },
  { phoneme: "/ā/", example: "make", mouth: "Front · Mid · Relaxed", shape: "smile" },
  { phoneme: "/ĕ/", example: "bed", mouth: "Front · Mid-Low · Dropped", shape: "open" },
  { phoneme: "/ă/", example: "cat", mouth: "Front · Low · Open", shape: "open" },
  { phoneme: "/ī/", example: "ice", mouth: "Gliding Diphthong · Low to High", shape: "open" },
  { phoneme: "/ŏ/", example: "pot", mouth: "Bottom of Valley · Widest Open", shape: "open-wide" },
  { phoneme: "/ŭ/", example: "cup", mouth: "Center · Relaxed Jaw / Schwa", shape: "open" },
  { phoneme: "/aw/", example: "saw", mouth: "Back · Low · Oval Round", shape: "round" },
  { phoneme: "/ō/", example: "boat", mouth: "Back · Mid · Round", shape: "round" },
  { phoneme: "/oo/", example: "book", mouth: "Back · Mid-High · Tight Round", shape: "tight-round" },
  { phoneme: "/ū/", example: "moon", mouth: "Back · High · Pursed Lips", shape: "pursed" },
  { phoneme: "/yū/", example: "music", mouth: "Diphthong · Palatal to High Back", shape: "pursed" },
];

export const CONSONANT_CATEGORIES = [
  {
    manner: "Stops (Plosives)",
    desc: "Airflow is completely blocked and then released with a puff of sound.",
    pairs: [
      { unvoiced: "/p/ (unvoiced)", voiced: "/b/ (voiced)" },
      { unvoiced: "/t/ (unvoiced)", voiced: "/d/ (voiced)" },
      { unvoiced: "/k/ (unvoiced)", voiced: "/g/ (voiced)" },
    ],
  },
  {
    manner: "Nasals",
    desc: "Air passes continuously through the nose; mouth is closed. (All voiced)",
    pairs: [
      { unvoiced: "/m/ (bilabial)", voiced: "map, drum" },
      { unvoiced: "/n/ (alveolar)", voiced: "nest, pen" },
      { unvoiced: "/ng/ (velar)", voiced: "sing, ring" },
    ],
  },
  {
    manner: "Fricatives",
    desc: "Air is forced through a narrow constriction, creating friction/hiss.",
    pairs: [
      { unvoiced: "/f/ (fan)", voiced: "/v/ (van)" },
      { unvoiced: "/th/ unvoiced (thumb)", voiced: "/th/ voiced (feather)" },
      { unvoiced: "/s/ (sun)", voiced: "/z/ (zebra)" },
      { unvoiced: "/sh/ (ship)", voiced: "/zh/ (measure)" },
      { unvoiced: "/h/ (hat - unvoiced only)", voiced: "glottal whisper" },
    ],
  },
  {
    manner: "Affricates",
    desc: "A stop immediately followed by a fricative.",
    pairs: [
      { unvoiced: "/ch/ (chin - unvoiced)", voiced: "/j/ (jump - voiced)" },
    ],
  },
  {
    manner: "Glides & Liquids",
    desc: "Vowel-like airflow through oral cavity. (All voiced)",
    pairs: [
      { unvoiced: "/w/ (wind)", voiced: "/wh/ (whisper)" },
      { unvoiced: "/y/ (yellow)", voiced: "palatal glide" },
      { unvoiced: "/l/ (liquid - lip)", voiced: "/r/ (liquid - red)" },
    ],
  },
];

// --- 4. Orthographic Mapping / Heart Words Database ---
export const MAPPING_WORDS = {
  said: {
    word: "said",
    sounds: ["/s/", "/ĕ/", "/d/"],
    letters: ["s", "ai", "d"],
    hearts: [1],
    heartNote: "The 'ai' represents the short /ĕ/ sound instead of the regular /ā/ sound. Learn 'ai' = /ĕ/ by heart!",
  },
  from: {
    word: "from",
    sounds: ["/f/", "/r/", "/ŭ/", "/m/"],
    letters: ["f", "r", "o", "m"],
    hearts: [2],
    heartNote: "The vowel 'o' spells the short /ŭ/ sound (schwa-like) instead of short /ŏ/.",
  },
  they: {
    word: "they",
    sounds: ["/th/", "/ā/"],
    letters: ["th", "ey"],
    hearts: [1],
    heartNote: "The digraph 'ey' spells the long /ā/ sound (like in 'hey' and 'obey').",
  },
  what: {
    word: "what",
    sounds: ["/w/", "/ŭ/", "/t/"],
    letters: ["wh", "a", "t"],
    hearts: [1],
    heartNote: "The letter 'a' makes the short /ŭ/ (schwa) sound.",
  },
  where: {
    word: "where",
    sounds: ["/w/", "/air/"],
    letters: ["wh", "ere"],
    hearts: [1],
    heartNote: "The 'ere' makes the /air/ r-controlled sound.",
  },
  could: {
    word: "could",
    sounds: ["/k/", "/oo/", "/d/"],
    letters: ["c", "oul", "d"],
    hearts: [1],
    heartNote: "The trigraph 'oul' represents the short /oo/ sound with a silent 'l'.",
  },
  because: {
    word: "because",
    sounds: ["/b/", "/ē/", "/k/", "/aw/", "/z/"],
    letters: ["b", "e", "c", "au", "se"],
    hearts: [4],
    heartNote: "The 'se' makes the voiced /z/ sound at the end of the word.",
  },
  friend: {
    word: "friend",
    sounds: ["/f/", "/r/", "/ĕ/", "/n/", "/d/"],
    letters: ["f", "r", "ie", "n", "d"],
    hearts: [2],
    heartNote: "The 'ie' vowel team makes the short /ĕ/ sound rather than long /ē/ or /ī/.",
  },
  heart: {
    word: "heart",
    sounds: ["/h/", "/ar/", "/t/"],
    letters: ["h", "ear", "t"],
    hearts: [1],
    heartNote: "The 'ear' team makes the /ar/ sound instead of the common /eer/ or /er/.",
  },
  people: {
    word: "people",
    sounds: ["/p/", "/ē/", "/p/", "/l/"],
    letters: ["p", "eo", "p", "le"],
    hearts: [1],
    heartNote: "The digraph 'eo' makes the long /ē/ sound.",
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

// --- 5. The 6 Syllable Types & Syllable Division Chopper ---
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

// --- 6. Morphology Matrix Data with Spanish Cognates ---
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

export const WORD_PART_CHALLENGE = [
  { word: "transport", parts: "trans- + port", question: "What does transport most nearly mean?", choices: ["carry across", "carry out", "able to be carried", "carry into"], answer: 0, feedback: "trans- means across, and port means carry. Transport is to carry something across or from one place to another." },
  { word: "import", parts: "im- + port", question: "If port means carry, what does import mean?", choices: ["carry out", "carry into", "carry across", "carry again"], answer: 1, feedback: "im- can mean in or into. Import means to bring or carry goods into a place." },
  { word: "export", parts: "ex- + port", question: "Which meaning fits export?", choices: ["carry into", "carry across", "carry out", "able to be carried"], answer: 2, feedback: "ex- means out. Export means to send or carry goods out to another place." },
  { word: "portable", parts: "port + -able", question: "What does the suffix -able help portable mean?", choices: ["able to be carried", "carried out", "carry into", "carry across"], answer: 0, feedback: "-able means able to be. Portable means able to be carried." },
  { word: "transatlantic", parts: "trans- + Atlantic", question: "In transatlantic travel, what does trans- tell you?", choices: ["under the ocean", "across the Atlantic", "back to the Atlantic", "near the Atlantic"], answer: 1, feedback: "trans- means across. Transatlantic travel crosses the Atlantic Ocean." },
];

export const TEXT_CLUE_CHALLENGE = {
  "3-5": [
    { question: "What moves through a port?", choices: ["cargo", "vowels", "maps", "syllables"], answer: 0, feedback: "The passage says a port helps transport cargo from one place to another." },
    { question: "What does portable mean?", choices: ["able to be carried", "too large to move", "sent out of a country", "made of metal"], answer: 0, feedback: "The suffix -able means able to be. Portable means able to be carried." },
    { question: "Which word means to bring goods into a country?", choices: ["import", "export", "transport", "portable"], answer: 0, feedback: "The passage says businesses import goods when they bring products into a country." },
  ],
  "6-8": [
  { question: "What does a port help transport?", choices: ["cargo", "vowels", "maps", "passengers only"], answer: 0, feedback: "The passage says a port helps transport cargo from one place to another." },
  { question: "Why are some cargo containers portable?", choices: ["They can be carried between ships and trucks", "They are too large to move", "They stay at one port", "They contain maps"], answer: 0, feedback: "The text says portable containers move between ships and trucks. The suffix -able means able to be." },
  { question: "Which pair shows opposite directions?", choices: ["import and export", "ships and trucks", "cargo and containers", "place and country"], answer: 0, feedback: "The passage explains that import brings products into a country, while export sends them out." },
  ],
};

// In-memory view state
let state = {
  tab: "lesson",
  wordGameIndex: 0,
  wordGameCorrect: 0,
  wordGameChoice: null,
  activePractice: "words",
  textGameIndex: 0,
  textGameCorrect: 0,
  textGameChoice: null,
  braidTightness: 75,
  mappedWord: "said",
  chopperIdx: 0,
  chopperGuess: null,
  chopperResult: null,
  svrD: 75,
  svrLC: 80,
  svrActiveProfile: "typical",
};
let lastGradeBand = null;

// --- SVG Rendering for Scarborough's Rope ---
// Clean, professional layout where text labels NEVER overlap the Bezier ribbon curves!
function renderRopeSvg(tightness) {
  const factor = tightness / 100;
  // Curves weave across center and converge at the right
  const upperTargetY = 150 - factor * 8;
  const lowerTargetY = 170 + factor * 8;

  return `
    <svg viewBox="0 0 940 320" class="sor-rope-svg" role="img" aria-label="Scarborough's Reading Rope interactive diagram">
      <defs>
        <linearGradient id="gradLangRope" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="gradWordRope" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
        <linearGradient id="gradSkilledRope" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1d4ed8"/>
          <stop offset="50%" stop-color="#0f766e"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <filter id="sorShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
        </filter>
      </defs>

      <!-- Background Zone Identifiers -->
      <rect x="15" y="15" width="245" height="135" rx="10" fill="#f0f7ff" stroke="#dbeafe" stroke-width="1"/>
      <rect x="15" y="170" width="245" height="135" rx="10" fill="#f0fdf9" stroke="#ccfbf1" stroke-width="1"/>

      <!-- Section Headers -->
      <text x="25" y="32" font-size="11" font-weight="800" fill="#1e40af" letter-spacing="0.5">LANGUAGE COMPREHENSION</text>
      <text x="25" y="187" font-size="11" font-weight="800" fill="#065f46" letter-spacing="0.5">WORD RECOGNITION</text>

      <!-- Upper Strand Labels (x=25..250) -->
      <text x="25" y="52" font-size="10.5" font-weight="700" fill="#1e3a8a">1. Background Knowledge</text>
      <text x="25" y="74" font-size="10.5" font-weight="700" fill="#1e3a8a">2. Vocabulary Breadth</text>
      <text x="25" y="96" font-size="10.5" font-weight="700" fill="#1e3a8a">3. Language Structures</text>
      <text x="25" y="118" font-size="10.5" font-weight="700" fill="#1e3a8a">4. Verbal Reasoning</text>
      <text x="25" y="140" font-size="10.5" font-weight="700" fill="#1e3a8a">5. Literacy Knowledge</text>

      <!-- Lower Strand Labels (x=25..250) -->
      <text x="25" y="210" font-size="10.5" font-weight="700" fill="#064e3b">1. Phonological Awareness</text>
      <text x="25" y="240" font-size="10.5" font-weight="700" fill="#064e3b">2. Decoding &amp; Phonics</text>
      <text x="25" y="270" font-size="10.5" font-weight="700" fill="#064e3b">3. Sight Word Recognition</text>

      <!-- Upper Braids: Flow from x=260 to x=640 -->
      <g filter="url(#sorShadow)">
        <path d="M 260,48 C 380,${48 + factor * 45} 500,${95 + factor * 35} 640,${upperTargetY}" fill="none" stroke="#60a5fa" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,70 C 380,${70 + factor * 40} 500,${105 + factor * 30} 640,${upperTargetY + 3}" fill="none" stroke="#3b82f6" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,92 C 380,${92 + factor * 35} 500,${115 + factor * 25} 640,${upperTargetY + 6}" fill="none" stroke="#2563eb" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,114 C 380,${114 + factor * 30} 500,${125 + factor * 20} 640,${upperTargetY + 9}" fill="none" stroke="#1d4ed8" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,136 C 380,${136 + factor * 20} 500,${135 + factor * 12} 640,${upperTargetY + 12}" fill="none" stroke="#1e40af" stroke-width="${4.5 + factor * 2}" stroke-linecap="round"/>
      </g>

      <!-- Lower Braids: Flow from x=260 to x=640 -->
      <g filter="url(#sorShadow)">
        <path d="M 260,206 C 380,${206 - factor * 20} 500,${185 - factor * 12} 640,${lowerTargetY - 12}" fill="none" stroke="#34d399" stroke-width="${5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,236 C 380,${236 - factor * 35} 500,${195 - factor * 22} 640,${lowerTargetY - 6}" fill="none" stroke="#10b981" stroke-width="${5 + factor * 2}" stroke-linecap="round"/>
        <path d="M 260,266 C 380,${266 - factor * 45} 500,${205 - factor * 30} 640,${lowerTargetY}" fill="none" stroke="#059669" stroke-width="${5 + factor * 2}" stroke-linecap="round"/>
      </g>

      <!-- Convergence Zone: Skilled Reading (x=640 to x=910) -->
      <path d="M 640,160 C 720,160 760,160 880,160" fill="none" stroke="url(#gradSkilledRope)" stroke-width="${12 + factor * 14}" stroke-linecap="round" stroke-dasharray="${factor < 0.35 ? '8,6' : 'none'}"/>
      <circle cx="880" cy="160" r="${12 + factor * 4}" fill="#0f766e" filter="url(#sorShadow)"/>
      <circle cx="880" cy="160" r="${6 + factor * 2}" fill="#fde68a"/>

      <!-- Convergence Header Badge -->
      <rect x="670" y="80" width="240" height="48" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#sorShadow)"/>
      <text x="790" y="102" font-size="13" font-weight="900" fill="#0f766e" text-anchor="middle" font-family="'Fraunces', Georgia, serif" letter-spacing="0.5">SKILLED READING</text>
      <text x="790" y="118" font-size="9.5" font-weight="700" fill="#64748b" text-anchor="middle">Fluent Execution &amp; Comprehension</text>

      <text x="790" y="215" font-size="11" font-weight="700" fill="#1e293b" text-anchor="middle">
        ${factor > 0.7 ? "Integrated Automaticity (Effortless Flow)" : factor > 0.4 ? "Braiding in Progress (Developing Fluency)" : "Emergent Coordination (Isolated Strands)"}
      </text>
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
  const requestedBand = ctx.band || new URLSearchParams(globalThis.location?.search || "").get("grades");
  const gradeBand = requestedBand === "3-5" ? "3-5" : "6-8";
  if (lastGradeBand && lastGradeBand !== gradeBand) {
    state.wordGameIndex = state.textGameIndex = 0;
    state.wordGameCorrect = state.textGameCorrect = 0;
    state.wordGameChoice = state.textGameChoice = null;
  }
  lastGradeBand = gradeBand;
  const gradeLabel = gradeBand === "3-5" ? "Grades 3–5" : "Grades 6–8";
  const wordQuiz = gradeBand === "3-5" ? WORD_PART_CHALLENGE.slice(0, 4) : WORD_PART_CHALLENGE;
  const wordQuizTitle = gradeBand === "3-5" ? "Big-Word Breaker" : "Word-Part Detective";
  const lessonTitle = gradeBand === "3-5" ? "Break big words into meaningful parts" : "Use word parts to unlock academic meaning";
  const mappedObj = MAPPING_WORDS[state.mappedWord] || MAPPING_WORDS.said;
  const currentChop = CHOPPER_WORDS[state.chopperIdx];

  // SVR Calculated Product
  const svrProduct = Math.round((state.svrD / 100) * (state.svrLC / 100) * 100);
  const activeQuiz = state.activePractice === "words" ? wordQuiz : TEXT_CLUE_CHALLENGE[gradeBand];
  const activeQuizIndex = state.activePractice === "words" ? state.wordGameIndex : state.textGameIndex;
  const activeQuizChoice = state.activePractice === "words" ? state.wordGameChoice : state.textGameChoice;
  const activeQuizCorrect = state.activePractice === "words" ? state.wordGameCorrect : state.textGameCorrect;
  const activeQuestion = activeQuiz[activeQuizIndex];
  const activeIsCorrect = activeQuizChoice === activeQuestion?.answer;

  const htmlContent = `
    <div class="sor-container">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${BASE}/">The Language Page</a><span aria-hidden="true">›</span><span aria-current="page">Science of Reading Studio</span></nav>

      <div class="sor-header">
        <div class="sor-title-wrap">
          <div class="sor-kicker">${icon("reading")} ${gradeLabel} · Learn, practice, and teach</div>
          <h1>Science of Reading Studio</h1>
          <p class="sor-lead">
            Explicit word study, meaningful reading, and short practice games built around how reading works. Start with a ready-to-use lesson, then explore the tools behind it.
          </p>
        </div>
        <div class="sor-evidence-badge">
          ${icon("bulb")} <span>Teach it · Try it · Use it in text</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="sor-nav-tabs" role="tablist" aria-label="Science of Reading tools">
        <button type="button" role="tab" id="sor-tab-lesson" aria-controls="sor-panel" aria-selected="${currentTab === "lesson"}" tabindex="${currentTab === "lesson" ? 0 : -1}" class="sor-tab-btn ${currentTab === "lesson" ? "active" : ""}" data-sor-tab="lesson">${icon("sparkle")} <span>Lessons &amp; Games</span></button>
        <button type="button" role="tab" id="sor-tab-syllables" aria-controls="sor-panel" aria-selected="${currentTab === "syllables"}" tabindex="${currentTab === "syllables" ? 0 : -1}" class="sor-tab-btn ${currentTab === "syllables" ? "active" : ""}" data-sor-tab="syllables">${icon("construction")} <span>Syllable Lab</span></button>
        <button type="button" role="tab" id="sor-tab-mapping" aria-controls="sor-panel" aria-selected="${currentTab === "mapping"}" tabindex="${currentTab === "mapping" ? 0 : -1}" class="sor-tab-btn ${currentTab === "mapping" ? "active" : ""}" data-sor-tab="mapping">${icon("star")} <span>Sound-to-Print</span></button>
        <button type="button" role="tab" id="sor-tab-soundwall" aria-controls="sor-panel" aria-selected="${currentTab === "soundwall"}" tabindex="${currentTab === "soundwall" ? 0 : -1}" class="sor-tab-btn ${currentTab === "soundwall" ? "active" : ""}" data-sor-tab="soundwall">${icon("speaking")} <span>Sound Wall</span></button>
        <button type="button" role="tab" id="sor-tab-morphology" aria-controls="sor-panel" aria-selected="${currentTab === "morphology"}" tabindex="${currentTab === "morphology" ? 0 : -1}" class="sor-tab-btn ${currentTab === "morphology" ? "active" : ""}" data-sor-tab="morphology">${icon("words")} <span>Word Parts</span></button>
        <button type="button" role="tab" id="sor-tab-rope" aria-controls="sor-panel" aria-selected="${currentTab === "rope"}" tabindex="${currentTab === "rope" ? 0 : -1}" class="sor-tab-btn ${currentTab === "rope" ? "active" : ""}" data-sor-tab="rope">${icon("growth")} <span>Reading Rope</span></button>
        <button type="button" role="tab" id="sor-tab-svr" aria-controls="sor-panel" aria-selected="${currentTab === "svr"}" tabindex="${currentTab === "svr" ? 0 : -1}" class="sor-tab-btn ${currentTab === "svr" ? "active" : ""}" data-sor-tab="svr">${icon("evidence")} <span>Reading Equation</span></button>
      </div>

      <!-- Main Stage Body -->
      <div class="sor-stage-body" role="tabpanel" id="sor-panel" aria-labelledby="sor-tab-${currentTab}" tabindex="0">

        ${currentTab === "lesson" ? `
          <section class="sor-panel-section sor-lesson-panel" aria-labelledby="sor-lesson-title">
            <div class="sor-grade-switch" aria-label="Choose grade band">
              <span>Grade band</span>
              <a href="${BASE}/science-of-reading?grades=3-5" class="${gradeBand === "3-5" ? "active" : ""}" ${gradeBand === "3-5" ? 'aria-current="page"' : ""}>Grades 3–5</a>
              <a href="${BASE}/science-of-reading?grades=6-8" class="${gradeBand === "6-8" ? "active" : ""}" ${gradeBand === "6-8" ? 'aria-current="page"' : ""}>Grades 6–8</a>
            </div>
            <div class="sor-lesson-heading">
              <div><span class="sor-kicker">READY-TO-TEACH · 15 MINUTES · ${gradeLabel.toUpperCase()}</span><h2 id="sor-lesson-title">${lessonTitle}</h2>
                <p>Explicitly teach a useful word part, model how to read it, and apply it in a short informational passage.</p></div>
              <div class="sor-lesson-meta"><span>Focus: decoding + morphology</span><span>Connect the word, its parts, and its meaning in text</span></div>
            </div>
            <div class="sor-lesson-grid">
              <article class="sor-lesson-step"><span class="sor-step-number">1</span><div><h3>Connect · 2 minutes</h3>
                <p>Ask: “What travels through a port?” Invite students to connect <em>port</em> to <em>portable</em> or <em>transport</em>.</p>
                <div class="sor-teacher-move"><strong>Say:</strong> “A port is a place where goods are carried from one kind of transportation to another.”</div></div></article>
              <article class="sor-lesson-step"><span class="sor-step-number">2</span><div><h3>Model · 4 minutes</h3>
                <p>Write <strong>transport</strong>. Read the parts: <strong>trans-</strong> (across) + <strong>port</strong> (carry). Blend the parts, read the whole word, then explain how the parts help.</p>
                <div class="sor-word-build"><span>trans-</span><b>+</b><span>port</span><b>→</b><strong>transport</strong></div>
                <p class="sor-teacher-note">Use the routine: see the parts → say the parts → blend the whole word → connect its parts to meaning.</p></div></article>
              <article class="sor-lesson-step"><span class="sor-step-number">3</span><div><h3>Read together · 5 minutes</h3>
                <p class="sor-passage">Ports connect ships, trucks, and trains. Businesses <strong>import</strong> goods when they bring products into a country. They <strong>export</strong> goods when they send products out. A port helps <strong>transport</strong> cargo from one place to another. Some cargo travels in <strong>portable</strong> containers that move between ships and trucks.</p>
                <div class="sor-word-clues"><span><b>im-</b> = into</span><span><b>ex-</b> = out</span><span><b>trans-</b> = across</span><span><b>-able</b> = able to be</span></div>
                <p class="sor-teacher-note">Read once for meaning. Reread and pause at punctuation. Students echo-read a sentence, then explain a bold word using its parts.</p></div></article>
              <article class="sor-lesson-step"><span class="sor-step-number">4</span><div><h3>Explain · 4 minutes</h3>
                <p>How do <em>import</em> and <em>export</em> describe opposite directions? Point to a sentence clue before answering.</p>
                <div class="sor-sentence-frame"><strong>Talk or write:</strong> “I know ___ means ___ because the word part ___ means ___.”</div></div></article>
            </div>

            <div class="sor-practice-zone" aria-labelledby="sor-game-title">
              <div class="sor-practice-top"><div><span class="sor-kicker">PRACTICE ARCADE · NO LOGIN</span><h2 id="sor-game-title">Play, get feedback, and try again</h2>
                <p>Choose a quick practice game. Your work stays in this browser tab.</p></div>
                <button type="button" class="sor-secondary-button" id="resetPracticeGame">Start this game over</button></div>
              <div class="sor-game-modes" role="group" aria-label="Choose a practice activity">
                <button type="button" class="${state.activePractice === "words" ? "active" : ""}" data-sor-practice="words" aria-pressed="${state.activePractice === "words"}">${icon("words")} ${wordQuizTitle}<small>Decode and build words</small></button>
                <button type="button" class="${state.activePractice === "text" ? "active" : ""}" data-sor-practice="text" aria-pressed="${state.activePractice === "text"}">${icon("reading")} Text-Clue Challenge<small>Find evidence and explain</small></button>
              </div>
              ${activeQuizIndex >= activeQuiz.length ? `
                <div class="sor-game-complete" role="status"><span class="sor-complete-mark">${icon("check")}</span><div><h3>Round complete</h3><p>You answered <strong>${activeQuizCorrect} of ${activeQuiz.length}</strong> correctly on the first try. Switch games or replay to build accuracy.</p></div></div>
              ` : `
                <div class="sor-game-card">
                  <div class="sor-game-progress"><span>Question ${activeQuizIndex + 1} of ${activeQuiz.length}</span><span>${activeQuizCorrect} correct first try</span></div>
                  <div class="sor-progress-track" role="progressbar" aria-label="Activity progress" aria-valuemin="0" aria-valuemax="${activeQuiz.length}" aria-valuenow="${activeQuizIndex}"><span style="width:${activeQuizIndex / activeQuiz.length * 100}%"></span></div>
                  ${state.activePractice === "words" ? `<div class="sor-game-wordline"><strong>${esc(activeQuestion.word)}</strong><span>${esc(activeQuestion.parts)}</span></div>` : `<div class="sor-game-wordline"><strong>Read · Think · Prove</strong><span>Use the passage above</span></div>`}
                  <h3 class="sor-game-question">${esc(activeQuestion.question)}</h3>
                  <div class="sor-answer-grid">${activeQuestion.choices.map((choice, index) => `<button type="button" class="sor-answer ${activeQuizChoice === index ? (activeIsCorrect ? "is-correct" : "is-wrong") : ""} ${activeQuizChoice !== null && index === activeQuestion.answer ? "show-correct" : ""}" data-practice-answer="${index}" ${activeQuizChoice !== null ? "disabled" : ""}>${esc(choice)}</button>`).join("")}</div>
                  ${activeQuizChoice !== null ? `<div class="sor-answer-feedback ${activeIsCorrect ? "positive" : "coaching"}" role="status"><strong>${activeIsCorrect ? "That fits." : "Let’s look at the clue."}</strong> ${esc(activeQuestion.feedback)}<button type="button" class="sor-primary-button" id="nextPracticeQuestion">${activeQuizIndex === activeQuiz.length - 1 ? "See results" : "Next question"} ${icon("arrow-right")}</button></div>` : `<p class="sor-game-hint">${state.activePractice === "words" ? `Hint: Start with <strong>${esc(activeQuestion.parts.split(" + ").slice(-1)[0])}</strong>, then use the prefix or suffix.` : "Hint: Reread the passage and point to the sentence that supports your answer."}</p>`}
                </div>
              `}
              <p class="sor-privacy-note">No student name, recording, or response is collected or sent.</p>
            </div>
            <div class="sor-activity-library" aria-labelledby="sor-more-activities">
              <div class="sor-section-banner"><h3 id="sor-more-activities">More Science of Reading activities</h3><p>Practice the same skills in a different way. Each activity has a clear model, try-it turn, and feedback.</p></div>
              <div class="sor-activity-cards">
                <button type="button" data-sor-tab="syllables"><span class="sor-activity-icon">${icon("construction")}</span><strong>Syllable Chopper</strong><small>Divide longer words. Test a cut and see the syllable rule.</small><span>Open Syllable Lab →</span></button>
                <button type="button" data-sor-tab="mapping"><span class="sor-activity-icon">${icon("star")}</span><strong>Sound-to-Print Mapper</strong><small>Match phonemes to graphemes and notice the heart part.</small><span>Open mapping →</span></button>
                <button type="button" data-sor-tab="soundwall"><span class="sor-activity-icon">${icon("speaking")}</span><strong>Sound Wall Explorer</strong><small>Compare mouth positions and hear example words.</small><span>Open Sound Wall →</span></button>
                <button type="button" data-sor-tab="rope"><span class="sor-activity-icon">${icon("growth")}</span><strong>Reading Rope Model</strong><small>Adjust strands and see how word reading and language work together.</small><span>Open Reading Rope →</span></button>
              </div>
            </div>
          </section>
        ` : ""}
        
        <!-- 1. Reading Rope Tab -->
        ${currentTab === "rope" ? `
          <div class="sor-panel-section">
            <div class="sor-section-banner">
              <h3>Dr. Hollis Scarborough’s Reading Rope (2001)</h3>
              <p>Reading comprehension is not a single isolated skill; it is a complex woven tapestry of Language Comprehension and Word Recognition. Interact with the braiding slider below to observe how individual strands integrate into automatic, fluent reading.</p>
            </div>

            <!-- Interactive Braiding Slider -->
            <div class="sor-braid-control">
              <div class="sor-braid-header">
                <span>Rope Braiding &amp; Reader Fluency Stage:</span>
                <strong id="braidStatusLabel">${state.braidTightness < 35 ? "Novice / Early Reader (Isolated Strands)" : state.braidTightness < 70 ? "Developing Reader (Strands Braiding)" : "Skilled Fluent Reader (Integrated Automaticity)"}</strong>
              </div>
              <input type="range" class="sor-braid-slider" id="ropeBraider" min="10" max="100" value="${state.braidTightness}" aria-label="Rope braiding tightness"/>
              <div class="sor-braid-labels">
                <span>Early Emergent (Phonemic &amp; Print Concepts)</span>
                <span>Transitional (Syntactic &amp; Morphological Braiding)</span>
                <span>Skilled Automatic (Fluent Comprehension)</span>
              </div>
            </div>

            <div class="sor-rope-svg-wrap">
              ${renderRopeSvg(state.braidTightness)}
            </div>

            <div class="sor-strands-comparison-grid">
              <div class="sor-strand-column lang-comp">
                <h4>${icon("reading")} ${ROPE_STRANDS.upper.title}</h4>
                <div class="sor-strand-subtitle">${ROPE_STRANDS.upper.subtitle}</div>
                <div class="sor-strand-cards">
                  ${ROPE_STRANDS.upper.strands.map((s) => `
                    <div class="strand-card">
                      <strong>${esc(s.name)}</strong>
                      <p>${esc(s.desc)}</p>
                      <small>${icon("bulb")} Classroom Action: ${esc(s.examples)}</small>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div class="sor-strand-column word-rec">
                <h4>${icon("words")} ${ROPE_STRANDS.lower.title}</h4>
                <div class="sor-strand-subtitle">${ROPE_STRANDS.lower.subtitle}</div>
                <div class="sor-strand-cards">
                  ${ROPE_STRANDS.lower.strands.map((s) => `
                    <div class="strand-card">
                      <strong>${esc(s.name)}</strong>
                      <p>${esc(s.desc)}</p>
                      <small>${icon("bulb")} Classroom Action: ${esc(s.examples)}</small>
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
            <div class="sor-section-banner">
              <h3>The Simple View of Reading (Gough &amp; Tunmer, 1986)</h3>
              <p>Reading Comprehension (RC) is the <em>mathematical product</em> of Decoding (D) and Language Comprehension (LC). Neither skill alone is sufficient. If either equals zero, reading comprehension is zero.</p>
            </div>

            <div class="svr-formula-hero">
              <div class="svr-formula-display">
                Reading Comprehension = <span>Decoding</span> × <span>Language Comprehension</span>
              </div>
              <p class="svr-formula-lead">
                RC = D × LC &nbsp;·&nbsp; A multiplication equation that explains every reader profile and intervention target.
              </p>
            </div>

            <!-- Archetype Profile Presets -->
            <div class="svr-profiles-section">
              <div class="svr-profiles-title">Select a Reader Archetype to Test the Formula:</div>
              <div class="svr-profiles-grid">
                ${SVR_PROFILES.map((p) => `
                  <button type="button" class="svr-profile-card ${p.id === state.svrActiveProfile ? "active" : ""}" data-svr-profile="${p.id}">
                    <span class="svr-profile-name">${esc(p.label)}</span>
                    <p class="svr-profile-desc">${esc(p.desc)}</p>
                    <div class="svr-profile-stats">
                      <span>D: ${p.d}%</span>
                      <span>LC: ${p.lc}%</span>
                    </div>
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- SVR Calculator Card -->
            <div class="svr-calc-card">
              <div class="svr-calc-grid">
                <div class="svr-input-group">
                  <label for="inputD">Decoding (D): <span id="valD">${state.svrD}%</span></label>
                  <input type="range" min="0" max="100" value="${state.svrD}" id="inputD" aria-label="Decoding percentage"/>
                  <small>Phonics, word identification, accuracy &amp; automaticity</small>
                </div>
                <div class="svr-math-op">×</div>
                <div class="svr-input-group">
                  <label for="inputLC">Language Comprehension (LC): <span id="valLC">${state.svrLC}%</span></label>
                  <input type="range" min="0" max="100" value="${state.svrLC}" id="inputLC" aria-label="Language comprehension percentage"/>
                  <small>Vocabulary, background knowledge, syntax &amp; inference</small>
                </div>
                <div class="svr-math-op">=</div>
                <div class="svr-result-box">
                  <span class="svr-result-label">Reading Comprehension (RC)</span>
                  <div class="svr-result-val" id="valRC">${svrProduct}%</div>
                  <span class="svr-result-status" id="valRCStatus">
                    ${svrProduct >= 70 ? "Proficient Comprehension" : svrProduct >= 40 ? "Developing / Fragile" : "Severe Comprehension Deficit"}
                  </span>
                </div>
              </div>
            </div>

            <!-- Ehri's 4 Phases Section -->
            <div class="sor-ehri-section">
              <h4 class="sor-section-header">Dr. Linnea Ehri’s 4 Phases of Word Reading Development</h4>
              <p class="sor-section-sub">How the human brain shifts from visual guessing to automatic sight-word recognition through orthographic mapping:</p>
              <div class="sor-ehri-grid">
                ${EHRI_PHASES.map((ph) => `
                  <div class="ehri-card">
                    <span class="ehri-phase-badge">${esc(ph.phase)}</span>
                    <h5 class="ehri-title">${esc(ph.focus)}</h5>
                    <p class="ehri-desc">${esc(ph.characteristics)}</p>
                    <div class="ehri-target"><strong>Targeted Instruction:</strong> ${esc(ph.instruction)}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 3. Sound Wall & Vowel Valley Tab -->
        ${currentTab === "soundwall" ? `
          <div class="sor-panel-section">
            <div class="sor-section-banner">
              <h3>Speech-to-Print Sound Wall &amp; Vowel Valley</h3>
              <p>Traditional A–Z word walls organize by spelling, confusing learners because 26 letters make 44 unique speech sounds. A Sound Wall organizes from the <em>mouth to print</em> based on articulatory gestures and phoneme placement.</p>
            </div>

            <div class="sor-section-banner" style="border:none;margin-bottom:1rem;padding:0">
              <h4 style="font-family:'Fraunces',Georgia,serif;font-size:1.25rem;color:var(--brand);margin:0 0 0.5rem">The Vowel Valley (Front Smile to Low Open to Back Round)</h4>
              <p style="font-size:0.9375rem;color:var(--ink-2)">Notice how the jaw drops as you move down the front of the valley, and lips round as you ascend the back:</p>
            </div>

            <div class="sor-vowel-valley-grid">
              ${VOWEL_VALLEY.map((v) => `
                <div class="vowel-card">
                  <span class="phoneme-symbol">${esc(v.phoneme)}</span>
                  ${renderMouthShapeSvg(v.shape)}
                  <strong class="vowel-keyword">${esc(v.example)}</strong>
                  <span class="vowel-position">${esc(v.mouth)}</span>
                  <button type="button" class="sor-audio-btn" data-say="${esc(v.example)}">${icon("volume")} Hear</button>
                </div>
              `).join("")}
            </div>

            <div class="sor-section-banner" style="border:none;margin:2rem 0 1rem;padding:0">
              <h4 style="font-family:'Fraunces',Georgia,serif;font-size:1.25rem;color:var(--brand);margin:0 0 0.5rem">Consonant Articulation Matrix (Manner &amp; Voicing Pairs)</h4>
              <p style="font-size:0.9375rem;color:var(--ink-2)">Touch your vocal cords to feel the vibration between unvoiced and voiced pairs:</p>
            </div>

            <div class="sor-consonants-grid">
              ${CONSONANT_CATEGORIES.map((cat) => `
                <div class="consonant-manner-card">
                  <h5>${esc(cat.manner)}</h5>
                  <p>${esc(cat.desc)}</p>
                  <div class="consonant-pairs-list">
                    ${cat.pairs.map((p) => `
                      <div class="consonant-row">
                        <span class="badge-unvoiced">${esc(p.unvoiced)}</span>
                        <span style="color:#94a3b8;font-size:0.75rem;font-weight:700">vs</span>
                        <span class="badge-voiced">${esc(p.voiced)}</span>
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
            <div class="sor-section-banner">
              <h3>Orthographic Mapping &amp; Heart Word Studio</h3>
              <p>Orthographic mapping (Kilpatrick, 2015) is the cognitive process by which our brains bond phonemes (sounds) to graphemes (letters), anchoring words permanently in visual memory for instant retrieval. Words with irregular letters are taught as <strong>Heart Words</strong>: learn the tricky part by heart!</p>
            </div>

            <div class="sor-mapping-controls">
              <span style="font-weight:700;font-size:0.9375rem;color:var(--ink)">Select Word:</span>
              ${Object.keys(MAPPING_WORDS).map((k) => `
                <button type="button" class="word-picker-btn ${k === state.mappedWord ? "active" : ""} ${MAPPING_WORDS[k].hearts.length ? "is-heart" : ""}" data-sor-map-word="${k}">
                  ${k} ${MAPPING_WORDS[k].hearts.length ? `${icon("star")}` : ""}
                </button>
              `).join("")}
            </div>

            <div class="sor-mapping-workbench">
              <div class="workbench-word-hero">${esc(mappedObj.word.toUpperCase())}</div>
              <div class="workbench-instruction">
                Word contains <strong>${mappedObj.sounds.length} phonemes</strong> mapped across <strong>${mappedObj.letters.length} grapheme units</strong>. Tap a sound chip to isolate each phoneme:
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
                        ${isHeart ? `<span class="heart-marker" title="Learn this part by heart!">${icon("star")}</span>` : ""}
                        <span class="grapheme-letter">${esc(letter)}</span>
                        <span class="phoneme-tag">${esc(snd)}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>

              ${mappedObj.heartNote ? `
                <div class="heart-explanation">
                  ${icon("bulb")} <span><strong>Orthographic Mapping Insight:</strong> ${esc(mappedObj.heartNote)}</span>
                </div>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <!-- 5. 6 Syllable Types & Division Chopper Tab -->
        ${currentTab === "syllables" ? `
          <div class="sor-panel-section">
            <div class="sor-section-banner">
              <h3>The 6 Syllable Types (CLOVER) &amp; Division Chopper</h3>
              <p>Recognizing syllable patterns enables automatic multisyllabic decoding. Every English syllable contains exactly one vowel sound. Use the mnemonic <strong>CLOVER</strong> to identify syllable structures:</p>
            </div>

            <div class="sor-syllables-grid">
              ${SYLLABLE_TYPES.map((s) => `
                <div class="syllable-card">
                  <div class="syllable-card-header">
                    <h4>${esc(s.name)}</h4>
                    <span class="syllable-type-badge">${esc(s.code)}</span>
                  </div>
                  <div class="syllable-rule">${esc(s.rule)}</div>
                  <div class="syllable-examples-row">
                    ${s.examples.map((ex) => `<span class="syllable-chip">${esc(ex)}</span>`).join("")}
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Syllable Division Chopper Interactive -->
            <div class="sor-chopper-box">
              <h4>Syllable Division Chopper Workbench</h4>
              <p style="margin:0 0 1rem;font-size:0.9375rem;color:#78350f">
                Identify the vowel-consonant structure and select the divider button where the word splits into syllables:
              </p>

              <div class="chopper-word-display">
                ${currentChop.word.split("").map((letter, idx) => `
                  <span class="chop-letter-block">${esc(letter)}</span>
                  ${idx < currentChop.word.length - 1 ? `
                    <button type="button" class="chop-cut-button" data-chop-cut="${idx + 1}" title="Cut syllable here">${icon("construction")}</button>
                  ` : ""}
                `).join("")}
              </div>

              <div class="chopper-feedback" id="chopFeedback">
                ${state.chopperResult === "correct" ? `
                  <span style="color:#065f46">${icon("check")} <strong>Perfect division!</strong> ${esc(currentChop.parts.join(" · "))} &nbsp;·&nbsp; Rule: ${esc(currentChop.rule)} (${esc(currentChop.explain)})</span>
                ` : state.chopperResult === "wrong" ? `
                  <span style="color:#b91c1c">${icon("x")} <strong>Try again!</strong> Look at the vowels and count the consonants between them.</span>
                ` : `
                  <span style="color:#92400e">Where should you split <strong>${esc(currentChop.word)}</strong>?</span>
                `}
              </div>

              <div style="margin-top:1.5rem">
                <button type="button" class="btn btn-primary" id="nextChopWord">Next Word ${icon("arrow-right")}</button>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- Word families show accurate morpheme combinations. -->
        ${currentTab === "morphology" ? `
          <div class="sor-panel-section">
            <div class="sor-section-banner">
              <h3>Word Parts in Real Academic Words</h3>
              <p>A morpheme is a meaningful word part. Study a word family to see how the same root and affixes contribute meaning across words. Not every prefix, root, and suffix can be freely combined.</p>
            </div>
            <div class="sor-morph-family" aria-label="Words built from the Latin root port, meaning carry">
              <div class="sor-morph-root"><span>LATIN ROOT</span><strong>port</strong><em>carry</em></div>
              <article class="sor-morph-word"><strong><span>trans-</span> + port</strong><h4>transport</h4><p>carry across or from place to place</p></article>
              <article class="sor-morph-word"><strong><span>im-</span> + port</strong><h4>import</h4><p>bring goods into a place</p></article>
              <article class="sor-morph-word"><strong><span>ex-</span> + port</strong><h4>export</h4><p>send goods out to another place</p></article>
              <article class="sor-morph-word"><strong>port + <span>-able</span></strong><h4>portable</h4><p>able to be carried</p></article>
            </div>
            <div class="sor-cognate-note"><strong>Language connection:</strong> Spanish <em>transportar</em> and English <em>transport</em> share a related word part and meaning. Compare spelling and meaning, then check that the meaning fits the sentence.</div>
            <div class="sor-extension-row"><strong>Try the word family:</strong><span>Write a sentence that makes one word’s meaning clear.</span><span class="sor-sentence-frame"><strong>Frame:</strong> “The ___ was portable because ___.”</span></div>
          </div>
        ` : ""}

      </div>
    </div>
  `;

  return {
    title: "Science of Reading Studio",
    html: raw(htmlContent),
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

  const tabs = [...root.querySelectorAll('[role="tab"][data-sor-tab]')];
  tabs.forEach((tab) => tab.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(tab);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    state.tab = tabs[next].dataset.sorTab;
    ctx.rerender();
    requestAnimationFrame(() => root.querySelector(`#sor-tab-${state.tab}`)?.focus());
  }));

  const resetPractice = (mode = state.activePractice) => {
    if (mode === "words") {
      state.wordGameIndex = 0; state.wordGameCorrect = 0; state.wordGameChoice = null;
    } else {
      state.textGameIndex = 0; state.textGameCorrect = 0; state.textGameChoice = null;
    }
  };
  root.querySelectorAll("[data-sor-practice]").forEach((button) => button.addEventListener("click", () => {
    state.activePractice = button.dataset.sorPractice;
    ctx.rerender();
  }));
  root.querySelectorAll("[data-practice-answer]").forEach((button) => button.addEventListener("click", () => {
    const isWords = state.activePractice === "words";
    const index = isWords ? state.wordGameIndex : state.textGameIndex;
    const band = lastGradeBand || "6-8";
    const quiz = isWords ? (band === "3-5" ? WORD_PART_CHALLENGE.slice(0, 4) : WORD_PART_CHALLENGE) : TEXT_CLUE_CHALLENGE[band];
    const question = quiz[index];
    if (!question) return;
    const answer = Number(button.dataset.practiceAnswer);
    if (isWords) { state.wordGameChoice = answer; if (answer === question.answer) state.wordGameCorrect++; }
    else { state.textGameChoice = answer; if (answer === question.answer) state.textGameCorrect++; }
    ctx.rerender();
  }));
  root.querySelector("#nextPracticeQuestion")?.addEventListener("click", () => {
    if (state.activePractice === "words") { state.wordGameIndex++; state.wordGameChoice = null; }
    else { state.textGameIndex++; state.textGameChoice = null; }
    ctx.rerender();
  });
  root.querySelector("#resetPracticeGame")?.addEventListener("click", () => {
    resetPractice(); ctx.rerender();
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

  // SVR Sliders & Real-Time Calculation
  const inputD = root.querySelector("#inputD");
  const inputLC = root.querySelector("#inputLC");
  const updateSvr = () => {
    state.svrD = Number(inputD?.value || 75);
    state.svrLC = Number(inputLC?.value || 80);
    const prod = Math.round((state.svrD / 100) * (state.svrLC / 100) * 100);
    const valD = root.querySelector("#valD");
    const valLC = root.querySelector("#valLC");
    const valRC = root.querySelector("#valRC");
    const valRCStatus = root.querySelector("#valRCStatus");
    if (valD) valD.textContent = `${state.svrD}%`;
    if (valLC) valLC.textContent = `${state.svrLC}%`;
    if (valRC) valRC.textContent = `${prod}%`;
    if (valRCStatus) {
      valRCStatus.textContent = prod >= 70
        ? "Proficient Comprehension"
        : prod >= 40
          ? "Developing / Fragile"
          : "Severe Comprehension Deficit";
    }
  };
  inputD?.addEventListener("input", () => {
    state.svrActiveProfile = null;
    root.querySelectorAll(".svr-profile-card").forEach((c) => c.classList.remove("active"));
    updateSvr();
  });
  inputLC?.addEventListener("input", () => {
    state.svrActiveProfile = null;
    root.querySelectorAll(".svr-profile-card").forEach((c) => c.classList.remove("active"));
    updateSvr();
  });

  // SVR Archetype Profile Cards
  root.querySelectorAll("[data-svr-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const profId = btn.dataset.svrProfile;
      const prof = SVR_PROFILES.find((p) => p.id === profId);
      if (prof && inputD && inputLC) {
        state.svrActiveProfile = profId;
        inputD.value = prof.d;
        inputLC.value = prof.lc;
        root.querySelectorAll(".svr-profile-card").forEach((c) => {
          c.classList.toggle("active", c.dataset.svrProfile === profId);
        });
        updateSvr();
      }
    });
  });

  // Audio Playback via Web Speech API
  root.querySelectorAll("[data-say]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = btn.dataset.say;
      if (text && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.85;
        window.speechSynthesis.speak(utter);
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

}
