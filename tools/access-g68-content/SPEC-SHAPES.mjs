// Spec shapes for the grades 6-8 publisher pass. Built by tools/build-access-g68-content.mjs; linted by
// tools/lib/access-g68-lint.mjs (run `node tools/build-access-g68-content.mjs --lint` until it is clean).
//
// One file per kind and batch, default-exporting an array: listening-N.mjs, speaking-N.mjs, writing-N.mjs
// (bank activities in content/g6-8/<Domain>.json) and reading-N.mjs (Reading Room lessons). Copy the shape of the
// samples in listening-1.mjs, speaking-1.mjs, writing-1.mjs and reading-1.mjs.
//
// BANK ACTIVITY (Listening | Speaking | Writing). Ids get the prefix "68p-"; keep ids kebab-case and unique.
//   id, level "A"|"B"|"C", strand (a strand title shown in the room), title, skill (what the learner can do, plain words)
//   gw        optional grade-tag code (B and C only): g6-topic | g67-load | g67-task | g78-topic | g78-load | g78-task | g8-stretch
//   type      Listening default "multipleChoice"; Speaking and Writing default "constructed".
//             Others: multiSelect, order, cloze, sort, hotText, constructed (Listening note-taking summaries too)
//   dir       student directions (English). q = the question or task. No answer or heard text in dir/q.
//   script    Listening only: the heard text (55-330 words, plain prose, speaker names inline for dialogues).
//   opts      multipleChoice 3-4 / multiSelect 4-6 plain-text options, RIGHT ANSWER(S) FIRST (the builder places the key).
//   ans       multiSelect: how many leading opts are right (2 or 3)
//   why       one full-sentence note per WRONG option, in order: why that option is not right (never states the key outright)
//   items     order: texts in correct order. cloze: strings and [answer, wrong1, wrong2] blanks.
//   cats + sortItems [[text, categoryIndex], ...]   (sort)      sentences + answerIdx [i, ...]   (hotText)
//   table {caption, headers, rows} | chart {kind:"bar", title, unit, data:[{label,value}]} | picture {src:"pictures/68-....svg", alt}
//             (reuse existing pictures only; wording like "the table" or "the graph" REQUIRES the attachment)
//   vocab     [[term, kid-friendly definition, "término: definición en español"], ...] (2-4)
//   frames    2-4 sentence frames with ___ ;   focus  3+ short phrases (what to listen / say / write for)
//   correct   feedback when right (names the evidence);  hint  a nudge that does not give the answer away
//   wida      1-3 task-focus tags (never "Entering:" style level labels)
//   es        [Spanish goal (infinitive phrase for caregivers), Spanish directions for the child (tu form)];
//             same blanks (___) and numbers as the English dir
//   constructed only: models {A,B,C} (sample answers; A brief, C developed), criteria 3+ "I ..." self-check statements,
//             label (optional field label); Writing also: bank (6+ words/phrases) and plan (3+ organizer boxes,
//             e.g. "Claim: ...", "Evidence 1: ...", "Reasoning: ...")
//   optional  support, extension, teacher {use,function,lower,onLevel,challenge,noTech,prompt}, time
//
// READING ROOM LESSON (reading-N.mjs). Built into content/reading-room/lessons.json with id "rr68p-<id>".
//   id, level A|B|C (support level), title, summary, genre, subject, topics[], keyUse Narrate|Inform|Explain|Argue,
//   eldStandard ELD-LA|ELD-MA|ELD-SC|ELD-SS, languageFunction, languageFeatures[], minutes,
//   content + language (objectives), essential, background, hook, purpose (pre-reading),
//   vocab [[term, definition, example sentence, Spanish term], 3-6],
//   paras [paragraph text | {text, q: guiding question}]  (3-8; word counts A 110-230, B 150-330, C 190-430; FK 3.5-11.5)
//   table {headers, rows, description} optional (data-style texts)
//   qs        5-7 questions (builder adds a transfer task => 6-8 tasks). Each: kind literal|inference|vocab|structure|craft|data|
//             summary|evidence|purpose|constructed, phase first|second|third, skill, type, prompt, rat (why right, cites text)
//             types: choice/connector {opts right-first, why[wrong notes]} | multi {opts, ans, why} | cloze {cloze:[...]} |
//             order {items in order} | sort {cats, sortItems} | evidence {evidence:["p2"]} |
//             short {lookFor[3+], rubric[3+], frame, model}
//             Required mix: a literal, a vocab, an inference, a structure or craft question and one short response.
//   transfer {prompt, lookFor[3+], frame}
//   guide {mini, discussion[3+], misconception, answerNotes[2+], model}
//   family {en, es, questions[2+]}   (es = natural Spanish for the grown-up)
//   connections {write, speak, listen} optional
export default [];
