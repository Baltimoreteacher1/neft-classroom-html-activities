# The Language Page — AI model cards

**Status:** written 2026-11-25 from the code (every statement below was read in the file named on its card). It describes what
each AI route does, not whether it does it well: **no independent evaluation or red-team run exists**, and each card says what
tests do exist. `tools/language-page-ai-cards.test.mjs` fails when a route that calls a model is missing from the table, or
when the table says a route is (or is not) served on thelanguagepage.com and the host code says otherwise.

**The rule these routes follow** (`access-practice-lab/PLATFORM.md`, rule 3): the model *selects among authored moves*,
*asks questions*, or *answers from authored knowledge*. It does not write a learner's work, give a score or level, or see an
identity. Where a card says otherwise it is a limit, stated plainly.

**Providers.** All calls go through `functions/_lib/model-call.js`: Anthropic Claude Haiku when an API key is bound, else
Cloudflare Workers AI. Google Gemini is tried first only when a route opts in with `allowGemini: true`; **two routes do:
`/api/language-guide` (an adult's typed question) and `/api/language-guide/insights` (anonymized teacher questions)**. Neither handles learner work, so no learner text reaches Gemini.

## Route table (machine-read by the test)
| Route | Source | Served on thelanguagepage.com |
| --- | --- | --- |
| `/api/language-guide` | `functions/api/language-guide.js` | yes |
| `/api/language-guide/insights` | `functions/api/language-guide/insights.js` | yes |
| `/api/book-coach` | `functions/api/book-coach.js` | yes |
| `/api/experience-compile` | `functions/api/experience-compile.js` | yes |
| `/api/class/ai/writing` | `functions/_lib/class-platform/ai.js` | yes |
| `/api/class/ai/hint` | `functions/_lib/class-platform/ai.js` | yes |
| `/api/class/ai/character` | `functions/_lib/class-platform/ai.js` | yes |
| `/api/studio/ai` | `functions/api/studio/ai.js` | no |
| `/api/forge` | `functions/api/forge.js` | no |
| `/api/grade/` | `functions/api/grade/[[path]].js` | no |
| `/api/plan-notes/` | `functions/api/plan-notes/[[path]].js` | no |
| `/api/reasoning/` | `functions/api/reasoning/[[path]].js` | no |
| `/api/screener-assist/` | `functions/api/screener-assist/[[path]].js` | no |
| `/api/study-pack` | `functions/api/study-pack/[[path]].js` | no |
| `/api/teach-machine` | `functions/api/teach-machine.js` | no |
| `/api/tutor/` | `functions/api/tutor/[[path]].js` | no |
| `/api/ai/daily-update` | `functions/api/ai/daily-update.js` | no |

The routes marked **no** belong to the wider EduWonderLab site (math tutoring, grading, lesson generation, planning notes).
On thelanguagepage.com their paths redirect to eduwonderlab.com; they are listed so no AI route goes unrecorded. They are not
covered by a card here.

---

## Cards for routes served on thelanguagepage.com

### `/api/language-guide` — Mr. Neft, the guide on the teacher and family pages
- **Who calls it:** any adult who types a question into the guide and presses Ask. No key.
- **Sent to the model:** the question (up to 400 characters), up to 3 earlier question-and-answer turns, the page name, the tour
  step, the grade choice and the language, with a system prompt built from authored knowledge (`src/intro/guide-knowledge.js`).
  Asked not to include names; no learner work, recordings, progress or identifiers are sent.
- **Returns:** a short free-text answer (cut at 1,200 characters).
- **Providers:** Gemini, else Claude Haiku, else Workers AI.
- **Guardrails:** grounded in authored knowledge by the prompt; per-IP cap of 40 an hour and a site cap of 1,500 a day; over a cap
  or with no model the page shows answers from the authored Site Guide instead.
- **Stored:** each question for **90 days**, with anything that looks like a name, email address or phone number replaced, plus the
  page, step, grade choice, language, whether the model answered and the time. **No IP address, no earlier turns, no answer.** Read
  back only with the teacher key.
- **Limits:** the answer is free text and is not checked beyond the prompt; name scrubbing is pattern-based and can miss; the question
  is sent to Google when Gemini is bound.
- **Tests:** `tools/access-intro-guide-ai.test.mjs`, `tools/access-guide-insights.test.mjs`.

### `/api/language-guide/insights` — themes in what teachers ask
- **Who calls it:** the site owner or a teacher holding the teacher key (`GET`).
- **Sent to the model:** the most frequent questions from the anonymous log (already scrubbed), numbered.
- **Returns:** question numbers grouped into themes with a short label, and "gaps" with a one-line reason; every number must exist in
  the input. Nothing it writes is shown to a learner; a person decides whether to author a new answer. With fewer than 5 distinct
  questions, or no model, it returns nothing.
- **Providers:** Gemini, else Claude Haiku, else Workers AI (it opts into Gemini; it sees only the anonymized teacher questions).
- **Stored:** nothing new.
- **Tests:** `tools/access-guide-insights.test.mjs`.

### `/api/book-coach` — the Book Studio writing coach
- **Who calls it:** a learner pressing a coach button in Book Studio.
- **Sent to the model:** only what the chosen action needs: the page prompt and book title, headings, one chosen sentence, the current
  page's words, a picture's catalogue name, or a word. Text is capped at 2,000 characters. Never a name, picture, recording or identifier.
- **Returns:** questions, observations that quote the learner, or word choices. The whole reply is rejected if any item is over 30 words,
  repeats a run of 8 or more of the learner's words, is not a question when it should be, or looks like a score.
- **Providers:** Claude Haiku, else Workers AI. **Never Gemini.**
- **Guardrails:** 240 requests per IP per hour and 4,000 a day; with no model the editor shows built-in tips labelled "Built-in tips (no AI)".
- **Stored:** nothing (only anonymous per-IP-hour counters; the IP is hashed).
- **Limits:** the model sees the learner's own words, so a learner could type a name.
- **Tests:** `tools/book-coach.test.mjs`.

### `/api/experience-compile` — "Suggest improvements" in the Experience Builder
- **Who calls it:** teachers only (site teacher key or a class teacher passcode).
- **Sent to the model:** the teacher's own source text (up to 6,000 characters), the band, subject, Key Language Use and topic, and the
  characters' ids, names and roles. Never learner work, names, recordings, rosters or progress.
- **Returns:** suggested questions and lines. Anything over 30 words, naming an unknown character, bringing in score or level wording, or
  not traceable to the teacher's source is dropped; a reply that is not the expected shape is dropped whole.
- **Providers:** Claude Haiku, else Workers AI.
- **Stored:** nothing.
- **Tests:** `functions/api/experience-compile.test.mjs`.

### `/api/class/ai/writing` — the writing "second look" in a class
- **Who calls it:** a learner in a class pressing the button.
- **Sent to the model:** the learner's own draft only, 12 to 1,800 characters, with the purpose of the writing. No prompt, passage, test item or identity.
- **Returns:** an id for the next move to strengthen and at most two error-pattern ids. The browser shows its own authored wording for those ids; **the model writes nothing a learner reads.** Output that does not match the authored lists is dropped.
- **Providers:** Claude Haiku, else Workers AI. No Gemini.
- **Guardrails:** a shared limiter of 30 requests a minute per client across the class AI routes.
- **Stored:** nothing.
- **Tests:** `functions/api/class/ai.test.mjs`.

### `/api/class/ai/hint` — which authored hint to show next
- **Who calls it:** the Fluency Lab's practice, a **math** feature of the shared class platform (not a language-lab page).
- **Sent to the model:** the problem text (up to 400 characters), the learner's attempt (up to 80) and up to 8 authored hints. The accepted answers are used on the server to remove hints that would give the answer away, and are **not** sent; the chosen hint is checked again.
- **Returns:** an index into the authored hints. Nothing is generated.
- **Providers:** Claude Haiku, else Workers AI. **Stored:** nothing. **Tests:** `functions/api/class/ai.test.mjs`.

### `/api/class/ai/character` — which authored answer a simulation character gives
- **Who calls it:** a learner typing a question to a character in a simulation when the on-device keyword match is weak.
- **Sent to the model:** the typed question with names, emails and phone numbers replaced, and the list of the character's authored topics. If fewer than two letters or digits remain, nothing is sent.
- **Returns:** one topic id, or "none". The character always answers with the lab's own authored words.
- **Providers:** Claude Haiku, else Workers AI. **Stored:** nothing. **Tests:** `functions/api/class/ai.test.mjs`.

---

## What no card can say yet
- **No evaluation.** There is no measured accuracy for any route and no red-team run (prompt injection from learner text, name leakage,
  answer leakage, wrong-language output). Building that suite is the next AI task (`award-program-prompt.md`, workstream 9).
- **Authority.** `PLATFORM.md` lists these routes' decisions; three had no entry and no quoted decision from Joel until this document
  (see `PLATFORM.md`, "AI routes recorded from the code, 2026-11-25").
- **Providers are subprocessors.** Anthropic, Google and Cloudflare receive the text described above; whether agreements are needed
  is a question for counsel (`privacy.md`, questions 2).
