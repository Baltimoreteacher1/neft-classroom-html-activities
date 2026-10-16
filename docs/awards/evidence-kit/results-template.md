# Results template

Fill this in only from real data produced under `measurement-plan.md`. Every `[FILL IN: ...]` is empty on
purpose. If a field has no data, write "not collected" and keep the row. Do not delete the limitations.
Do not paste a number here that is not in a data file listed in section 8.

Status: `[FILL IN: draft / reviewed by whom / date]`

## 1. Context

| Item                                     | Value                                            |
| ---------------------------------------- | ------------------------------------------------ |
| Teacher and school                       | `[FILL IN]` (name only if permission is on file) |
| Grade and course                         | Grade 6 mathematics                              |
| Sections and number of students enrolled | `[FILL IN]`                                      |
| Unit and standards measured              | `[FILL IN]`                                      |
| Dates (pre, unit, post)                  | `[FILL IN]`                                      |
| What students and families were offered  | `[FILL IN: which site features, which routes]`   |
| District approval reference              | `[FILL IN]`                                      |

## 2. Participation

| Measure                          | Count       | Note                             |
| -------------------------------- | ----------- | -------------------------------- |
| Students enrolled                | `[FILL IN]` |                                  |
| Pre-check completed              | `[FILL IN]` |                                  |
| Post-check completed             | `[FILL IN]` |                                  |
| Both (analysis sample)           | `[FILL IN]` | Reasons for missing: `[FILL IN]` |
| Families who returned permission | `[FILL IN]` |                                  |

## 3. Item-bank check

Forms used: `[FILL IN: standards, form assignment, counterbalance]`.

| Standard    | n           | Pre % correct | Post % correct | Change (points) | 95% interval |
| ----------- | ----------- | ------------- | -------------- | --------------- | ------------ |
| `[FILL IN]` | `[FILL IN]` | `[FILL IN]`   | `[FILL IN]`    | `[FILL IN]`     | `[FILL IN]`  |
| Overall     | `[FILL IN]` | `[FILL IN]`   | `[FILL IN]`    | `[FILL IN]`     | `[FILL IN]`  |

Paired effect size: `[FILL IN]`. Method: `[FILL IN: as frozen in the plan]`. Subgroup cells under 5
students are suppressed: `[FILL IN: yes/no]`.

## 4. Section comparison (only if run)

|                    | Section A   | Section B   |
| ------------------ | ----------- | ----------- |
| The one difference | `[FILL IN]` | `[FILL IN]` |
| n                  | `[FILL IN]` | `[FILL IN]` |
| Pre mean           | `[FILL IN]` | `[FILL IN]` |
| Post mean          | `[FILL IN]` | `[FILL IN]` |
| Change             | `[FILL IN]` | `[FILL IN]` |

Difference in change and interval: `[FILL IN]`. Pre-check gap between sections: `[FILL IN]`. Was
the other section offered the same thing afterwards: `[FILL IN]`.

## 5. Site activity (aggregate)

| Measure                                          | Value       | Source and date range               |
| ------------------------------------------------ | ----------- | ----------------------------------- |
| Family practice opens, posted week               | `[FILL IN]` | `/api/signal/practice`, `[FILL IN]` |
| Family practice opens, library                   | `[FILL IN]` | same                                |
| Practice attempts in unit (anonymized telemetry) | `[FILL IN]` | `telemetry-anon.json`, `[FILL IN]`  |
| Most frequent misconception tags                 | `[FILL IN]` | same                                |
| Page views of the unit's pages                   | `[FILL IN]` | `/api/signal/usage`, `[FILL IN]`    |

## 6. Voices (only with signed permission on file)

| Who (as permitted) | Quote, verbatim | Permission form id | Date        |
| ------------------ | --------------- | ------------------ | ----------- |
| `[FILL IN]`        | `[FILL IN]`     | `[FILL IN]`        | `[FILL IN]` |

## 7. Limitations (required, edit but never remove)

- One teacher, `[FILL IN]` sections, one unit. Not a controlled trial.
- Sections were not randomly assigned. `[FILL IN: how they were assigned]`
- Items are public and some students may have seen them in lessons. `[FILL IN: exposure notes]`
- Students who did not take both checks are not in the analysis. `[FILL IN: how they differ]`
- Telemetry is keyed by typed name and can merge or split students.
- `[FILL IN: anything else that could explain the change, such as a different pacing or a holiday]`

## 8. Claims ledger

Each public claim must appear here with its data file. A claim with no row does not go in an entry.

| Claim, exactly as it will be written | Data file and cell | Checked by  | Date        |
| ------------------------------------ | ------------------ | ----------- | ----------- |
| `[FILL IN]`                          | `[FILL IN]`        | `[FILL IN]` | `[FILL IN]` |
