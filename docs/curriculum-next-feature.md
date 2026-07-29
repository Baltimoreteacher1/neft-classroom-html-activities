# Curriculum next-feature decision

Decision date: 2026-07-29

## Selected next feature

**Project Readiness Paths** — connect each high-use culminating project to a short prerequisite check, the smallest relevant lesson/practice route, and a clear return to the project.

This is a routing and learning-continuity improvement, not another standalone content collection.

## Evidence

The read-only production usage review found:

- 524 lesson telemetry events across 67 lesson slugs;
- only 41 of 222 lesson folders with recorded activity;
- 183 lesson folders with no recorded activity;
- the two most-used experiences were Unit 1 projects;
- six of the 20 most-used experiences were culminating projects;
- only three of 117 playable game pages had recorded scores.

The automated usability baseline also confirms that student launch, teacher planning, playlist creation, responsive navigation, and accessibility work. The larger opportunity is helping people move from the experiences they already choose into the instruction they need.

Telemetry is a lower bound and predates some instrumentation. It supports a pilot decision, not deletion of quiet lessons.

## Candidate scorecard

Scores use 1 (low) to 5 (high). Priority is `(student need + teacher need + evidence + learning impact + accessibility) / effort`.

| Candidate | Student need | Teacher need | Evidence | Learning impact | Accessibility | Effort | Priority |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Project Readiness Paths | 5 | 4 | 5 | 5 | 4 | 3 | 7.67 |
| More standalone games | 3 | 2 | 2 | 3 | 3 | 5 | 2.60 |
| More lesson content | 2 | 2 | 1 | 3 | 3 | 5 | 2.20 |
| Expanded teacher analytics | 3 | 5 | 3 | 4 | 3 | 4 | 4.50 |

## Acceptance criteria for the feature

- Every project names two to four prerequisite skills.
- A student can reach a prerequisite check in one action from the project.
- The result routes to one relevant practice activity or directly back to the project.
- The route stores no names, IDs, or responses on the server.
- Keyboard, mobile, ESOL, and reduced-motion behavior pass existing gates.
- The human pilot in `docs/curriculum-usability-pilot.md` validates the labels before broad rollout.

## Review trigger

Re-score after the first completed five-student/three-teacher pilot or after 28 days of Core Web Vitals and field-error data, whichever comes first.
