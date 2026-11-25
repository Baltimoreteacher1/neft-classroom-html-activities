// Device annotations for the Studio reviewer queue and the "Reviewed units only" toggle. Format and rules: the
// header of device.js and shared/privacy/inventory.mjs. Nothing here is sent anywhere except the teacher key,
// which goes only into the x-teacher-key request header.

// @data field=ewl_review_reviewed_only store=device purpose="The viewer's choice to hide units that no human has finished reviewing (1 or 0). A display preference; no personal data." retention="until site data is cleared" delete="clear site data" source=bcpss-teachers/studio/views/review/badges.js
// @data field=ewl.review.teacherKey store=device purpose="The site teacher key a reviewer typed into the reviewer queue, kept in sessionStorage so a reload does not ask again. Sent only as the x-teacher-key header." retention="until the tab closes" delete="close the tab, or clear site data" source=bcpss-teachers/studio/views/review/api.js
// @data field=ewl.review.reviewer store=device purpose="The reviewer's own name and role, typed into the reviewer queue, kept in sessionStorage so each decision does not ask again. A staff member, never a student." retention="until the tab closes" delete="close the tab, or clear site data" source=bcpss-teachers/studio/views/review/api.js

export {};
