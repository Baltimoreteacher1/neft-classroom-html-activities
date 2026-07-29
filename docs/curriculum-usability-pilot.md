# Curriculum usability pilot

## Purpose

Test whether students and teachers can reach the right curriculum action without coaching. This is a short classroom pilot, not research on individual students. Do not record names, IDs, disability status, grades, voices, video, or screen recordings.

## Participants and timing

- Five students and three teachers who have not used the current hub recently.
- 10–12 minutes per participant on the device they normally use.
- Identify sessions only as `S1`–`S5` or `T1`–`T3`.

## Student tasks

1. From `/curriculum/`, find Prime Factorization and start the lesson.
2. Return to the hub and find a project you would want to try.
3. Explain where you would go to continue work from an earlier visit.

Success target: at least four of five students complete every task without facilitator help, with no more than three deliberate actions per task.

## Teacher tasks

1. Enter Teacher Mode and open **Teach today**.
2. launch Lesson 1-1 for students.
3. Build a two-lesson student playlist.
4. Locate learning supports for a student who needs more scaffolding.

Success target: all three teachers complete the first three tasks without help and at least two locate supports without help.

## Facilitation script

Say: “This is a test of the website, not of you. Please think aloud. I will not help unless you are stuck for 30 seconds. You may stop at any time.”

For each task record only:

- completed: yes/no;
- deliberate actions;
- facilitator help: yes/no;
- one short observation without names or student work;
- ease rating from 1 (hard) to 5 (easy).

## Decision rules

- Fix a blocker before adding features when two participants fail the same task.
- Prioritize discoverability when tasks succeed but require too many actions.
- Prioritize comprehension when participants reach the correct page but cannot explain the next action.
- Do not generalize from a single participant.
- Re-run the affected task after a change with at least two new participants.

## Automated baseline

The pull-request gate covers the same high-risk journeys with Playwright:

- student-safe hub and mobile layout;
- teacher **Teach today** and **Plan the week** routing;
- lesson launch and responsive lesson navigation;
- score bridge and accessibility contracts.

Automation verifies that a route works; the human pilot determines whether people can find and understand it.

## Result template

| Session | Role | Device | Task | Complete | Actions | Help | Ease | Observation |
| --- | --- | --- | --- | --- | ---: | --- | ---: | --- |
| S1 | Student | Chromebook | 1 | Yes | 2 | No | 4 | Example only—replace this row. |

Remove the example row before recording a pilot. Summarize patterns; do not commit raw observations that could identify a participant.
