# E2E Test Report

**Date**: 2026-07-22

**Playwright version**: 1.61.0

**Base URL**: http://localhost:4178
**Browser tested**: Chromium (desktop)

## Summary

| Status | Count |
| --- | ---: |
| Passed | 145 |
| Failed | 0 |
| Flaky | 0 |
| Skipped | 0 |
| **Total** | **145** |

## Resolved Failures

| Area | Root cause | Resolution |
| --- | --- | --- |
| Student launcher | Assertion predated the student-safe query boundary | Assert the canonical `?student=1` link |
| Game smoke checks | Shared mission brief intercepted each game's vocabulary gate | Dismiss layered onboarding in sequence and wait for a rendered surface |
| Game smoke timing | Fixed delays exhausted the global timeout under parallel load | Use condition-based rendering checks and a scoped 45-second game budget |
| Study markup | Test targeted visually clipped child copy instead of the summary control | Add and use a stable `data-testid` on the interactive summary |
| Vocabulary definition | Test expected a retired reveal button | Assert the now-visible bilingual definition directly |
| Curriculum order | Print-only lesson details are intentionally detached while browsing | Restore the supported print DOM before auditing its order |
| Vocabulary accessibility | Text-bearing cards faded through low-contrast opacity states | Preserve full text opacity and animate position only |

## Quarantined Tests

None. No failing test was skipped, deleted, or marked `fixme`.

## Artifacts

| Type | Path |
| --- | --- |
| JSON results | `playwright-results.json` (generated, gitignored) |
| Failure screenshots/traces | `test-results/` (generated only on failure) |

## Additional Verification

- `npm test`: 50/50 test scripts passed.
- `npm run validate`: all validation gates passed.
- `npm run build`: production build passed.
- TypeScript compiler check was unavailable because this repository does not install the `tsc` binary; Playwright loaded the TypeScript configuration and all 145 TypeScript specs successfully.
