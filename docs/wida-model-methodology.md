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

WIDA publishes a concordance relating a MODEL Overall composite to a likely ACCESS score, described as valid for the 2025-26 window ([WIDA](https://wida.wisc.edu/resources/wida-model-and-access-ells-concordance-table)). Its values are **not** entered in `concordance.js`, so every lookup returns "No validated prediction is available for this combination of assessments." with the source link. Older mappings are never applied to the reset scale.

## Scenarios

`scenario.js` moves levels (clamped to 1.0-6.0, ±1.5) and scale scores (±60) by amounts the teacher chooses and recomputes composite scale scores with verified weights. Always labelled *Hypothetical*; never a prediction or a causal claim. The previous hours-of-intervention simulator was removed because it implied lessons cause a given gain.

## Instructional guidance

Findings come from the two lowest reported domains; wording and suggested tasks come from four level bands informed by WIDA proficiency level descriptors. They are starting points the teacher accepts, edits or sets aside.
