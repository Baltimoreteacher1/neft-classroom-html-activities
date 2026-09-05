# Phase 3 Decision Memo — Multi-Tenancy

**Date:** 2026-09-05
**Status:** AWAITING JOEL — nothing in this memo is decided; each section ends with the
question and a recommendation. Answering the five questions (15 minutes) unblocks the
Phase 3 design cycle.
**Parent:** `2026-09-05-engine-extraction-design.md` (Phase 3 of: Extract → Manifest-ize →
Tenant #2 → Foreign curriculum)

## Where the platform stands

The prerequisites Phase 3 needs are done and live: the engine is a package
(`@eduwonderlab/engine`) with an enforced import boundary; curriculum access flows
through one seam (`tools/lib/curriculum-source.mjs`) that already supports source
redirection (`REPO`); structure loads through `loadCurriculumManifest()`; and the
gate suite (109 checks + parity harness) protects every change. What's missing is not
plumbing — it's five decisions only you can make.

## Decision 1 — Who is tenant #2?

The whole next phase is shaped by the first real user. Options:

- **(a) A BCPS Grade 6 math colleague** — same curriculum, same pacing. Cheapest
  possible test: zero content generation needed, pure tenancy (their roster, their
  telemetry, their gradebook). Risks: proves tenancy but not curriculum portability.
- **(b) A teacher on a different grade/curriculum** — forces the manifest schema and
  content generation to be real immediately. Much bigger lift; failure modes multiply.
- **(c) Yourself, as a second synthetic tenant** — a "staging tenant" with fake
  rosters. Proves isolation with zero human risk, but nobody's real feedback.

**Recommendation: (a), with (c) built first as the isolation test.** A colleague you
talk to daily is the highest-signal, lowest-risk first user, and (c) costs almost
nothing on the way.

**Question for you:** do you have a specific colleague in mind, and have you floated it
with them?

## Decision 2 — What does tenant #2 actually get in v1?

- **(a) Read-only teaching**: their class uses your lessons; they get present mode,
  student save/resume, and their own gradebook/telemetry. No authoring, no
  customization.
- **(b) (a) + pacing**: they set their own calendar/pacing against your curriculum.
- **(c) (a) + authoring**: they can edit/generate content. This drags the whole
  generator fleet into multi-tenancy and is not a v1.

**Recommendation: (b).** Pacing is already data-driven per the planner work; teaching +
their own pacing is a complete, honest product slice.

**Question for you:** anything in (b) you'd cut, or anything missing a colleague would
refuse to start without?

## Decision 3 — Student data posture (the gating one)

Their students' data lands in your systems. Options:

- **(a) Class-code / no-PII model**: students join with a class code and a
  self-chosen or teacher-assigned alias; no names, no emails, no rosters stored.
  This is the Blooket/Desmos-style posture that avoids most FERPA/COPPA surface and
  matches how your save/resume already works (`?sn=` names are already display
  strings, not accounts).
- **(b) Real rosters**: names/ids synced from the teacher. Real product value
  (gradebook fidelity) but puts you in data-agreement territory with BCPS — a
  conversation with the district, not just code.

**Recommendation: (a) for tenant #2, explicitly documented as the boundary.** If the
platform ever goes past friendly colleagues, (b) becomes a district-level conversation
you should not have as a side project.

**Question for you:** are you comfortable holding even alias-level student activity for
another teacher's class on your Cloudflare account, and is a heads-up to anyone at
school warranted before tenant #2 starts?

## Decision 4 — Auth and identity for teachers

Today: single-teacher HTTP Basic (frozen at `auth-known-good`, content-pinned).
Multi-teacher requires real accounts. Options:

- **(a) Cloudflare Access with Google sign-in** for teacher surfaces — no password
  storage, per-teacher identity, and you already operate CF Access.
- **(b) App-level accounts** (email+password in D1) — full control, but you own
  password security forever.
- **(c) Per-tenant secret links/codes** — weakest, fastest; fine for tenant #2 only,
  dead end beyond that.

**Recommendation: (a).** It composes with the existing frozen model (your Basic-auth
path stays untouched for you; Access fronts the new tenant surfaces), and the
auth-contract gate's "never rewrite working auth" lesson argues for adding a parallel
path, not rebuilding yours.

**Question for you:** OK putting tenant teacher surfaces behind Cloudflare Access with
their Google accounts?

## Decision 5 — Where tenant data lives

- **(a) Same D1 database, `tenant_id` column** on progress/gradebook tables —
  simplest migration, weakest isolation (a query bug leaks across tenants).
- **(b) D1 database per tenant** — strong isolation, trivial deletion ("offboard =
  drop database"), slightly more ops. Bindings are per-worker, so a small routing
  layer is needed.

**Recommendation: (b).** With student data involved, isolation-by-construction beats
isolation-by-WHERE-clause, and tenant count will be single-digit for a long time.

**Question for you:** any objection to one-database-per-tenant on your Cloudflare
account?

## What happens after you answer

Answers in hand, the Phase 3 design cycle runs the normal path: spec (tenancy model,
auth integration, data migration, the staging-tenant isolation test), plan, then
implementation in parity-gated waves — with the standing rule that nothing
student-facing or auth-touching ships without your explicit go on that specific change.

## Explicitly NOT in Phase 3

Foreign-curriculum content generation (Phase 4), billing/marketing of any kind, any
change to your own classroom's auth path, and any PII beyond the class-code model
unless you choose Decision 3(b).
