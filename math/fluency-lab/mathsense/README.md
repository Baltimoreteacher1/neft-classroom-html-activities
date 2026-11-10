# MathSense

Route: `/math/fluency-lab/mathsense/` (direct URL only; no home or nav card is registered). Optional links: `?lang=es`, `?mission=<id>`.

A linked-representation workspace for fractions, decimals and percents (Grades 4-8). One exact-rational state drives a fraction bar (any cut from halves to hundredths), a number line, a decimal grid, a percent bar and a statement panel. Edit any one (pointer, keyboard stepping, typed fraction, mixed number, decimal or percent) and the others change at once. Compare mode puts a second quantity on every picture. 27 missions (9 per band: Grades 4-5, 6, 7-8), a "Notice and explain" sentence, English and Spanish.

## Files

| File                                | Job                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `exact.js`                          | BigInt rationals, exact parsing (`0.(3)`, `75%`, `1 3/4`, `0,5`), decimal/percent text that shows repeating blocks, benchmarks |
| `model.js`                          | the one state (A, B, cuts, active quantity), stepping, snapping, save and restore                                              |
| `readouts.js`                       | every statement and the one live-region message                                                                                |
| `draw.js`                           | the four pictures as SVG (A solid, B striped)                                                                                  |
| `missions.js`, `missions-check.js`  | 27 missions as data; marking by value, named slips, graduated hints                                                            |
| `progress.js`, `store.js`           | independent versus supported rule, device record, hand-off to `tutor-engine.recordAnswer`                                      |
| `ui-*.js`, `main.js`, `announce.js` | DOM: workspace, missions, notice and explain, the single polite live region                                                    |
| `../i18n-es-mathsense.js`           | Spanish table, merged by one line in `../i18n-es-lab4.js`                                                                      |

## Evidence rules

The first hint-free check of a mission is independent. A hint, a retry after a miss, or a repeat of a finished mission is supported (filed with `independent:false`, so the mastery model gives it a quarter of the credit). Each mission names the nearest existing Fluency Lab skill (`skill` in `missions.js`). Records go to the learner slot's `ewl-fluency-tutor-v2` on this device; the learner's sentences stay in `fluencyMathSense:v1` and are not part of the evidence record. Nothing is sent anywhere.

## Verification

```
node --test math/fluency-lab/mathsense/exact.test.mjs math/fluency-lab/mathsense/content.test.mjs
node math/fluency-lab/mathsense/mathsense.browser.test.mjs      # MS_SHOTS=<dir> saves screenshots
```

`exact.test.mjs` and `content.test.mjs` judge every candidate answer with `scripts/lib/rational.mjs` as an independent oracle, brute-force each mission, prove no hint or feedback line contains an answer, and prove the detectors fire (mutation block). The browser test drives the whole flow in Chromium, with axe at 375 and 1440.

## Known limits

- Missions are a finite authored set, so independent evidence is available once per mission.
- Amounts run from 0 to 5; typed values outside that are refused with a reason.
- Spanish has had no native-speaker review.
