# 90-second demo script and shot list

Target: one screen recording with voice-over, 90 seconds, captions in English and Spanish. Written
2026-10-16. A `[CONFIRM: ...]` field means the feature or route was being built in the same work wave and
was not checked here; open the page, confirm what it does, then edit the line. Never script a claim the
recording does not show on screen.

## Before you record (safety)

- Use a fresh browser profile with no stored student name. Lesson telemetry ignores Do-Not-Track and
  teacher mode (`../../privacy/data-map.md` F15), so a typed demo name would be sent to the class records.
  If you must type a name, use "Demo D." and delete the rows afterwards.
- No real student work, names or class periods on screen. Check the address bar, tab titles and the
  family reflection box. The family homework page stores an optional partner name, photo and voice memo
  locally: leave them empty.
- Do not show the teacher key, the teacher dashboard or any URL with `?key=`.
- Do not use the AI helper buttons with a real photo. If the demo shows one, type a fake problem.
- Record at 1920x1080 and a second pass at 390x844 for the phone shot. Hide bookmarks.
- Turn off notifications. Reduced-motion should be on for the demo so nothing flashes; no flashing content
  in the edit.

## Voice-over (147 words: about 60 seconds of speech at 145 words a minute, the rest is on-screen action)

Timecodes are cumulative.

| Time      | Voice-over (English)                                                                                                                                                       | Spanish caption                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:08 | "Most math sites tell a student the answer was wrong. This one asks what they were thinking."                                                                              | "La mayoría de los sitios de matemáticas solo dicen que la respuesta está mal. Este pregunta qué estabas pensando."                                                 |
| 0:08-0:30 | "A Grade 6 student types each step of an equation. When a line does not match, the site names the likely mistake and asks one question. It never shows the correct line."  | "Un estudiante de sexto grado escribe cada paso. Si una línea no coincide, el sitio nombra el error probable y hace una pregunta. Nunca muestra la línea correcta." |
| 0:30-0:45 | "Tables, graphs, tape diagrams and number lines are linked, so changing one shows the others." `[CONFIRM]`                                                                 | "Las tablas, gráficas, diagramas de cinta y rectas numéricas están conectados: al cambiar una, cambian las demás."                                                  |
| 0:45-0:55 | "The learning atlas shows a student where they are in the year, and they can keep their own progress file." `[CONFIRM]`                                                    | "El atlas de aprendizaje muestra dónde está el estudiante en el año, y puede guardar su propio archivo de progreso."                                                |
| 0:55-1:08 | "Families get three optional routes, in English and Spanish, with no sign-in and no signature. The shared link carries the route and language, never the child's answers." | "Las familias tienen tres rutas opcionales, en inglés y español, sin cuenta y sin firma. El enlace compartido lleva la ruta y el idioma, nunca las respuestas." |
| 1:08-1:15 | "Teachers see a class view with no names." `[CONFIRM]` | "Los maestros ven una vista de la clase sin nombres." |
| 1:15-1:25 | "No accounts. No ads. No cookies on student pages. What leaves the device is listed on a public privacy page."                                                             | "Sin cuentas. Sin anuncios. Sin cookies en las páginas de estudiantes. Lo que sale del dispositivo está en una página pública de privacidad."                       |
| 1:25-1:30 | "EduWonderLab. Free, and built by a classroom teacher."                                                                                                                    | "EduWonderLab. Gratis, hecho por un maestro de aula."                                                                                                               |

## Shot list

| #   | Time      | Route (open this)                                                                                                                         | Action on screen                                                                                                                   | On-screen text                                                 | Notes                                                                                        |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | 0:00-0:08 | `/` or `/curriculum/`                                                                                                                     | Slow scroll of the hub, then cut                                                                                                   | "Free. Grade 6 math. English and Spanish."                     | Check no student name in the hub's resume strip                                              |
| 2   | 0:08-0:30 | A lesson that uses the step solver: find one with `rg -l step-solver lessons/*/config.json`, open `/lessons/<id>/` `[CONFIRM: lesson id]` | Type a correct first line, then a line with a common mistake. Show the "Looks like..." label and the one question                  | "It names the mistake. It does not give the answer."           | Needs `dist/`: build the site or use the live site. Show the Spanish toggle for 2 seconds    |
| 3   | 0:30-0:45 | `[CONFIRM: linked-representations route]`; fallback `/curriculum/math-workbench/`                                                         | Change a number in one representation and show the others update                                                                   | "Linked representations"                                       | Do not narrate anything the recording does not show                                          |
| 4   | 0:45-0:55 | `/curriculum/my-progress/` and `[CONFIRM: learning atlas route]`                                                                          | Open the page with sample data, press "Back up", show the downloaded file name                                                     | "Your progress. Your file."                                    | Use sample data created in the fresh profile                                                 |
| 5   | 0:55-1:15 | `/lessons/<id>/homework.html` (any lesson) `[CONFIRM: Family Math Studio route and "confused grown-up" view]`                             | Show the three route choices, switch to Spanish, press "Copy link", paste into the address bar and show only `?route=...&lang=...` | "Optional. Ungraded. No signature."                            | The pasted link must show no answers. Keep reflection boxes empty                            |
| 6   | 1:00-1:10 | `[CONFIRM: class investigation route]`                                                                                                    | One shot of a class-level result with no names                                                                                     | "Class investigation"                                          | Skip if the feature has no anonymous view                                                    |
| 7   | 1:15-1:25 | `/about/privacy-and-data/`                                                                                                                | Scroll the plain-language list, then the table                                                                                     | "No accounts. No ads. No cookies."                             | Shot 7 must be accurate on the day: re-read the "Known gaps" box and the F1 to F8 list first |
| 8   | 1:25-1:30 | End card                                                                                                                                  | Logo or title on a plain background                                                                                                | "EduWonderLab · eduwonderlab.com" `[CONFIRM: URL on the card]` |                                                                                              |

If the edit runs long, drop shot 6 first, then shot 4, and remove their voice-over lines.

## Accessibility of the video

- Open and closed captions in English and Spanish (burn in one, supply a `.vtt` for each).
- Audio description line for each on-screen action is in the "Action on screen" column; supply it as a
  text transcript with the file.
- Contrast on any title card at 4.5:1 or better; no text smaller than 28 px at 1080p.
- No flashing; hold each shot at least 3 seconds.
- Provide a transcript file `[FILL IN: path]` for entries that require one.

## Alternate cuts

| Length     | Keep shots                                                           | Use                                                                                         |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 30 seconds | 1, 2, 5, 8                                                           | Social or a form with a short limit                                                         |
| 90 seconds | all                                                                  | Main entry video                                                                            |
| 3 minutes  | all, with 20 seconds each on 2 and 5 and a 20 second privacy segment | Submissions that allow longer video `[CONFIRM: each award's limit in ../award-map-2026.md]` |

## Sign-off before it goes out

| Check                                                                                | Done by     | Date        |
| ------------------------------------------------------------------------------------ | ----------- | ----------- |
| Every `[CONFIRM]` resolved or its sentence removed                                   | `[FILL IN]` | `[FILL IN]` |
| No student name, face, class period or real work visible (pause and scrub the video) | `[FILL IN]` | `[FILL IN]` |
| Spanish captions read by a Spanish speaker                                           | `[FILL IN]` | `[FILL IN]` |
| Privacy claims match `../../privacy/data-map.md` on the recording date               | `[FILL IN]` | `[FILL IN]` |
