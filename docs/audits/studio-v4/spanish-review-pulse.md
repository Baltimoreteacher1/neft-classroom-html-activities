# Spanish review: Class Pulse (brief X1)

New strings only; nothing existing was changed. Shown to students on the exit card, in "My thinking" beside "Copy my results", and in the copied note.
The teacher page (`/teacher-tools/class-pulse/`) is English only by design.

| Where                               | Field                          | Old    | New                                                    | Why                                                                                                                                                   |
| ----------------------------------- | ------------------------------ | ------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exit card, My thinking              | label above the code           | (none) | Código de clase                                        | "class code": the short code a student gives the teacher                                                                                              |
| Exit card, My thinking              | note under the label           | (none) | No tiene tu nombre. Dáselo a tu maestro si te lo pide. | Tells the student the code has no name and is only for the teacher; "maestro" matches the site's other student text                                   |
| Exit card, My thinking              | copy button                    | (none) | Copiar código de clase                                 | Button text                                                                                                                                           |
| Exit card, My thinking              | button after copying           | (none) | Copiado ✓                                              | Confirmation                                                                                                                                          |
| Exit card, My thinking, copied note | Family Window heading          | (none) | Pregunta en casa:                                      | "Ask at home": introduces one question a family can ask                                                                                               |
| Exit card, My thinking, copied note | Family Window default question | (none) | ¿Puedes explicarme esta idea con tus propias palabras? | Used when the trap's quick fix does not already ask a question in both languages                                                                      |
| Exit card, My thinking, copied note | Family Window idea line        | (none) | La idea: + the trap's own `fixEs`                      | "The idea": the quick fix from `data/practice-studio/misconceptions.json`, unchanged. Those 256 `fixEs` lines were already reviewed with the taxonomy |
| Copied note                         | line label                     | (none) | Pregunta en casa: ¿...? La idea: ...                   | Same strings, on one plain-text line                                                                                                                  |

When a trap's quick fix already contains a question in BOTH languages (for example "Ask: would different people or cases give different answers?"), the question is lifted from the fix:
the English loses a leading "Ask:" and the Spanish keeps its own `¿...?` sentence. Only 11 of the 256 traps qualify (the fix asks the same number of questions in both languages, they are about the same length, and none is first-person self-talk), so most families see the default question above.
Please check these lifted questions read naturally; they are generated, not hand-written.
