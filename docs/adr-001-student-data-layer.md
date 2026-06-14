# ADR-001: Federate the student data layer — do NOT merge the D1s

**Status:** Proposed (awaiting Joel's approval before any code)
**Date:** 2026-06-14
**Context source:** [data-layer-map.md](./data-layer-map.md)

## Context

There are four separate D1 databases across the Neft Teacher backends:

| Store                   | Domain                 | SoT for                          | Consumer                               |
| ----------------------- | ---------------------- | -------------------------------- | -------------------------------------- |
| `neft-student-progress` | progress / save-resume | what a student has done          | the save/resume engine on ~975 lessons |
| `neft-results`          | assessment results     | how a student performed on tasks | results dashboards                     |
| `edupulse-gradebook`    | gradebook scores       | grades                           | gradebook UI                           |
| `neft-hub`              | staff-ops              | staff/admin data                 | School Hub (staff-only)                |

The open question was whether to consolidate them into one student-data store.

## Decision

**Keep all four databases. Do not merge them.** Each remains the single writer /
source of truth for its own domain. To get a "unified view," build a thin
**read-only aggregation endpoint** that queries across them — federation, not
consolidation.

## Why

- **The save/resume engine is load-bearing and works.** `neft-student-progress`
  backs save/resume on ~975 lessons. A schema migration there risks silent data
  loss across the entire site — high blast radius, no upside.
- **The stores have different access patterns and deploy independently.** Merging
  couples them: one bad migration or deploy takes down all of it.
- **Different consumers, different lifecycles.** Gradebook scores (authoritative,
  teacher-entered) and activity progress (high-volume, student-written) have
  different durability/consistency needs. One table serving both is a compromise
  for both.
- **The actual goal is a unified _view_, not unified _storage_.** That's a read
  problem, solvable without touching the writers.
- **Reversibility.** A read layer can be deleted with zero data risk. A merged
  schema cannot be un-merged.

## Plan (reversible, flag-gated — only on approval)

1. Define a small read-only "student insights" contract (anonymous/aggregate or
   teacher-auth'd, depending on use): counts, recent activity, score summaries.
2. Add a read-only endpoint (a Worker or a Pages function) that fans out to the
   existing D1s **read-only** and merges results. No writes, ever.
3. Gate any UI behind the existing teacher auth; keep student PII out of
   client-delivered payloads (follow the mailbox dashboard's rules).
4. Ship behind a feature flag; verify against the live stores; remove the flag.

## Risks / non-goals

- **Non-goal:** physically merging schemas or moving data between D1s.
- **Risk:** cross-repo read access + auth must be designed carefully (don't widen
  any store's exposure). To be scoped per-store before building.
- **Open input needed from Joel:** which views are actually useful (this drives
  the read contract), and whether the unified view is teacher-only or also feeds
  a student-facing surface.
