# Family Math Studio: Spanish style guide (v3.0)

Audience registers, one per audience, never mixed inside a card:

| Audience | Register | Examples |
| --- | --- | --- |
| Student (buttons, prompts, hints, game text) | tú, informal imperative | Toca, Elige, Escribe, Mira, Intenta otra vez |
| Adults (grown-up panel, tips, kitchen-table, "say / don't say") | ustedes, plural imperative | Pregunten, Escuchen, Eviten, Elijan |
| Never | usted, voseo (vos), "vosotros" | no *Pregunte*, *Escuche*, *mirá* |

Rules

1. US Spanish. Decimal point (`0.6`), thousands with a comma (`1,200`), money `$42`. Percent has NO space: `60%`.
2. One term per concept, from the Reveal Spanish glossary (`lessons/<id>/config.json` `termEs`). The whole = **el total** (never *el entero*, never *del todo*). part = **la parte**, percent = **el porcentaje**, ratio = **la razón**, equation = **la ecuación**, inverse operation = **la operación inversa**, double number line = **la recta numérica doble**.
3. No doubled labels ("Parte / Parte"): when the English and Spanish term match (e.g. *Área*), show it once.
4. No literal idiom translations. "Be the Teacher: Spot the Glitch" is *Sé el maestro: encuentra el error*; "Print-to-Fridge" is *Para pegar en el refri*; "kitchen table" is *en la mesa*.
5. No Spanglish. Math words that are really the same in Spanish stay (*razón*, *porcentaje*).
6. Spanish runs about 30% longer: write short sentences, one idea each, <= 15 words where possible, grade 5 reading level.
7. Verbs and symbols: ×, ÷, −, fractions as 3/4. Spoken math: say "por" for ×, "entre" for ÷.
8. Questions use ¿ ? and exclamations ¡ !; quotations use « » only for spoken lines.
9. Do not claim native-speaker review. `npm run export:family-spanish-review` writes the CSV for Joel's reviewer.
