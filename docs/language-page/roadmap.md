# Roadmap and out-of-scope

## Out of scope for this build

Accounts, class codes, rosters, teacher reports, backend or cloud storage, LTI / Clever / ClassLink integration, and grades 9–12. Progress is local-first on the device. Grade bands stay exactly K, 1, 2–3, 4–5, 6–8 as scoped in the brief. (The catalog's content folders are `gK`, `g1`, `g2-3`, `g3-5`, `g6-8`; whether "4–5" vs the catalog's "3–5" band is a rename or a content change is an open item, see below.)

## Phases

P0 baseline and inventory · P1 information architecture · P2 home, trust surfaces, brand · P3 design system, motion, sound · P4A WIDA/ELD depth · P4B phonics / science of reading · P4C language, vocabulary, writing · P4D curriculum and teacher materials · P5 student flows · P6 engineering · P7 performance and SEO · P8 accessibility, QA, compliance · P9 evidence and award readiness.

Each phase ends with `reports/language-page/panel-<phase>.md`. A phase closes only when every applicable reviewer scores at least 8.

## Open items

- Grade bands: the brief says K, 1, 2–3, 4–5, 6–8. The shipped catalog uses `3-5` (content) while the teacher entry points offer "grades 3–5 and 6–8". Needs a decision before P1 changes any label: relabelling is presentation, re-banding content is not allowed by the content-protection rule.
- Placement for pre-literate older newcomers (P4B) needs content that does not exist yet. It ships as a tagged gap in human-required, not invented.
