# Unit project audit and overhaul — 2026-10-07

## Scope and acceptance criteria
Audit every published version (26), World Architect, and Statistics of My Life; make the new Project Studio the primary launch from the curriculum project directory and each unit project hub. Preserve old routes and existing work as companion workspaces. Add authentic practice projects for the current Discovery and Synthesis units.

Acceptance: all 30 routes resolve to authored missions; current curriculum unit placement is explicit; each mission has student choice, editable quantitative models, checked math, explanatory evidence, revision and a final artifact. Supported students retain all mathematical requirements. Local save, reload, export/import and printing work. No external research, accounts, student records or purchases are required. Browser checks cover all missions, small screens, keyboard use, incorrect answers, stale checks, corrupt/blocked storage, and export/import. Build, project regressions and repository validation are run before guarded publication.

## Findings from source and live audit
- The project fleet has 25–27 script layers per wizard. Launch choices, research, certificates, extra challenges and publication panels compete with the actual task.
- Unit 2's catalogue and metadata say Recipe Remix Bakery / Maker Workshop Cut List and fraction division, while the delivered pages are statistics investigations.
- Folder numbers predate the current course sequence: division projects belong with Pre-Unit/Unit 6; volume and nets belong with Unit 5. Discovery and Synthesis have no culminating-project launch in the current unit index.
- Some B versions reuse A-version copy (for example robotics has Ribbon and Trail Mix headings). Generic research and sample comparison helpers can distract from the project context.
- Level 0 can end after one response copied from its own worked example. It is not equivalent evidence of the unit's essentials.
- Open-ended products and student design decisions vary considerably. A series of calculators is not sufficient evidence of modeling, critique or revision.
- Existing saved-work keys and companion tools are valuable and must remain available.

## Implementation plan
1. Author one auditable mission catalogue with current course placement, scenario-specific design choices and essential math.
2. Build a responsive five-stage workspace with editable models, explanatory checks, evidence, revision, self-review, safe local saving and printable/downloadable reports.
3. Promote the studio through project galleries, unit hubs and current unit resources; repair stale metadata and copy.
4. Verify math independently, exercise browser flows and preservation contracts, build, review the diff, commit and use the approved ship script.

## Verification
- 30 authored studio missions; 26 version pages and two companions remain available at their original paths. Discovery and Synthesis now have dedicated projects.
- 180 independently calculated default answers plus boundary cases, mixed-number parsing, invalid input and stale-check rejection passed.
- All 30 studio missions exercised in Chromium: launch, mobile Build, wrong-answer recovery, six math checks, reload, baseline and Publish. 93 WCAG A/AA axe scans passed; keyboard flow and 720px (200% equivalent) reflow passed.
- End-to-end revision, correct backup restoration, wrong-project backup rejection, blocked/corrupt storage recovery, safe text rendering, report download and print passed. Printed PDF and desktop/mobile screenshots visually inspected.
- Final build and typecheck passed. All 30 built missions also passed the 180-answer/93-scan browser verification. Original-project regression: 77/78 initially passed; the remaining Unit 1 answer-key page omitted its existing presentation-helper script. The same helper used by the other server-authorized keys was restored, and that regression now passes (78/78 across the original run and targeted recheck).
- Full validation exposed a stale resource-search expectation and registry entry for a studio removed in main commit 5e1daf0be4. Removed that dead registry entry and updated the expectation while retaining search, audience, keyboard and data-safety assertions; all ten resource discovery tests and the curriculum audit pass. The staged download manifest passes its index-aware freshness check.
- Curriculum shared navigation, current unit placement, project publication/answer-check/award contracts and catalogue checks passed.
- Launch-page generation is idempotent and uses the repository's preservation helper to retain shared save/resume, mobile access and workbench controls. Save/resume and injection integrity checks pass. New JavaScript modules pass Biome. The browser verifier is included in the full release gate and runs in its exclusive browser-test lane.
- Release uses the existing guarded ship process: a clean checkout, full QA gate, main-branch integration, production commit-stamp verification and live smoke checks. Production results are reported after that process completes.

Limitations: automated accessibility scans plus visual/keyboard checks do not replace testing with students and assistive-technology users. Speech depends on browser/device support. Saved work is local; backups are required to move devices. Prior companion saves remain in their original workspaces. No automatic mastery grade is assigned to written explanations or physical products.


## Audited mission coverage

| Mission | Current course placement | Essential math | Earlier workspace preserved |
|---|---|---|---|
| Make Math Belong | Unit 1: Math Is Discovery | MPP.3, MPP.4, MPP.7 | New mission |
| Launch Day Supply Depot | Pre-Unit · Division | 6.NOS.1, 6.NOS.2, 6.NOS.3 | /math/pre-unit/projects/version-a/ |
| Block Party Planner | Unit 6: Expressions & Number Sense | 6.NOS.1, 6.NOS.2, 6.NOS.3 | /math/unit-1/projects/version-a/ |
| Build-a-Bot Budget Lab | Unit 6: Expressions & Number Sense | 6.NOS.1, 6.NOS.2, 6.NOS.3 | /math/unit-1/projects/version-b/ |
| Deep Space Supply Mission | Unit 6: Expressions & Number Sense | 6.NOS.1, 6.NOS.2, 6.NOS.3 | /math/unit-1/projects/version-c/ |
| Class Data Detective | Unit 2: Statistics | 6.DS.1, 6.DS.3, 6.DS.4, 6.DS.5, 6.DS.6c, 6.DS.6d | /math/unit-2/projects/version-a/ |
| Weather Decision Desk | Unit 2: Statistics | 6.DS.1, 6.DS.3, 6.DS.4, 6.DS.5, 6.DS.6c, 6.DS.6d | /math/unit-2/projects/version-b/ |
| Smoothie Bar Designer | Unit 3: Ratios & Rates | 6.AT.1, 6.AT.2, 6.AT.3a | /math/unit-3/projects/version-a/ |
| Sports Stats Scout | Unit 3: Ratios & Rates | 6.AT.1, 6.AT.2, 6.AT.3a | /math/unit-3/projects/version-b/ |
| Pop-Up Shop Owner | Unit 4: Percents | 6.AT.4, 6.AT.2 | /math/unit-4/projects/version-a/ |
| Smart Shopper Showdown | Unit 4: Percents | 6.AT.4, 6.AT.2 | /math/unit-4/projects/version-b/ |
| Dream Room Designer | Unit 5: Area, Surface Area & Volume | 6.GR.1, 6.GR.2, 6.GR.4 | /math/unit-5/projects/version-a/ |
| Room Makeover Budget | Unit 5: Area, Surface Area & Volume | 6.GR.1, 6.GR.2, 6.GR.4 | /math/unit-5/projects/version-b/ |
| Game Studio Scoring Engine | Unit 6: Expressions & Number Sense | 6.AT.5, 6.AT.6a, 6.AT.6c, 6.AT.7 | /math/unit-6/projects/version-a/ |
| App Pricing Engine | Unit 6: Expressions & Number Sense | 6.AT.5, 6.AT.6a, 6.AT.6c, 6.AT.7 | /math/unit-6/projects/version-b/ |
| Theme Park Map Designer | Unit 7: Integers & the Coordinate Plane | 6.NOS.6, 6.NOS.7, 6.NOS.8, 6.NOS.9 | /math/unit-7/projects/version-a/ |
| Submarine Mission Control | Unit 7: Integers & the Coordinate Plane | 6.NOS.6, 6.NOS.7, 6.NOS.8, 6.NOS.9 | /math/unit-7/projects/version-b/ |
| Escape Room Architect | Unit 8: Equations & Inequalities | 6.AT.8, 6.AT.9 | /math/unit-8/projects/version-a/ |
| Fundraiser Goal Tracker | Unit 8: Equations & Inequalities | 6.AT.8, 6.AT.9 | /math/unit-8/projects/version-b/ |
| Master Codebreaker | Unit 8: Equations & Inequalities | 6.AT.8, 6.AT.9 | /math/unit-8/projects/version-c/ |
| Channel Growth Lab | Unit 9: Two-Variable Relationships | 6.AT.11 | /math/unit-9/projects/version-a/ |
| Phone Plan Showdown | Unit 9: Two-Variable Relationships | 6.AT.11 | /math/unit-9/projects/version-b/ |
| Package Design Challenge | Unit 5: Area, Surface Area & Volume | 6.GR.2, 6.GR.4 | /math/unit-10/projects/version-a/ |
| Aquarium Build Lab | Unit 5: Area, Surface Area & Volume | 6.GR.2, 6.GR.4 | /math/unit-10/projects/version-b/ |
| 3D Geo-Architect | Unit 5: Area, Surface Area & Volume | 6.GR.2, 6.GR.4 | /math/unit-10/projects/version-c/ |
| Maker Club Data Story | Unit 2: Statistics | 6.DS.1, 6.DS.3, 6.DS.4, 6.DS.5, 6.DS.6c, 6.DS.6d | /math/statistics/projects/version-a/ |
| Community Data Investigation | Unit 2: Statistics | 6.DS.1, 6.DS.3, 6.DS.4, 6.DS.5, 6.DS.6c, 6.DS.6d | /math/statistics/projects/version-b/ |
| World Architect Expedition | Unit 5: Area, Surface Area & Volume | 6.GR.2, 6.GR.4 | /math/unit-10/projects/world-architect/ |
| Statistics of Everyday Life | Unit 2: Statistics | 6.DS.1, 6.DS.3, 6.DS.4, 6.DS.5, 6.DS.6c, 6.DS.6d | /math/statistics/statistics-of-my-life/ |
| Better Block Design Challenge | Unit 10: Math Is Synthesis | 6.GR.1, 6.AT.4, 6.AT.11 | New mission |
