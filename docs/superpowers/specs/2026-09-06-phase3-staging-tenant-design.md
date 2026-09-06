# Phase 3 Milestone 1 — Staging Tenant

**Date:** 2026-09-06
**Status:** Spec approved via delegation (Joel 2026-09-06: "Answer for me for phase 3");
implementation NOT started — infra steps below need Joel present.
**Parent:** `2026-09-05-phase3-decision-memo.md` (all five decisions recorded there)

## Goal

A second, synthetic tenant ("staging") running the real teaching slice — lessons,
present mode, save/resume, pacing — with provable isolation from the live classroom's
data. This is Decision 1(c): the isolation test that costs nothing human, built before
any colleague is invited.

## Architecture (locked by the five decisions)

- **Tenant registry:** `data/tenants.json` — id, display name, D1 binding name,
  status (`staging` | `active` | `offboarded`). Single source of truth; tenant ids are
  URL-safe slugs.
- **URL namespace:** everything tenant-scoped lives under `/t/<tenant-id>/…` — a NEW
  namespace, so no existing URL changes what it answers (route-contract stays
  untouched; the new routes get pinned into it when they exist).
- **Teacher surfaces** (`/t/<id>/teach/…`): behind Cloudflare Access (Google
  sign-in), enforced at the CF edge per Decision 4. The existing Basic-auth path and
  the six auth-pinned files are not modified — Access is a parallel door in front of
  a new namespace, checked by `validate:auth-contract` remaining green untouched.
- **Students** join at `/t/<id>/join` with a class code (registry-held, rotatable)
  and an alias — Decision 3's no-PII boundary. Save/resume keys become
  tenant-scoped (`t:<id>:` prefix in the client key space).
- **Data:** one D1 database per tenant (Decision 5), bound as
  `TENANT_DB_<UPPER_ID>`; a small resolver maps tenant id → binding and 404s
  unknown tenants. The live classroom's `neft-student-progress` DB is NEVER bound
  into tenant endpoints — isolation by construction, not by WHERE clause.
- **Curriculum:** tenants teach the same built lessons (same dist). Tenant-ness is
  routing + data, not content, in this milestone.

## Isolation proof (the milestone's exit test)

An e2e (`e2e:tenancy`) that: writes progress as a staging student → asserts it lands
in the staging DB and NOT in production tables; writes as a live-classroom student →
asserts staging DB stays empty; hits `/t/staging/teach` anonymously → asserts the
Access challenge; hits every pre-existing pinned route → asserts `validate:route-contract`
still passes bit-for-bit.

## Infra steps that wait for Joel at the keyboard

Creating the staging D1 database, adding its binding to the Pages project, and
creating the CF Access application for `/t/*/teach*` are account-level production
infrastructure — they get done together in one sitting with me driving and Joel
watching, not fired off unattended. Everything else (registry, resolver, join flow,
tenant-scoped save/resume, the e2e) can be built and gated in the repo first with the
resolver falling back to a local-only mock binding.

## Out of scope for milestone 1

Real colleague onboarding, tenant pacing UI (milestone 2 — reuses the planner against
the tenant DB), tenant gradebook views, any generator work, any content generation.
