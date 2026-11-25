# Language Page decisions — 2026-11-24

Recorded from Joel's answers to the Stage 0 questions of `award-program-prompt.md`. Each is also in `data/product-decisions.json`;
this file is the pin that `tools/product-decisions.test.mjs` checks. Joel answered by choosing one of the options put to him
(quoted in the registry), not in free text.

## lp-no-third-party-analytics
Remove the Cloudflare Web Analytics beacon from thelanguagepage.com only, keep the first-party aggregate /api/signal, and keep the privacy text ("no third-party analytics or trackers") true. eduwonderlab.com is untouched.

## lp-sibling-apps-keep-urls-stop-featuring
Keep every /language-studio/ and /language-adventures/ URL answering exactly as now; stop featuring them in the lab navigation and sitemap; no redirects; rebuilding them into the lab is a later task.

## lp-site-name-the-language-page
The masthead, page titles and share cards use one name, "The Language Page", with the plain promise line "English for school, in your language, K–8"; "ACCESS Practice Lab" names one section, the test-practice area.

## lp-deploy-in-tranches
Deploy finished tranches through `ALLOW_DEPLOY=1 npm run ship` once every gate is green, confirm with `npm run smoke:live`, and stop and ask before any change to what an existing URL answers.
