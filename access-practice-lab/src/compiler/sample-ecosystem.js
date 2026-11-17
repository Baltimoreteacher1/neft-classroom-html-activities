// The required end-to-end example for the Experience Builder: an ORIGINAL grade 6 informational passage about a pond
// ecosystem (written for this lab; it copies no published text) and the settings a teacher would choose for it.
// "Try the ecosystem example" loads exactly this; tools/compiler.test.mjs compiles it as its fixture.

export const SAMPLE_TITLE = "Willow Pond: When One Part Changes";

export const SAMPLE_TEXT = `Willow Pond is a small ecosystem at the edge of a town. An ecosystem is a community of living things and the nonliving things around them. In the pond, algae and water plants are producers, which means they make their own food from sunlight. Tiny animals called zooplankton eat the algae. Minnows eat the zooplankton, and herons eat the minnows. This chain of who eats whom is called a food web.

For many years the pond water was clear. Then, two springs ago, a new lawn company began spreading fertilizer on the fields uphill from the pond. Fertilizer contains nutrients that help plants grow. When heavy rain fell, the water carried the extra nutrients downhill into the pond. This moving water is called runoff.

Because the algae had more nutrients, they grew much faster than the zooplankton could eat them. By July, a thick green layer of algae covered almost 70 percent of the pond's surface. The layer blocked sunlight, so the water plants below it died. Bacteria broke down the dead plants and algae, and that process used up oxygen in the water. Students from Willow Middle School measured the oxygen. It dropped from 8 milligrams per liter in May to 3 milligrams per liter in August. Minnows need at least 5 milligrams per liter to stay healthy. As a result, the number of minnows the students counted fell from 120 to 35.

At first, some neighbors blamed the herons for eating too many minnows. However, the students counted 4 herons in May and 4 herons in August, so the number of herons had not changed. "The fish did not disappear because of the birds," said Ms. Okafor, the science teacher. "They disappeared because the water lost its oxygen."

The town asked the company to use less fertilizer and planted a strip of tall grasses beside the pond to trap runoff. The next summer, the algae layer was smaller, and the oxygen level rose to 6 milligrams per liter.`;

/** Grades 6-8, Science, Explain, Speaking + Writing, mixed language development needs (every support available). */
export const SAMPLE_SETTINGS = Object.freeze({
  band: "6-8",
  subject: "Science",
  keyUse: "Explain",
  domains: ["Speaking", "Writing"],
  type: "investigation",
  minutes: 45,
  topic: "A pond ecosystem after fertilizer runoff",
  contentObjective: "Explain how a change in one part of a pond ecosystem affects the other parts.",
  languageObjective:
    "Explain a cause-and-effect chain aloud and in writing, using evidence and words like because and as a result.",
  supports: { glossary: true, frames: true, readAloud: true, spanish: true, wordBank: true },
  showSource: false,
});

export const sampleInput = () => ({
  source: { title: SAMPLE_TITLE, text: SAMPLE_TEXT, kind: "text" },
  settings: {
    ...SAMPLE_SETTINGS,
    domains: [...SAMPLE_SETTINGS.domains],
    supports: { ...SAMPLE_SETTINGS.supports },
  },
});
