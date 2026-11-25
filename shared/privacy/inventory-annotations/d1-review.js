// D1 annotations. Content review and release trains (migration 0022). These tables describe CONTENT and the
// adult reviewers who checked it; they hold no student data of any kind.
// Format and rules: shared/privacy/inventory.mjs. Each column of each table must be named exactly once;
// tools/privacy-inventory.mjs --check fails on a column with no annotation and on one that no longer exists.
// Retention and delete statements describe what the code does today, not what policy would prefer.

// @data field=review_event.reviewer_name store=d1 purpose="Name a staff reviewer typed for the human review log of a lesson or unit (an adult, never a student). Required so an approval has an accountable person." retention="kept: append-only, the table refuses UPDATE and DELETE" delete="none in code: it is the audit record of who approved what; removal needs a reviewed migration"
// @data field=review_event.comment store=d1 purpose="Optional reviewer note on a content decision, at most 500 characters. Free text, screened by rejectIfPII before it is stored, so names, contact details and personal circumstances are refused. About content, never about a student." retention="kept: append-only" delete="none in code, as for reviewer_name"
// @data field=review_event.snapshot_json store=d1 purpose="The lesson or unit content as it stood at the decision, for the side-by-side diff. Authored curriculum content only." retention="kept: append-only" delete="none: no personal data"
// @data field=review_event.{seq,id,block_id,kind,dimension,lang,from_state,to_state,reviewer_role,reviewer_date,actor,content_hash,bulk_id,created_at,prior_digest,digest} store=d1 purpose="One human review decision on a content block: which block, which review dimension, the state change, the reviewer role and date, the content hash it applies to, and the hash chain that makes edits detectable. actor is always 'human'." retention="kept: append-only" delete="none: no personal data"
// @data field=review_state.{block_id,dimension,lang,state,reviewed_hash,reviewer_role,reviewer_date,event_seq,updated_at} store=d1 purpose="Latest review state per content block and dimension (a projection of review_event)." retention="kept; rebuilt from review_event" delete="none: no personal data"
// @data field=review_state.reviewer_name store=d1 purpose="Name of the staff reviewer who made the latest decision (copy of review_event.reviewer_name)." retention="kept; rebuilt from review_event" delete="none in code, as for review_event.reviewer_name"
// @data field=content_release.created_by store=d1 purpose="Name of the staff member who cut the content release." retention="kept: releases are never deleted" delete="none in code: release record"
// @data field=content_release.{seq,id,manifest_json,manifest_digest,changelog_json,verifiers_ran_json,created_at,status,previous_id} store=d1 purpose="A content release: the content hash of every block at release time, the changelog against the previous release, which verifiers ran, status." retention="kept: releases are never deleted" delete="none: no personal data"
// @data field=release_pointer.moved_by store=d1 purpose="Name of the staff member who last moved the current-release pointer (release or rollback)." retention="one row, overwritten on each move" delete="none in code: single pointer row"
// @data field=release_pointer.{id,release_id,reason,updated_at} store=d1 purpose="The single row naming the current content release." retention="one row, overwritten on each move" delete="none: no personal data"

export {};
