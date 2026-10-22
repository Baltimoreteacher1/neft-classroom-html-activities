# ACCESS Practice Lab — studio content contract (missions, speaking, writing, detective)

Companion to `CONTENT.md`. Everything here is JSON under `content/`, validated by
`node tools/validate-access-studio.mjs` (part of `npm run validate:access-lab`).
Rules that apply to ALL of it:

- **Practice, not a WIDA score.** Nothing here may claim to measure a WIDA proficiency
  level. Use "practice", "evidence", "next step". Never write "Level 3", "Bridging",
  "you scored", "predicted".
- **Grade-level content, language supports.** Supports (frames, word banks, models,
  cognates) change; the intellectual task does not get dumbed down.
- **Authentic content.** Real-sounding data, plausible numbers, specific names/places.
  Science/social-studies/math/ELA content must be factually correct. No brand names.
- **No answer leaks.** Option text must not reveal correctness by length, letter, or
  "obviously silly" wording. Key position varies. Distractors must each be a
  plausible wrong reading (tag the reason, see `distractor`).
- **Spanish gloss** for every `vocab` entry: `"término: definición breve en español"`.
- Standards use WIDA ELD Standards Framework (2020) codes: `ELD-LA` (Language Arts),
  `ELD-MA` (Math), `ELD-SC` (Science), `ELD-SS` (Social Studies), `ELD-SI` (Social &
  Instructional). Key Language Uses: `Narrate`, `Inform`, `Explain`, `Argue`.
  Dimensions: `Discourse`, `Sentence`, `Word/Phrase`.
- IDs are kebab-case and globally unique across all studio files and the activity bank.

## Shared fragments

```jsonc
"vocab": [{ "term": "runoff", "def": "rain water that flows over the ground", "es": "escorrentía: agua de lluvia que corre sobre el suelo" }]
"stages": {                       // scaffold packages over the SAME task (never a different task)
  "guided":    { "frames": ["One reason is ___ because ___."], "bank": ["runoff", "…"], "model": "a full model response" },
  "supported": { "bank": ["runoff", "…"] },                       // words only
  "independent": {}                                               // nothing; must stay empty
}
"chart":  { "kind": "bar", "title": "…", "unit": "…", "data": [{ "label": "…", "value": 1 }] }   // bar | pictograph(+icon)
"table":  { "caption": "…", "headers": ["…"], "rows": [["…"]] }
```

## `content/studio/speaking.json`

```jsonc
{
  "version": 1,
  "tasks": [
    {
      "id": "spk-watershed-explain",
      "band": "6-8", // "6-8" | "3-5"
      "title": "Explain Why the Fish Died",
      "taskType": "retell|describe|compare|explain|argue|discuss",
      "keyUse": "Explain",
      "standards": ["ELD-SC"],
      "dimensions": ["Discourse", "Sentence"],
      "contentArea": "Science",
      "time": "6 min",
      "scenario": "1-2 sentences setting a real purpose and audience.",
      "prompt": "What the student must say (second person, imperative).",
      "stimulus": {
        // optional; exactly the heard/seen material
        "kind": "audio|picture|chart|table|text|none",
        "turns": [{ "speaker": "Dr. Vance", "voice": "f", "text": "…" }], // audio only; voice f|m|n
        "chart": {},
        "table": {},
        "picture": { "src": "pictures/….svg", "alt": "…" },
        "text": ["para", "para"],
      },
      "planner": [{ "id": "claim", "label": "My main idea", "hint": "Say it in one sentence." }], // 3-5 slots, ordered
      "targetSeconds": [30, 90],
      "sourceTerms": ["dissolved oxygen", "Station 2", "2 parts per million"], // content a strong answer draws from the stimulus (>=3 if stimulus)
      "vocab": [],
      "stages": {},
      "turns": [
        {
          "partner": "Jordan",
          "voice": "m",
          "say": "…",
          "expects": "agree-add|disagree-evidence|clarify|extend",
        },
      ], // discuss only (2-4)
      "successCriteria": ["Observable, language-focused, 3-4 items"],
      "teacher": {
        "listenFor": ["what to listen for"],
        "followUp": "one question",
        "exemplarIds": ["ex-spk-…"],
      },
    },
  ],
}
```

## `content/studio/writing.json`

```jsonc
{
  "version": 1,
  "tasks": [
    {
      "id": "wrt-cafeteria-argue",
      "band": "6-8",
      "title": "Should Lunch Be Build-Your-Own?",
      "form": "paragraph|cer|essay|letter|report|summary|narrative|email",
      "keyUse": "Argue",
      "standards": ["ELD-SS"],
      "dimensions": ["Discourse", "Word/Phrase"],
      "contentArea": "Social Studies",
      "time": "20 min",
      "scenario": "Purpose + audience.",
      "prompt": "Write … (second person).",
      "sources": [
        {
          "id": "s1",
          "kind": "passage|table|chart|quote",
          "title": "…",
          "text": ["para"],
          "table": {},
          "chart": {},
        },
      ],
      "organizer": [{ "id": "claim", "label": "Claim", "hint": "…" }], // 3-5 slots
      "expected": { "minWords": 60, "maxWords": 160, "paragraphs": 1 },
      "sourceTerms": ["42 pounds", "self-serve"], // evidence a strong response can cite (>=3)
      "vocab": [],
      "stages": {},
      "revisionPrompts": [
        {
          "focus": "evidence|reasoning|cohesion|precision|sentence",
          "prompt": "A question that asks for a specific revision.",
        },
      ],
      "successCriteria": ["…"],
      "teacher": { "lookFor": ["…"], "commonIssues": ["…"], "exemplarIds": ["ex-wrt-…"] },
    },
  ],
}
```

## `content/studio/exemplars.json` (teacher scoring anchors)

```jsonc
{
  "version": 1,
  "exemplars": [
    {
      "id": "ex-wrt-cafeteria-1",
      "taskId": "wrt-cafeteria-argue",
      "modality": "writing|speaking",
      "response": "Full student-like response (speaking: a transcript with natural fillers and false starts).",
      "practiceBand": "early|building|strong", // practice anchors, NOT WIDA levels
      "annotations": [
        {
          "quote": "exact substring of response",
          "dimension": "Discourse|Sentence|Word/Phrase",
          "note": "what it shows",
        },
      ],
      "whyThisBand": "2-3 sentences, evidence-based.",
      "nextStep": "one teachable move",
    },
  ],
}
```

Every task lists at least 3 exemplars (one per `practiceBand`); each `annotations[].quote` must
occur verbatim in `response`. Write exemplars like real multilingual 6th-8th graders: believable
errors at lower bands, not caricature.

## `content/missions/<id>.json`

```jsonc
{
  "version": 1,
  "id": "watershed-mystery",
  "title": "…",
  "subtitle": "…",
  "band": "6-8",
  "role": "Junior Hydrologist",
  "icon": "💧",
  "theme": "#1f766f",
  "contentArea": "Science",
  "summary": "…",
  "keyUses": ["Explain", "Argue"],
  "standards": ["ELD-SC"],
  "minutes": 40,
  "briefing": { "scene": "2-3 sentences", "goal": "What the team must decide/produce." },
  "sources": {
    // everything the phases can show
    "dispatch": {
      "kind": "audio",
      "title": "…",
      "turns": [{ "speaker": "Dr. Vance", "voice": "f", "text": "…" }],
    },
    "report": { "kind": "passage", "title": "…", "text": ["para", "para"] },
    "oxygen": { "kind": "chart", "title": "…", "chart": {} },
    "log": { "kind": "table", "title": "…", "table": {} },
  },
  "phases": [
    {
      "id": "p1",
      "skill": "Listening|Reading|Speaking|Writing|Decision",
      "title": "…",
      "instructions": "…",
      "uses": ["dispatch"], // source ids shown
      "tasks": [
        {
          "id": "p1-q1",
          "kind": "question",
          "tier": "core|stretch",
          "q": "…",
          "options": [
            {
              "id": "a",
              "text": "…",
              "distractor": "unsupported|opposite|true-not-asked|overgeneralized|detail-trap|partial",
            },
          ],
          "answer": "b",
          "explain": "Why the answer is right, citing the source.",
          "skill": "main-idea|detail|inference|evidence|vocabulary|purpose|synthesis",
        },
        {
          "id": "p1-ev",
          "kind": "evidence",
          "q": "Choose the statements that support …",
          "from": "dispatch",
          "pool": [{ "id": "e1", "text": "exact sentence from the source", "supports": true }],
          "boardLabel": "Oxygen data",
        },
        { "id": "p3-say", "kind": "speak", "taskRef": "spk-…" }, // reuse a speaking task, OR inline "task": {…speaking task…}
        { "id": "p4-write", "kind": "write", "taskRef": "wrt-…" }, // reuse a writing task, OR inline "task": {…}
      ],
      "decision": {
        // only for skill "Decision"
        "q": "Which site do you investigate first?",
        "options": [
          {
            "id": "d1",
            "text": "…",
            "consequence": "What you learn / what changes.",
            "unlocks": ["log"],
            "board": [{ "id": "b9", "label": "Oxygen data", "text": "fact gained" }],
            "flag": "chose-forest",
          },
        ],
      },
    },
  ],
  "debrief": { "teacherQuestions": ["…"], "connections": "…" },
  "vocab": [],
}
```

Missions are 4-6 phases covering Listening, Reading, Speaking, Writing and ≥1 Decision. At least
2 sources of different kinds, one multi-source `synthesis` question, ≥1 `evidence` task, ≥1
`inference` question, and every `question` option tagged with `distractor` except the answer.
`tier: "stretch"` questions appear only after independent success; provide ≥1 per Reading phase.

## `content/detective/patterns.json`

Keyed by the detector ids implemented in `src/lang/errors.js` (see that file for the id list).

```jsonc
{
  "version": 1,
  "patterns": {
    "sv-agree-3sg": {
      "name": "He/she/it + verb-s",
      "category": "syntax",
      "lesson": {
        "rule": "≤ 28 words, plain language",
        "wrong": "She go to school.",
        "right": "She goes to school.",
        "why": "One sentence on meaning/clarity.",
        "l1": "Optional transfer note, neutral tone, no stereotypes.",
        "check": "A one-line self-check question the student can ask while editing.",
      },
      "practice": [
        {
          "id": "sv3-1",
          "kind": "fix",
          "prompt": "Fix the sentence.",
          "broken": "My brother play soccer every day.",
          "fixed": ["My brother plays soccer every day."],
        },
      ],
      "transfer": [
        {
          "id": "sv3-t1",
          "context": "Describe your morning routine.",
          "prompt": "Write 2 sentences about what your sister does before school.",
          "minWords": 8,
        },
      ],
    },
  },
}
```

`practice[].broken` MUST be flagged by that pattern's detector and no `fixed[]` string may be flagged
by ANY detector (the validator runs the real detectors). 6 practice items + 2 transfer prompts per pattern.
