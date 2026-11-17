# Forecasting and analysis methodology

## What is implemented

- **Descriptive baseline:** reported levels, observed change between comparable results, robust class summaries (median, quartiles). With two observations the studio shows observed change only, never a trajectory.
- **Measurement context:** when scale scores and their standard errors are on file, a change or a domain gap counts as beyond measurement error only if it exceeds 1.96 × √(SE₁² + SE₂²).
- **Forecasts (existing engine, `access-practice-lab/src/predict/`):** persistence and level-adjusted-growth baselines, a shrunk individual trend (empirical-Bayes-style weight n/(n+k)) and ridge regression. Intervals come from out-of-fold residuals.
- **Validation gate (`validate.js`):** student-level separation **and** temporal split (test outcomes are the latest year); transitions across the scale reset are dropped; a model is "validated" only with ≥400 training and ≥200 test transitions, 80% interval coverage within 72-88%, calibration error ≤ 0.06, and (for a non-baseline model) ≥3% MAE gain over persistence. Otherwise **no number is shown** and the reason is.
- **Cut-score guard (studio):** only levels on the target year's cut-score version feed a forecast.

Methods listed in the brief but **not** implemented (hierarchical, mixed-effects, Bayesian posterior, quantile, nonlinear, ensembles): with one teacher's class on one device there is no training population large enough to validate them, and the gate would withhold them anyway. The registry (`MODEL_REGISTRY`) records them as not implemented.

## Training data

Real mode trains on the teacher's own roster only, which is far below the minimums, so real forecasts are withheld. Demo mode trains on a documented synthetic cohort (`synthetic.js`); its validation proves the machinery works, **not** that the models predict real students. No independent validation on real data has been done.

## MODEL to ACCESS

`concordance.js` holds WIDA's published table ("Using WIDA MODEL scores to predict performance on ACCESS for ELLs", WIDA TR-2019-4, released April 2019; values copied from [WIDA's PDF](https://wida.wisc.edu/sites/default/files/resource/MODEL-ACCESS-Concordance-Table.pdf) on 2026-11-17 and checked row by row). It maps a **MODEL Online Overall Composite scale score** to a predicted **ACCESS Overall proficiency-level range**, grades 1-12, at anchors PL 2.0 / 3.0 / 4.0 / 4.5. Between two listed scores the estimate spans both ranges (WIDA's own instruction).

Applied only when: MODEL Online (not Paper or Kindergarten), grade 1-12, an Overall scale score is on file, and the MODEL result is from **before 2025-26** (WIDA marks the table as published before the ACCESS revision). Never outside the table (WIDA reports no reliable predictions below PL 2.0 or above 4.5). Otherwise: "No validated prediction is available for this combination of assessments." with the reason and the table for reference. Caveats shown with every estimate: same-day assumption, wider error with time between tests, a range not a score.

## Scenarios

`scenario.js` moves levels (clamped to 1.0-6.0, ±1.5) and scale scores (±60) by amounts the teacher chooses and recomputes composite scale scores with verified weights. Always labelled *Hypothetical*; never a prediction or a causal claim. The previous hours-of-intervention simulator was removed because it implied lessons cause a given gain.

## Instructional guidance

Findings come from the two lowest reported domains; wording and suggested tasks come from four level bands informed by WIDA proficiency level descriptors. They are starting points the teacher accepts, edits or sets aside.
