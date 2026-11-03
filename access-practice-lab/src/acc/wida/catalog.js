// WIDA ELD Standards Framework (2020 edition) expectation catalog used across the ACCESS lab: one entry per standard
// statement x grade cluster x Key Language Use (x mode). It lists the combinations the framework represents explicitly
// (e.g. Mathematics and Science and Social Studies are Explain and Argue; Language Arts is Narrate, Inform and, from
// grade 4, Argue). Item-level Language Expectation wording is NOT reproduced here and no code is invented: ids follow
// the framework's published pattern and link to the source. Shared by the content index tool and the in-browser views.
export const STANDARD_CODES = new Set(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"]);
export const WIDA_SOURCE = "https://wida.wisc.edu/teach/standards/eld";
const EXPECTATION_CATALOG = [
  ...["Narrate", "Inform", "Explain", "Argue"].map((use) => ({
    id: `ELD-SI.K-3.${use}`,
    gradeCluster: "2-3",
    standard: "ELD-SI",
    keyUse: use,
    modes: ["Interpretive", "Expressive"],
    source: WIDA_SOURCE,
  })),
  ...["Narrate", "Inform", "Explain", "Argue"].map((use) => ({
    id: `ELD-SI.4-12.${use}`,
    gradeClusters: ["4-5", "6-8"],
    standard: "ELD-SI",
    keyUse: use,
    modes: ["Interpretive", "Expressive"],
    source: WIDA_SOURCE,
  })),
  ...["2-3", "4-5", "6-8"].flatMap((gradeCluster) => {
    const usesByStandard =
      gradeCluster === "6-8"
        ? {
            "ELD-LA": ["Narrate", "Inform", "Argue"],
            "ELD-MA": ["Explain", "Argue"],
            "ELD-SC": ["Explain", "Argue"],
            "ELD-SS": ["Explain", "Argue"],
          }
        : gradeCluster === "2-3"
          ? {
              "ELD-LA": ["Narrate", "Inform"],
              "ELD-MA": ["Explain", "Argue"],
              "ELD-SC": ["Explain", "Argue"],
              "ELD-SS": ["Explain", "Argue"],
            }
          : {
              "ELD-LA": ["Narrate", "Inform", "Argue"],
              "ELD-MA": ["Explain", "Argue"],
              "ELD-SC": ["Explain", "Argue"],
              "ELD-SS": ["Explain", "Argue"],
            };
    return Object.entries(usesByStandard).flatMap(([standard, uses]) =>
      uses.flatMap((keyUse) =>
        ["Interpretive", "Expressive"].map((mode) => ({
          id: `${standard}.${gradeCluster}.${keyUse}.${mode}`,
          gradeCluster,
          standard,
          keyUse,
          mode,
          source: WIDA_SOURCE,
        })),
      ),
    );
  }),
];
export const WIDA_LANGUAGE_EXPECTATIONS = EXPECTATION_CATALOG;
