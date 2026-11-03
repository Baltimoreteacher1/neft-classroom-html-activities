# ACCESS Practice Lab: assessment bank authoring guide

The bank is original practice material for multilingual learners in grades 3-5 and 6-8. It is NOT the official WIDA ACCESS test and
must never copy, paraphrase or imitate secure WIDA/DRC items, passages, recordings, rubrics or artwork. Everything here is written
from scratch. No item may claim to be human-reviewed (none has been): `reviewStatus` is `automated-checks-only`.

Honesty rules that bind every item: no WIDA level, scale score, "proficient", prediction or "official" wording in anything a
student sees; no timer or speed language; no item promises a result.

## Files

One JSON file per **set** in `access-practice-lab/content/bank/`, named `<set id>.json`. A set is 8 to 10 items that share a few
stimuli and one domain and one grade band (the engine plays a set as one sitting). Set id pattern: `b35-read-01` (grade band 3-5 or 6-8
written `35` / `68`, domain `listen` `read` `speak` `write`, two-digit number). Item id pattern: `b35r01-3` (`b35` + `r|l|s|w` + set
number + `-` + item number). Ids must be unique across the whole bank.

```jsonc
{
  "id": "b35-read-01",
  "title": "Reading practice: A Day at the Tide Pools",
  "grade": "3-5",
  "domain": "Reading",
  "minutes": 18,
  "description": "One-sentence description for the chooser.",
  "bank": {
    "version": 1,
    "provenance": {
      "source": "original",
      "author": "EduWonderLab, AI-assisted draft",
      "created": "2026-11-02",
    },
    "reviewStatus": "automated-checks-only",
  },
  "stimuli": [/* passage | table | image | audio | prompt (see below) */],
  "items": [/* engine items with a `meta` block (see below) */],
}
```

### Stimuli

- passage: `{ "id":"tide","kind":"passage","title":"...","paragraphs":["...","..."] }` 3-5: 70 to 330 words; 6-8: 120 to 480 words.
- table: `{ "id":"t1","kind":"table","title":"...","caption":"what the table shows","columns":["..",".."],"rows":[["..",".."]] }` first column is the row header.
- image: `{ "id":"i1","kind":"image","title":"...","src":"/access-practice-lab/content/bank/img/<name>.svg","alt":"specific description (what a blind reader needs)","caption":"..." }`
  Only if you also create the SVG (simple, original, accurate, no text rendered as the only information). Prefer tables and text.
- audio (Listening): `{ "id":"a1","kind":"audio","title":"Listen: ...","transcript":true,"maxPlays":2,"turns":[{"speaker":"Teacher","text":".."}], "script":"<turns joined as 'Speaker: text' with single spaces>" }`
  45 to 260 spoken words. Use real, natural, grade-level speech. One speaker is allowed for a talk/announcement (`speaker`: "Narrator" or
  "Teacher"); conversations and multi-speaker exchanges use 2 to 3 speakers. `script` MUST equal the joined turns exactly, e.g.
  `"Teacher: Hello. Student one: Hi."`. The spoken text and the answer key must agree exactly.
- prompt (Speaking, Writing): `{ "id":"p1","kind":"prompt","title":"Speaking task","paragraphs":["the scenario and the task"] }` the prompt may contain a small
  data set or scenario inside its paragraphs. Speaking/Writing items need a clear purpose and audience.

### Item fields (engine schema) and the `meta` block

Item types per domain: Reading = `multiple-choice` `multiple-select` `dropdown` `ordering` `matching` `drag-drop`. Listening =
`listening-response` (max 75 words on screen: stem + options), plus `ordering` `matching` `drag-drop` `dropdown` `multiple-select` with
very short text. Speaking = `speaking-response`. Writing = `constructed-response`.

Every item: `id, type, domain, klu ("Narrate"|"Inform"|"Explain"|"Argue"), context, stimulus (a stimulus id), stem`, the type's body
(`options`+`answer`, `dropdown`, `ordering`, `matching`, `dragDrop`, `speaking`, `constructed`), and:

- `distractors`: for choice items, an object `{ "<wrong option id>": "why this choice is not right, specific to the text" }`. One per wrong option.
- `explanation`: for objective items, one or two sentences that justify the key from the stimulus.
- `support`: `{ "clue": "...", "frame": "...", "model": "..." }`. clue = points to where in the stimulus to look and what to notice, WITHOUT
  stating the answer. frame = a sentence frame with blanks (`______`) that structures the language without giving the answer. model =
  "Mentor example." followed by a worked example about a DIFFERENT topic that shows the same language move; then one line telling the
  learner to do the same with the task. The model must not share the task's topic or wording.
- Speaking items: `speaking: { "prepSeconds": 30-45, "recordSeconds": 45-90, "takes": 2, "checklist": ["I ...", "I ...", "I ..."], "exemplar": ["a characteristic of a strong response", "...", "..."] }`.
  checklist = learner self-check lines. exemplar = teacher-facing characteristics (observable features, not a model script to memorize).
- Writing items: `constructed: { "minWords": 25-120, "maxWords": 80-250, "checklist": ["I ...","I ...","I ..."], "exemplar": ["...","...","..."] }`.
- `meta`:

```jsonc
"meta": {
  "rev": 1,
  "mode": "Interpretive",            // Interpretive for Listening/Reading, Expressive for Speaking/Writing (must match)
  "standard": "ELD-SC",              // by context: Mathematics ELD-MA, Science ELD-SC, Social Studies ELD-SS, Language Arts ELD-LA, Social and Instructional ELD-SI
  "functions": ["Explain cause and effect"],   // from: Describe | Sequence events or retell | Summarize a main idea | Present factual information | Explain cause and effect | Explain a process or relationship | Compare or contrast | Classify information | Interpret data | Make and support a claim | Justify a conclusion | Give directions or instructions
  "features": ["connectors and transitions"],  // from: academic vocabulary | connectors and transitions | complex sentences | noun groups | verb tenses | discourse organization | evidence and elaboration
  "band": "building",                // practice band: early | building | strong   (NOT a WIDA level; never name levels)
  "stimulusType": "passage",         // must equal the stimulus kind
  "cognitive": "analyze",            // recall | interpret | analyze | evaluate | create
  "languageDemand": "moderate",      // low | moderate | high  (the language needed to read/hear the task and respond)
  "response": "select",              // select | order | match | classify | write | speak
  "scoring": "key",                  // key for objective items; rubric for speaking/writing
  "rubric": "writing-practice",      // only when scoring is rubric: speaking-practice | writing-practice
  "wida": { "explicit": true, "ids": ["ELD-SC.2-3.Explain.Interpretive", "ELD-SC.4-5.Explain.Interpretive"] },
  "misconceptions": { "a": "confuses cause with effect" },   // one short tag per WRONG option id (choice items)
  "parallel": "g35-sc-explain-01",   // optional: items in different sets that practice the SAME skill at the same demand share this group id
  "facts": ["Water vapor condenses into droplets when it cools."],   // EVERY factual claim the item or its stimulus relies on (science, math, history, geography, literature). [] if none
  "provenance": { "source": "original", "author": "EduWonderLab, AI-assisted draft" },
  "reviewStatus": "automated-checks-only"
}
```

`meta.wida.ids` must equal the catalog entries for (context, klu, domain's mode, grade band) exactly. Look them up with:
`node -e "import('./access-practice-lab/src/acc/wida/framework.js').then(m=>console.log(JSON.stringify(m.mapItem({domain:'Reading',klu:'Explain',context:'Science'},'3-5'))))"`
`explicit` is true when the framework lists that combination (Mathematics, Science and Social Studies are Explain and Argue; Language Arts is Narrate and
Inform, plus Argue from grade 4; Social and Instructional is listed for all four). Other combinations are supplementary practice and are labelled so.

## What every item must be

1. A clear language objective: the task asks learners to USE or UNDERSTAND a specific language move (explain a cause, compare, justify, sequence, interpret data ...),
   not only recall. Content knowledge must come from the stimulus, not from outside knowledge.
2. Accurate. Science, math, history, geography and literature must be correct and appropriate for the grade. List each factual claim in `meta.facts`. If unsure of a
   fact, do not use it. Math items must compute exactly. Do not use real living people, brand names, or contested claims.
3. Answerable and unambiguous: exactly one defensible key (or the exact set for multiple-select). Every wrong choice must be wrong for a reason the stimulus shows, and
   plausible (a real misconception), similar in length and form to the key. No "all/none of the above". No trick wording. Vary the key position.
4. Language at the right level: 3-5 uses short, concrete sentences plus a few academic words in context; 6-8 uses longer sentences, connectors (however, as a result, although),
   and more abstract content. Do not simplify away the reasoning: a beginning-level ("early") item still asks for meaning, not a bare vocabulary match.
5. Culturally inclusive and not dependent on background knowledge unrelated to the language target: avoid holidays, sports rules, brands, or customs a newcomer would need to
   already know. Use diverse names and settings. Do not use sensitive topics.
6. Original: do not reuse a topic, a passage, a structure or a stem already in the bank. Check the other sets in `content/bank/` before you write. Near-duplicates are rejected.
7. Listening: the key must be recoverable only from the audio; the on-screen text is short. Do not put the answer in the title. Natural speech, not a read-out reading passage.
8. Speaking: the prompt gives a purpose and audience and a real thing to talk about (a picture described in words, a data table in the prompt, a scenario). It must be doable in
   the time given, and ask for a language function (describe, retell, sequence, compare, explain cause and effect, interpret information, present evidence, justify a conclusion,
   explain mathematical reasoning, respond to a scenario).
9. Writing: a clear purpose, audience and stimulus; a reasonable length; the kind of task named in the brief (narrative retell, informational paragraph, scientific explanation,
   mathematical explanation, compare and contrast, claim with evidence, historical interpretation, extended response).
10. Supports (clue/frame/model) help with language and access, never supply the answer.

## Validate before you finish

`node tools/validate-access-bank.mjs --file access-practice-lab/content/bank/<set>.json` must print `0 error(s)` for every file you wrote. Fix every error; read each warning
and fix it unless you can justify it. Also run `node tools/validate-access-bank.mjs` for the whole bank to catch duplicates against other sets (other authors write at the same time, so
only your own files must be clean; a duplicate with another set means one of you must change the item).
