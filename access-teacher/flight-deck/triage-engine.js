const LABELS = ["Re-engage", "Developing", "Nearly there", "Secure"];
const MISCONCEPTIONS = ["Model meaning", "Unitizing", "Additive reasoning", "Equivalent forms", "Operation choice", "Coordinate order", "Boundary symbol", "Precision / label"];
export const TriageEngine = Object.freeze({
  classify(entry) { return entry.tier === 3 ? 3 : entry.tier === 0 || (entry.misconception >= 1 && entry.misconception <= 3) ? 1 : 2; },
  group(entries) { return [1, 2, 3].map((tier) => ({ tier, students: entries.filter((e) => this.classify(e) === tier) })); },
  tierLabel(tier) { return LABELS[tier] || "Unknown"; },
  misconceptionLabel(code) { return MISCONCEPTIONS[code] || MISCONCEPTIONS[0]; },
  plan(tier, lesson) {
    const title = lesson?.title?.en || "this lesson";
    if (tier === 1) return { title: "Conceptual re-engagement", station: "Teacher table · 8–10 min", model: `Build ${title} with a concrete model. Ask learners to show what each quantity represents before calculating.`, problems: ["Represent the same relationship with a drawing and a labeled table.", "Change one quantity. Explain what stays the same and what changes."] };
    if (tier === 2) return { title: "Procedural fluency & discourse", station: "Partner station · 10 min", model: "Partner A annotates a worked model; Partner B checks the quantities and identifies the first step that needs repair. Switch roles and defend the correction.", problems: ["Repair an almost-right solution. Circle the first incorrect line and explain the correction.", "Create a matching example and a non-example for the target idea; trade cards with another pair."] };
    const standards = (lesson?.standards || [lesson?.standard]).filter(Boolean).join(" ");
    const challenge = /6\.DS/.test(standards)
      ? "Create two five-value whole-number data sets with the same median but different ranges. Order both sets and prove your claim."
      : /6\.(?:AT|RP)/.test(standards)
        ? "A shop sells 3 notebooks for $6. Find two equivalent notebook-to-cost ratios, show each in a different representation, and add a constraint that makes the comparison less obvious."
        : /6\.(?:NOS|NS)/.test(standards)
          ? "Choose three rational numbers between −4 and 4. Place them on a number line, write each in another form, and create a condition that only one of them satisfies."
          : /6\.(?:GR|G)/.test(standards)
            ? "Design two shapes with the same whole-number area but different perimeters. Draw, label, and prove both measurements."
            : `Create two distinct solutions for “${title}” using different representations. Add one constraint and justify why both solutions still satisfy the lesson goal.`;
    return { title: "Grade 6 enrichment", station: "Independent / partner · 10 min", model: challenge, problems: ["Solve the open-middle challenge and show a second representation.", "Add one constraint, then explain how it changes the solution set or model."] };
  }
});
