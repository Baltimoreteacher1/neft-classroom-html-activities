# Award entry kit (DRAFT)

**Status, 2026-11-27.** A preparation file, not an application. **Nothing has been submitted, registered or paid for, and nothing will be
without Joel's decision (D10, `award-program-prompt.md`).** Two parts: what each program asks (not yet confirmed from the official
pages) and what this site can and cannot show today (checked against files in this repository).

## 1. The programs: what is and is not confirmed

The research session could not open any official site (the cloud container's network blocks them). Every row below comes from search
summaries of the official domains. **Treat each as "confirm on the official page before relying on it", including dates and fees.**
No ELD-specific award from TESOL, NABE or WIDA was found; absence is not proven.

| Program | What the summaries said | Still to confirm on the official page |
| --- | --- | --- |
| Tech & Learning Awards of Excellence, "Best of 2026" | Deadline 11:59 PM ET, 2027-01-08. For products launched, relaunched or significantly upgraded in 2026. Categories Primary (K-6), Secondary (7-12), Higher Ed. | Fee (an earlier 2026 contest charged $525-$625 per entry), required materials, and whether this site counts as "launched or significantly upgraded in 2026" (Joel's call) |
| EdTech Awards (EdTech Digest) | The 2027 cycle is closed; the next window opens summer 2027; groups Cool Tool, Leadership, Trendsetter | Fee, subcategories, evidence required |
| CODiE Awards | No longer run by SIIA; new home codieawards.com | Everything for the 2027 cycle |
| EdTech Breakthrough | Product public after 2023-01-01; criteria Innovation, Performance, Ease of Use, Functionality, Value, Impact; an accessibility and inclusive-learning group | Fee, deadline, categories, evidence |
| ISTE Seal | 2025 FAQ: $5,000 review plus a license; mature products; a slide deck aligning indicators with screenshots or short videos | Whether the fees are current, whether a free product gets a waiver, deadlines |
| Digital Promise, Learner Variability certification | At least six learner-needs features, at least two user-adjustable, public explanation of how the product supports learner variation, input from educators and diverse learners | Fee, whether intake is open, whether input from learners is needed first |
| Digital Promise, Research-Based Design | One page showed $650 | What documentation it needs, whether it needs a study |
| Common Sense Privacy Program | A free privacy-policy evaluation is offered; a Seal uses a rubric of more than 200 questions | Seal fee and eligibility |
| 1EdTech TrustEd Apps | Certification only for 1EdTech members | Dues, whether an ACR is required |

## 2. What this site can show today

Each item names the file that holds it, so an entry can be written from the repository and not from memory.

| Evidence | Where | Honest limits |
| --- | --- | --- |
| No ads, no third-party analytics, measured in a browser | `tools/validate-language-page-network.mjs` (`--live`); `data/language-page-third-parties.json`; the claim is C-004 in `claims-ledger.md` | The gate measures requests, not every possible future change |
| What is stored, who sees it, how to delete it | `privacy.md` (generated from the privacy page) | Not reviewed by counsel (H-08) |
| Accessibility conformance statement | `acr.md` | A draft self-assessment. No NVDA or VoiceOver pass and no third-party audit has been done (H-10). axe runs clean in the lab's browser tests |
| Every AI route, what it sends, returns and stores | `ai-model-cards.md`, drift-tested | No accuracy or red-team evaluation exists |
| How an activity is built and how help fades | the `/method` page; `logic-model.md` | A description of design, not a result |
| Support for learner differences (relevant to a learner-variability review) | read-aloud, bigger text, calm colors and high-contrast theme, English/Spanish/both directions, no timers in daily practice, frames that fade to "on my own" (`/accessibility`, `/method`) | A feature list. No learner or educator input has been collected yet (H-09) |
| Standards alignment, measured | `coverage-matrix.md` | 42.2% of 933 activities carry a Key Language Use; tags are unreviewed (H-03) |
| Claims discipline | `claims-ledger.md`, `tools/access-lab-claims.test.mjs` | |

## 3. What this site cannot show yet

| Missing | Why it matters to a jury | What fixes it |
| --- | --- | --- |
| Any evidence of learning gains | Most programs weigh impact | A pilot (`efficacy-plan.md`, `pilot-kit.md`); nothing has been run |
| A third-party accessibility audit or screen-reader notes | Inclusive-design criteria and any ACR review | H-10 |
| Recorded human audio with captions | Listening quality | H-19 |
| Reviewed Spanish and reviewed WIDA tags | Credibility for ELD and bilingual juries | H-03, H-05 |
| Educator and learner input | Learner-variability and usability criteria | H-09, `usability-protocol.md` |

## 4. Readiness by program (an opinion, to be re-read after the official pages are confirmed)

- **Tech & Learning "Best of 2026"** is the only program with a deadline inside two months. The open questions are eligibility (what was launched or
  significantly upgraded in 2026) and the fee. If Joel wants to enter, the entry can be written from section 2 alone; it should not claim impact.
- **Common Sense free privacy evaluation** needs only a public privacy policy; the privacy page and `privacy.md` exist.
- **Digital Promise Learner Variability** matches the design (adjustable supports) but asks for educator and learner input that does not exist yet.
- **ISTE Seal** is a paid review with a large fee; it is a budget decision, and its criteria include inclusivity evidence that section 3 says is missing.
- **EdTech Awards, CODiE, EdTech Breakthrough** need their pages confirmed first; the EdTech Awards window is closed until summer 2027.

## 5. Rules for any entry
1. Joel decides which programs and submits; nothing is entered, paid for or registered by anyone else.
2. Every claim comes from `claims-ledger.md` with its evidence; no claim of learning gains, official alignment or review that has not happened.
3. Say plainly that this is practice aligned to WIDA domains, not an official WIDA or ACCESS product.
4. Re-confirm each program's current criteria, fee and deadline on its official page on the day of writing.

## 6. What Joel decides
Which programs to pursue (D10); whether to pay any fee; whether the site counts as "launched or upgraded in 2026" for Tech & Learning; and whether to
run the pilot first so a later entry can show evidence.
