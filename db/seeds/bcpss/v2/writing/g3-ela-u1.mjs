// BCPSS Writing Lab (TWR) — g3-ela-u1 · The Sea. Contract: ../writing-schema.mjs

export default {
  title: "Small Helpers of the Bay",
  genre: "inform",
  tip: "Have students say the central idea in one sentence before they write, then check that each key detail really proves it.",
  lessons: [
    { id: "A", title: "Why people explore the ocean" },
    { id: "B", title: "Reefs and tide pools as ocean habitats" },
    { id: "C", title: "Currents and tides move ocean water" },
    { id: "D", title: "Summarize the central idea and key details" },
  ],
  source: {
    title: "Oysters of the Chesapeake Bay",
    lesson: "B",
    text: "Oysters live on hard reefs on the bottom of the Chesapeake Bay. An oyster filters water through its body. One oyster can clean about fifty gallons of water in a day. Clean water lets sunlight reach the bay grass. Baby blue crabs hide in that grass to stay safe. Long ago, people took too many oysters from the bay. Now scientists explore the reefs and count the oysters. They build new reefs to bring the oysters back. Their work helps people protect the whole bay.",
  },
  notes: [
    { sentence: "An oyster filters water through its body.", note: "oyster filters water" },
    { sentence: "One oyster can clean about fifty gallons of water in a day.", note: "1 oyster = cleans ~50 gal/day" },
    { sentence: "Clean water lets sunlight reach the bay grass.", note: "clean water → sunlight → grass" },
    { sentence: "Now scientists explore the reefs and count the oysters.", note: "scientists explore + count oysters" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Oysters are important to the Chesapeake Bay",
      because: "they filter the water and make it clean.",
      but: "there are far fewer oysters than there were long ago.",
      so: "scientists build new reefs to bring them back.",
    },
    {
      lesson: "A",
      kernel: "Scientists dive down to explore the reef",
      because: "they want to count the fish and check the coral.",
      but: "a diver cannot stay underwater for very long.",
      so: "they can learn when the reef is sick and help it.",
    },
    {
      lesson: "D",
      kernel: "Baby blue crabs hide in the bay grass",
      because: "the grass keeps hungry fish from seeing them.",
      but: "the grass cannot grow where the water is too dark.",
      so: "oysters that clean the water help the crabs too.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Scientists counted fish.",
      parts: { when: "during the morning dive", where: "on the coral reef", how: "with waterproof slates", why: "to learn if the reef was healthy" },
      model: "During the morning dive, scientists counted fish on the coral reef with waterproof slates to learn if the reef was healthy.",
    },
    {
      lesson: "C",
      kernel: "The crab hid.",
      parts: { what: "under the seaweed", when: "at low tide", where: "in a tide pool", why: "to stay safe from hungry gulls" },
      model: "At low tide, the crab hid under the seaweed in a tide pool to stay safe from hungry gulls.",
    },
  ],
  fragments: [
    { text: "Oysters clean the water.", is_sentence: true },
    { text: "Living on the reef floor.", is_sentence: false, fix: "Many oysters are living on the reef floor." },
    { text: "Because the water is clear.", is_sentence: false, fix: "Sunlight reaches the grass because the water is clear." },
    { text: "Scientists check the coral.", is_sentence: true },
    { text: "At low tide in the tide pool.", is_sentence: false, fix: "A small crab hides at low tide in the tide pool." },
    { text: "The current moves the water.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Oysters, ___, clean the bay water.",
      noun: "Oysters",
      options: ["a tool that scientists use to count fish", "animals with hard shells that live on reefs", "the rise and fall of the water"],
      answer: 1,
      model: "Oysters, animals with hard shells that live on reefs, clean the bay water.",
    },
    {
      lesson: "C",
      sentence: "The tide, ___, goes out and comes back in each day.",
      noun: "tide",
      options: ["a small fish that hides in coral", "a robot that explores the deep sea", "the rise and fall of ocean water at the shore"],
      answer: 2,
      model: "The tide, the rise and fall of ocean water at the shore, goes out and comes back in each day.",
    },
    {
      lesson: "A",
      sentence: "A coral reef, ___, is home to thousands of fish.",
      noun: "coral reef",
      options: ["a rock garden built by tiny animals", "a boat that carries scientists", "the place where a river meets the sea"],
      answer: 0,
      model: "A coral reef, a rock garden built by tiny animals, is home to thousands of fish.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the scientists count the fish and check the coral", model: "When they dive down to the reef, the scientists count the fish and check the coral." },
    { lesson: "B", conjunction: "although", stem: "the coral reef is alive", model: "Although a coral reef looks like a rock garden, the coral reef is alive." },
    { lesson: "D", conjunction: "because", stem: "scientists explore the bay to protect the oysters", model: "Because oysters keep the water clean, scientists explore the bay to protect the oysters." },
  ],
  spo: {
    topic: {
      l1_2: "Oysters help the [bay].",
      l3_4: "The central idea is that [oysters] help the [Chesapeake Bay] by [cleaning the water].",
      l5_6: "Although they are small, [oysters, animals with hard shells,] protect the Chesapeake Bay by [cleaning its water].",
    },
    starters: [
      { type: "question", text: "How can a small oyster help a whole bay?" },
      { type: "appositive", text: "Oysters, small animals with hard shells, help the Chesapeake Bay." },
      { type: "subordinate", text: "Because oysters clean the water, the whole bay stays healthy." },
    ],
    details: [
      { note: "oyster filters water", lesson: "B" },
      { note: "1 oyster cleans ~50 gal/day", lesson: "B" },
      { note: "clean water → sunlight reaches grass", lesson: "B" },
      { note: "baby crabs hide in grass", lesson: "B" },
      { note: "scientists dive, count oysters", lesson: "A" },
      { note: "new reefs → more oysters → protect bay", lesson: "D" },
    ],
    distractors: ["tides rise and fall each day", "sea stars cling to tide pool rocks"],
    conclusion: {
      l1_2: "Oysters keep the bay [clean].",
      l3_4: "In summary, oysters help the bay because they [clean the water], and that helps [other animals].",
      l5_6: "In summary, oysters protect the whole bay by [cleaning the water], which lets [grass grow and baby crabs hide].",
    },
  },
  prompt: {
    l1_2: "Draw an oyster in the bay. Write 2-3 sentences that tell the central idea and one key detail.",
    l3_4: "Write a summary of the oyster text. Tell the central idea, then give two key details that prove it. Use your outline.",
    l5_6: "Write a summary that tells the central idea of the oyster text and proves it with three key details. Include an appositive and a sentence that starts with because or although.",
  },
  transitions: ["First,", "Next,", "Also,", "For example,", "Because", "As a result,", "Another detail is that", "In summary,"],
  model: {
    l1_2: "The central idea is that oysters help the bay. One key detail is that they clean the water. Clean water helps baby crabs.",
    l3_4: "The central idea is that oysters help the Chesapeake Bay by cleaning the water. One key detail is that one oyster cleans about fifty gallons a day. Another detail is that clean water lets sunlight reach the bay grass. Baby blue crabs hide in that grass. In summary, oysters help the whole bay because they keep the water clear.",
    l5_6: "Oysters, animals with hard shells that live on reefs, protect the Chesapeake Bay by cleaning its water. One oyster can filter about fifty gallons in a day. Because the water is clearer, sunlight reaches the bay grass. Baby blue crabs hide in that grass, so more of them stay safe. Although people took too many oysters long ago, scientists now build new reefs. In summary, oysters protect the whole bay by cleaning the water, which lets the grass grow and the crabs hide.",
  },
  revise: [
    "Did I say the central idea in one clear sentence?",
    "Did I give key details that prove the central idea?",
    "Did I use my own words instead of copying the text?",
    "Did I finish with a sentence that sums up the oysters' job?",
  ],
};
