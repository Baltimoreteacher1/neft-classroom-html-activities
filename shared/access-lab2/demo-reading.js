// Synthetic Reading demo items (3 per practice band, all draft). See demo-items.js.
import { opts, R, select, steps } from "./demo-factory.js";

export const READING = [
  R(
    "demo-r-early-1",
    "early",
    "Narrate",
    "ELD-LA",
    "short-passage",
    "Pablo has a small red wagon. He pulls his little sister in it every afternoon. She laughs and waves at the dog next door.",
    "Read the story. Who does Pablo pull in the wagon?",
    select(opts("His dog", "His little sister", "His teacher", "His friend"), "b"),
  ),
  R(
    "demo-r-early-2",
    "early",
    "Inform",
    "ELD-SC",
    "vocabulary-in-context",
    "The garden is tiny. Only two flowers fit in it, and they touch each other.",
    "Read the sentences. What does the word tiny mean?",
    select(opts("Very small", "Very old", "Very loud", "Very wet"), "a"),
  ),
  R(
    "demo-r-early-3",
    "early",
    "Inform",
    "ELD-SI",
    "text-features",
    "Title: Our Class Pets\nHeading: Fish\nThe fish eat food every morning.\nHeading: Hamster\nThe hamster runs on a wheel at night.",
    "Look at the headings. Which heading tells where to read about the pet that runs on a wheel?",
    select(opts("Our Class Pets", "Fish", "Hamster", "Night"), "c"),
  ),
  R(
    "demo-r-building-1",
    "building",
    "Explain",
    "ELD-SC",
    "short-passage",
    "Bees visit flowers to collect nectar. While they drink, tiny grains called pollen stick to their legs. When a bee lands on the next flower, some pollen falls off. This helps the plants make seeds.",
    "Read the passage. How do bees help plants make seeds?",
    select(
      opts(
        "They eat the old leaves.",
        "They water the flowers.",
        "They dig holes for seeds.",
        "They carry pollen from flower to flower.",
      ),
      "d",
    ),
  ),
  R(
    "demo-r-building-2",
    "building",
    "Argue",
    "ELD-SS",
    "inference",
    "Mr. Cho's class has used the same old maps for ten years. Some countries on the maps have new names now. Students keep getting confused when they read the news.",
    "Read the passage. What can you tell about the class maps?",
    select(
      opts(
        "They show only one country.",
        "They are brand new.",
        "They need to be updated.",
        "They were drawn by the students.",
      ),
      "c",
    ),
  ),
  R(
    "demo-r-building-3",
    "building",
    "Narrate",
    "ELD-LA",
    "short-passage",
    "Leila signed up for the school race. She practiced running every morning before school. On race day her legs felt tired, but she kept going. She crossed the finish line and smiled.",
    "Read the story. Put the events in order.",
    {
      response: {
        mode: "order",
        constraints: {
          items: steps(
            "Leila crossed the finish line.",
            "Leila signed up for the race.",
            "Leila kept going when her legs felt tired.",
            "Leila practiced running every morning.",
          ),
        },
      },
      scoring: { type: "key", key: ["b", "d", "c", "a"] },
    },
  ),
  R(
    "demo-r-strong-1",
    "strong",
    "Explain",
    "ELD-SC",
    "inference",
    "When ice melts in the sun, the puddle it leaves soon shrinks and disappears, even though nobody wipes it up. The water is not gone. It has spread into the air as an invisible gas.",
    "Read the passage. Why does the puddle disappear?",
    select(
      opts(
        "The ice grows back.",
        "The ground drinks all the water.",
        "Someone wipes it up.",
        "The water turns into a gas in the air.",
      ),
      "d",
    ),
  ),
  R(
    "demo-r-strong-2",
    "strong",
    "Argue",
    "ELD-SS",
    "vocabulary-in-context",
    "The mayor's plan was controversial. Many neighbors loved the new park, but many others worried it would bring traffic and noise.",
    "Read the sentences. What does the word controversial mean?",
    select(
      opts("Causing people to disagree", "Easy to forget", "Very cheap", "Finished early"),
      "a",
    ),
  ),
  R(
    "demo-r-strong-3",
    "strong",
    "Inform",
    "ELD-MA",
    "text-features",
    "Chart title: Pets in Room 12\nDogs: 6 students\nCats: 9 students\nFish: 3 students",
    "Read the chart. Which two things can you learn from it? Choose two.",
    {
      response: {
        mode: "multi",
        constraints: {
          options: opts(
            "More students have cats than dogs.",
            "Fish are the cheapest pets.",
            "Three students have fish.",
            "Dogs are friendlier than cats.",
          ),
        },
      },
      scoring: { type: "key", key: ["a", "c"] },
    },
  ),
];
