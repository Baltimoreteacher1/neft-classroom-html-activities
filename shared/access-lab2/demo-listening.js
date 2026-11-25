// Synthetic Listening demo items (3 per practice band, all draft). See demo-items.js.
import { crit, L, opts, select, steps } from "./demo-factory.js";

export const LISTENING = [
  L(
    "demo-l-early-1",
    "early",
    "Narrate",
    "ELD-LA",
    "listen-and-choose",
    "Last Saturday, Ben and his sister planted seeds in a pot. First they filled the pot with soil. Then they pushed the seeds into the soil. Last, they gave the pot some water.",
    "Listen to the story. What did Ben and his sister do last?",
    select(
      opts(
        "They filled the pot with soil.",
        "They pushed the seeds into the soil.",
        "They gave the pot some water.",
        "They carried the pot inside.",
      ),
      "c",
    ),
  ),
  L(
    "demo-l-early-2",
    "early",
    "Inform",
    "ELD-SI",
    "listen-and-choose",
    "The school library is open from nine to five. You may borrow three books at one time. The reading room is on the second floor.",
    "Listen to the library helper. How many books may you borrow at one time?",
    {
      ...select(opts("Two books", "Three books", "Five books", "Nine books"), "b"),
      glossary: [
        { term: "borrow", definition: "to take something for a short time and bring it back" },
      ],
    },
  ),
  L(
    "demo-l-early-3",
    "early",
    "Explain",
    "ELD-SI",
    "listen-and-order",
    "To wash your hands, first turn on the water. Next, rub soap on your hands. Then rinse the soap off. Last, dry your hands with a towel.",
    "Listen to the steps. Put the steps in the order you hear them.",
    {
      response: {
        mode: "order",
        constraints: {
          items: steps(
            "Rinse the soap off.",
            "Turn on the water.",
            "Dry your hands with a towel.",
            "Rub soap on your hands.",
          ),
        },
      },
      scoring: { type: "key", key: ["b", "d", "a", "c"] },
    },
  ),
  L(
    "demo-l-building-1",
    "building",
    "Narrate",
    "ELD-SI",
    "listen-and-sort",
    "Mia tells about her weekend. On Saturday she visited her grandmother and baked bread with her. On Sunday she rode her bike and played soccer with her cousins.",
    "Listen to Mia. Sort what she did into Saturday and Sunday.",
    {
      response: {
        mode: "drag",
        constraints: {
          items: steps("Visited her grandmother", "Baked bread", "Rode her bike", "Played soccer"),
          bins: [
            { id: "sat", label: "Saturday" },
            { id: "sun", label: "Sunday" },
          ],
        },
      },
      scoring: { type: "key", key: { a: "sat", b: "sat", c: "sun", d: "sun" } },
    },
  ),
  L(
    "demo-l-building-2",
    "building",
    "Inform",
    "ELD-SC",
    "listen-and-choose",
    "Frogs and toads look alike, but they are different. Frogs have smooth, wet skin and long back legs for jumping. Toads have dry, bumpy skin and shorter legs for hopping.",
    "Listen to the talk. Which detail describes a toad?",
    select(
      opts(
        "Smooth, wet skin",
        "Dry, bumpy skin",
        "Long back legs for jumping",
        "Living only in water",
      ),
      "b",
    ),
  ),
  L(
    "demo-l-building-3",
    "building",
    "Explain",
    "ELD-SC",
    "dictogloss",
    "In autumn, the days get shorter. Trees make less green color, so other colors show. That is why leaves turn yellow and orange.",
    "Listen two times. Then write the ideas you heard in your own words.",
    {
      response: { mode: "type", constraints: { minSentences: 2 } },
      scoring: {
        type: "selfcheck",
        rubric: crit(
          "I wrote that the days get shorter.",
          "I wrote that trees make less green color.",
          "I wrote that leaves turn yellow and orange.",
          "My sentences start with a capital letter and end with a period.",
        ),
      },
    },
  ),
  L(
    "demo-l-strong-1",
    "strong",
    "Argue",
    "ELD-SI",
    "listen-and-choose",
    "Our school should start a garden. A garden lets students taste fresh food. It also teaches us how plants grow. Some people say it costs too much, but seeds and soil are cheap.",
    "Listen to the speaker. Which two reasons does the speaker give? Choose two.",
    {
      response: {
        mode: "multi",
        constraints: {
          options: opts(
            "Students can taste fresh food.",
            "Gardens cost a lot of money.",
            "Students learn how plants grow.",
            "A garden makes the school louder.",
          ),
        },
      },
      scoring: { type: "key", key: ["a", "c"] },
    },
  ),
  L(
    "demo-l-strong-2",
    "strong",
    "Explain",
    "ELD-SI",
    "follow-directions-on-paper",
    "Take a piece of paper. Draw a large circle in the middle. Write the word sun inside the circle. Draw four short lines coming out of the circle.",
    "Listen and follow the directions on your paper. Then check each step you finished.",
    {
      response: {
        mode: "multi",
        constraints: {
          options: opts(
            "I drew a large circle in the middle.",
            "I wrote the word sun inside the circle.",
            "I drew four short lines coming out of the circle.",
          ),
        },
      },
      scoring: {
        type: "selfcheck",
        rubric: crit(
          "I drew a large circle in the middle.",
          "I wrote the word sun inside the circle.",
          "I drew four short lines coming out of the circle.",
        ),
      },
    },
  ),
  L(
    "demo-l-strong-3",
    "strong",
    "Narrate",
    "ELD-LA",
    "listen-and-order",
    "Rosa lost her library card. She searched her backpack first. Next she asked her teacher for help. Then she checked the lost-and-found box. At last she found the card under her desk.",
    "Listen to the story. Put what Rosa did in order.",
    {
      response: {
        mode: "order",
        constraints: {
          items: steps(
            "Checked the lost-and-found box",
            "Found the card under her desk",
            "Searched her backpack",
            "Asked her teacher for help",
          ),
        },
      },
      scoring: { type: "key", key: ["c", "d", "a", "b"] },
    },
  ),
];
