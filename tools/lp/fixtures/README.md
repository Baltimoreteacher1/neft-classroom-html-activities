# Negative controls for `npm run check:lp`

Every gate in `tools/lp/check.mjs` first runs its detector on one of these known-bad fixtures. The control must
FAIL; if it passes, the detector is broken and the gate reports FAIL even when the real site is clean.

| Fixture | Gate | Seeded defect |
| --- | --- | --- |
| `broken-link.html` | G-01 links | a link to a front-layer page that does not exist |
| (inline) | G-02 URL preservation | a baseline 200 URL that the new routing no longer answers |
| `fixture-axe.html` | G-03 axe | an image with no alt text, an unlabeled button, low-contrast text, an unlabeled input, a heading that skips two levels |
| `lighthouse-bad.json` | G-04 Lighthouse | a recorded result below every budget |
| `fixture-external.html` | G-05 network | a script and an image from another origin |
| `purple.css` | G-06 no purple | hex, rgb, hsl and named purple colors |
| `bad-set.json` | G-07 content | two correct answers, a missing misconception, a bad tag, duplicates, an answer much longer than every distractor, a glossary that defines the word an item asks about |
| `bad-math.json` | G-08 math | a keyed answer that does not equal its expression |
| `bad-export.html` | G-09 exports | an export that requests a CDN script and throws |
| `privacy-bad.html` | G-10 privacy | a tracker, a third-party fetch and a posting form |
| `no-disclaimer.html` | G-11 disclaimer | a practice page with no disclaimer |
| `missing-i18n.html` | G-12 i18n | an interface key that exists in neither language |
| `fixture-overflow.html` | G-13 visual | an element wider than a phone screen |
| (copied tree) | G-14 freshness | a generated page edited by hand |

These files are served only by the local check server (`/__fixtures/`), never by production.
