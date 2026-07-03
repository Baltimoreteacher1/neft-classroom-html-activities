// qti.mjs — the single source of truth for Canvas QTI 1.2 generation.
//
// Extracted verbatim from build-course.mjs (the format Canvas verified on real
// imports; validate-course.mjs cross-checks answer keys against it). Both the
// course builder and the pre-test quiz builder import from here — edit QTI
// markup in THIS file only, and keep validate-course.mjs's expectations in mind.
export const xml = (s) =>
  String(s == null ? "" : s).replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
export const html = (s) => xml(s); // same escaping for our simple text content

export const LETTERS = "ABCDEFGHIJKLMNOP".split("");

export function mcItem(q, ident, qi) {
  const labels = q.choices
    .map(
      (c, i) =>
        `          <response_label ident="${LETTERS[i]}"><material><mattext texttype="text/html">${html(c)}</mattext></material></response_label>`,
    )
    .join("\n");
  const correct = LETTERS[q.correct] || "A";
  const fb = q.explanation
    ? `    <itemfeedback ident="general_fb"><flow_mat><material><mattext texttype="text/html">${html(q.explanation)}</mattext></material></flow_mat></itemfeedback>`
    : "";
  const fbRef = q.explanation
    ? `        <displayfeedback feedbacktype="Response" linkrefid="general_fb"/>`
    : "";
  return `  <item ident="${ident}" title="Question ${qi}">
    <itemmetadata><qtimetadata>
      <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1.0</fieldentry></qtimetadatafield>
    </qtimetadata></itemmetadata>
    <presentation>
      <material><mattext texttype="text/html">${html(q.stem)}</mattext></material>
      <response_lid ident="response_${qi}" rcardinality="Single">
        <render_choice>
${labels}
        </render_choice>
      </response_lid>
    </presentation>
    <resprocessing>
      <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
      <respcondition continue="No">
        <conditionvar><varequal respident="response_${qi}">${correct}</varequal></conditionvar>
        <setvar action="Set" varname="SCORE">100</setvar>
${fbRef}
      </respcondition>
    </resprocessing>
${fb}
  </item>`;
}

export function matchItem(q, ident, qi) {
  // unique right-column options; each ident "mN"; correct per term = its match's ident
  const matches = [];
  q.pairs.forEach((p) => {
    if (!matches.includes(p.match)) matches.push(p.match);
  });
  const optionXml = (rid) =>
    matches
      .map(
        (m, i) =>
          `            <response_label ident="m${i}"><material><mattext texttype="text/html">${html(m)}</mattext></material></response_label>`,
      )
      .join("\n");
  const per = Math.round((100 / q.pairs.length) * 100) / 100;
  const responses = q.pairs
    .map(
      (p, i) => `      <response_lid ident="response_${qi}_${i}" rcardinality="Single">
        <material><mattext texttype="text/html">${html(p.term)}</mattext></material>
        <render_choice>
${optionXml(i)}
        </render_choice>
      </response_lid>`,
    )
    .join("\n");
  const conds = q.pairs
    .map((p, i) => {
      const mi = matches.indexOf(p.match);
      return `      <respcondition continue="Yes">
        <conditionvar><varequal respident="response_${qi}_${i}">m${mi}</varequal></conditionvar>
        <setvar action="Add" varname="SCORE">${per}</setvar>
      </respcondition>`;
    })
    .join("\n");
  return `  <item ident="${ident}" title="Question ${qi}">
    <itemmetadata><qtimetadata>
      <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>matching_question</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1.0</fieldentry></qtimetadatafield>
    </qtimetadata></itemmetadata>
    <presentation>
      <material><mattext texttype="text/html">${html(q.prompt)}</mattext></material>
${responses}
    </presentation>
    <resprocessing>
      <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
${conds}
    </resprocessing>
  </item>`;
}

// Canvas short-answer ("fill in the blank"): exact-match against each accepted
// answer string. Used by the pre-test quizzes for their numeric "fill" items.
export function shortAnswerItem(q, ident, qi) {
  const answers = (q.accept && q.accept.length ? q.accept : [q.answer]).map((a) =>
    String(a).trim(),
  );
  const conds = answers
    .map(
      (a) => `      <respcondition continue="No">
        <conditionvar><varequal respident="response_${qi}">${xml(a)}</varequal></conditionvar>
        <setvar action="Set" varname="SCORE">100</setvar>
      </respcondition>`,
    )
    .join("\n");
  const fb = q.explanation
    ? `    <itemfeedback ident="general_fb"><flow_mat><material><mattext texttype="text/html">${html(q.explanation)}</mattext></material></flow_mat></itemfeedback>`
    : "";
  return `  <item ident="${ident}" title="Question ${qi}">
    <itemmetadata><qtimetadata>
      <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>short_answer_question</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1.0</fieldentry></qtimetadatafield>
    </qtimetadata></itemmetadata>
    <presentation>
      <material><mattext texttype="text/html">${html(q.stem)}</mattext></material>
      <response_str ident="response_${qi}" rcardinality="Single">
        <render_fib><response_label ident="answer1" rshuffle="No"/></render_fib>
      </response_str>
    </presentation>
    <resprocessing>
      <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
${conds}
    </resprocessing>
${fb}
  </item>`;
}

export function qtiItem(q, qi, quizId) {
  const ident = quizId + "_q" + qi;
  if (q.kind === "match") return matchItem(q, ident, qi);
  if (q.kind === "short") return shortAnswerItem(q, ident, qi);
  return mcItem(q, ident, qi);
}

export function qtiAssessment(quizId, title, qs) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${quizId}" title="${xml(title)}">
    <qtimetadata>
      <qtimetadatafield><fieldlabel>cc_maxattempts</fieldlabel><fieldentry>unlimited</fieldentry></qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
${qs.map((q, i) => qtiItem(q, i + 1, quizId)).join("\n")}
    </section>
  </assessment>
</questestinterop>`;
}

export function assessmentMeta(quizId, asgId, title, points, groupRef) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<quiz identifier="${quizId}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${xml(title)}</title>
  <points_possible>${points}.0</points_possible>
  <quiz_type>assignment</quiz_type>
  <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
  <allowed_attempts>-1</allowed_attempts>
  <scoring_policy>keep_highest</scoring_policy>
  <shuffle_answers>true</shuffle_answers>
  <show_correct_answers>true</show_correct_answers>
  <available>false</available>
  <published>false</published>
  <assignment identifier="${asgId}">
    <title>${xml(title)}</title>
    <points_possible>${points}.0</points_possible>
    <grading_type>points</grading_type>
    <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
    <submission_types>online_quiz</submission_types>
    <workflow_state>unpublished</workflow_state>
  </assignment>
</quiz>`;
}
