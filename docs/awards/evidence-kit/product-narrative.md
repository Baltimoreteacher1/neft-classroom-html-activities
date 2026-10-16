# Product narrative (one page)

Use as the base text for award entries. Each sentence is either checked against the repository (cited in
brackets) or marked `[CONFIRM: ...]` because it depends on a feature, number or approval that was not
verified when this was written (2026-10-16). Delete the brackets before submitting. Do not add a number
that is not in `results-template.md` section 8.

## Name and one line

EduWonderLab (eduwonderlab.com): a free, teacher-built Grade 6 math website where students show their
thinking step by step, families get an optional bilingual way to help, and no child needs an account.

## The problem

A Grade 6 student who gets a ratio problem wrong usually learns only that the answer was wrong. A family
asked to help at home often learns less: the method on the page is not the one they were taught, and the
instructions are in one language. Teachers see the result the next day, not the thinking behind it.

## What it does

- **Shows the mistake, not the answer.** When a student types a line of work, the site checks it against
  the line above and, if exactly one named mistake would produce it, shows a "Looks like..." label and one
  question. It never shows the correct line. [`engine/components/step-solver.js:1-12`]
- **Names the misconception.** Wrong answers carry a misconception tag from a closed list in English and
  Spanish; the class's most common tags feed an anonymous class view that hides groups too small to be
  anonymous. [`functions/api/class-pulse.js:18`] `[CONFIRM: tag count and the surfaces that show it]`
- **Keeps the representations connected.** `[CONFIRM: linked table, graph, tape diagram and double number
line feature, and the lessons it covers]`
- **Lets a student see where they are.** `[CONFIRM: learning atlas, route and what it shows]`
  Students can also download their own progress as a file they keep. [`assets/my-progress/progress-view.js`]
- **Gives families three optional routes** (Quick, Learn and Practice, Family Math Studio), ungraded,
  with no adult signature. A copied homework link carries only the route and language, never answers.
  [homework bundle `homeworkShareUrl`] `[CONFIRM: "confused grown-up" family feature]`
- **Runs a class investigation.** `[CONFIRM: what it is, route, and a classroom example]`
- **Works in Spanish.** Student and family text is written in English and Spanish.
  `[CONFIRM: coverage rate from the Spanish parity check before claiming "every"]`

## Why it is different

- No student accounts, no ads, no third-party trackers: zero cookies on 18 measured student pages and a
  script ledger pinned at zero third-party scripts (with the exceptions listed in
  `../../privacy/data-map.md` F7). [`data/external-script-debt.json`]
- Accessibility is part of the build: keyboard use, visible focus, reduced-motion support, and no
  drag-only actions. `[CONFIRM: latest axe audit result and date; no conformance report exists in the repo]`
- Built by a classroom teacher and tested with real classes. `[CONFIRM: number of classes, years, schools]`

## Evidence

`[FILL IN: one sentence from results-template.md section 3, with n, interval and the limitation "one
teacher's classes, not a controlled study"]`. `[FILL IN: one family-practice number from section 5]`.
`[FILL IN: one quote with permission on file, from consent-and-quotes.md]`.

## Privacy in one paragraph

The site stores a student's work on their own device by default. Lesson telemetry sends a typed name and
class period to the teacher's records, readable only with a teacher key. AI help buttons send the student's
text (or a photo) to an AI service and the site does not store it. The full list, including what is not yet
done, is public at `/about/privacy-and-data/`. Do not claim legal compliance in an entry; the data map says
what the code does and no more.

## What is next

`[FILL IN: two honest next steps, for example the privacy fixes in data-map.md F1 to F8, a second teacher
pilot, and a conformance report]`

## Facts to keep consistent across entries

| Fact                          | Value                                       | Source                                                    |
| ----------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Cost to students and families | Free                                        | `[CONFIRM: no paid tier]`                                 |
| Languages                     | English and Spanish                         | `[CONFIRM]`                                               |
| Core lessons                  | 84 (with small-group and catch-up versions) | `CLAUDE.md` gate descriptions; `[CONFIRM: current count]` |
| Students using it             | `[FILL IN]`                                 | `[FILL IN]`                                               |
| Builder                       | `[FILL IN: name, role, whether solo]`       | `[FILL IN]`                                               |
