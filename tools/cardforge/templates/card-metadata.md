# Template — Card Metadata (reference)

CardForge renders `card.json` from the `card` block of a job file. The shape
mirrors a `data/curriculum-manifest.json` lesson entry (the live card schema)
plus staging fields. See `schemas/card.schema.json` for the authoritative
contract. Reference shape:

```json
{
  "id": "cf-demo-mmmr",
  "demo": true,
  "unit": 8,
  "lesson": "demo",
  "title": "Mean, Median, Mode, and Range",
  "topic": "statistics-and-data",
  "standard": "6.SP.3",
  "standardUncertain": false,
  "gradeLevel": "Grade 6",
  "difficulty": "easy",
  "objective": "I can find the mean, median, mode, and range of a data set.",
  "languageObjective": "I can explain which measure I used …",
  "description": "Short card description for the hub.",
  "timeEstimate": "~45 min",
  "tags": ["statistics-and-data", "6.SP.3", "grade-6"],
  "lessonPath": null,
  "previewPath": "/math/card-builder/sample/",
  "status": "draft",
  "qaStatus": "not-run",
  "createdDate": "YYYY-MM-DD"
}
```

Uncertainty is explicit: set `unit`/`lesson`/`standard` to `null` and the
matching `*Uncertain` flag to `true` rather than guessing.
