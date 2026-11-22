// Standards Crosswalk: maps WIDA 2020 ELD Standards, CCSS ELA, and TEKS ELAR/ELPS
// to ACCESS Practice Lab activities by domain, grade band, and skill keywords.

export const STANDARDS_FRAMEWORKS = Object.freeze([
  { id: "wida", label: "WIDA 2020", labelEs: "WIDA 2020" }, // ES-REVIEW: framework name
  { id: "ccss", label: "CCSS ELA", labelEs: "CCSS ELA" },   // ES-REVIEW: framework name
  { id: "teks", label: "TEKS", labelEs: "TEKS" },           // ES-REVIEW: framework name
]);

const DOMAIN_CROSSWALK = {
  Listening: {
    wida: "ELD-SI.4-12.Inform",
    ccss: "CCSS.ELA-LITERACY.SL.5.2",
    teks: "TEKS §74.4(c)(2)(I)",
  },
  Reading: {
    wida: "ELD-LA.4-8.Inform.Interpretive",
    ccss: "CCSS.ELA-LITERACY.RI.5.1",
    teks: "TEKS §110.7(b)(6)",
  },
  Speaking: {
    wida: "ELD-LA.4-8.Explain.Expressive",
    ccss: "CCSS.ELA-LITERACY.SL.5.4",
    teks: "TEKS §74.4(c)(3)(E)",
  },
  Writing: {
    wida: "ELD-LA.4-8.Argue.Expressive",
    ccss: "CCSS.ELA-LITERACY.W.5.1",
    teks: "TEKS §74.4(c)(5)(G)",
  },
};

const SKILL_OVERRIDES = [
  { match: /evidence|cite|claim|argu/i, wida: "ELD-LA.6-8.Argue.Expressive", ccss: "CCSS.ELA-LITERACY.W.6.1", teks: "TEKS §110.22(b)(11)(C)" },
  { match: /cause|effect|explain|process/i, wida: "ELD-SC.4-8.Explain.Expressive", ccss: "CCSS.ELA-LITERACY.RI.5.3", teks: "TEKS §110.7(b)(9)(D)" },
  { match: /vocab|word|morpheme|cognate/i, wida: "ELD-SI.K-12.Inform", ccss: "CCSS.ELA-LITERACY.L.5.4", teks: "TEKS §110.7(b)(3)" },
  { match: /main idea|detail|summar/i, wida: "ELD-LA.4-8.Inform.Interpretive", ccss: "CCSS.ELA-LITERACY.RI.5.2", teks: "TEKS §110.7(b)(6)(G)" },
  { match: /narrat|story|retell|sequenc/i, wida: "ELD-LA.4-8.Narrate.Expressive", ccss: "CCSS.ELA-LITERACY.RL.5.3", teks: "TEKS §110.7(b)(8)" },
  { match: /phonics|sound|blend|cvc|decode/i, wida: "ELD-LA.K-3.Narrate.Interpretive", ccss: "CCSS.ELA-LITERACY.RF.1.3", teks: "TEKS §110.3(b)(2)" },
];

export function standardsForActivity(row) {
  const domain = row?.domain || "Reading";
  const base = DOMAIN_CROSSWALK[domain] || DOMAIN_CROSSWALK.Reading;
  const skill = String(row?.skill || row?.title || "");
  const hit = SKILL_OVERRIDES.find((o) => o.match.test(skill));
  return {
    wida: row?.wida || hit?.wida || base.wida,
    ccss: row?.ccss || hit?.ccss || base.ccss,
    teks: row?.teks || hit?.teks || base.teks,
  };
}

export function matchesStandardFilter(row, framework) {
  if (!framework) return true;
  const stds = standardsForActivity(row);
  return Boolean(stds[framework]);
}
