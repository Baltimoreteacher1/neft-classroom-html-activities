// Key Language Use reference data (Narrate, Inform, Explain, Argue) for grades 3–5 and 6–8.
// Written in the lab's own words from general academic-genre conventions: how each kind of text is
// usually organized, the language functions it calls on, and common signal words. It is a practice
// reference, not WIDA text, and it describes language moves — never a level or a score.
export const KEY_LANGUAGE_USES = ["Narrate", "Inform", "Explain", "Argue"];
export const KLU_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];

export const KLU_REFERENCE = Object.freeze({
  Narrate: {
    purpose: "Tell what happened — real or imagined — so a listener or reader can follow it.",
    bands: {
      "3-5": {
        moves: ["Introduce who, where and when", "Tell events in the order they happened", "Build to a problem or an important moment", "End with how it worked out or what was learned"],
        functions: ["Recount events in time order", "Describe characters, settings and feelings", "Tell what someone said or thought"],
        signals: ["first", "next", "then", "after that", "one day", "suddenly", "finally", "at the end"],
      },
      "6-8": {
        moves: ["Orient the reader with context and point of view", "Sequence events, including shifts in time", "Develop a complication that builds tension", "Resolve it and reflect on its meaning"],
        functions: ["Develop characters through dialogue and action", "Signal shifts in time and setting", "Reflect on why the events matter"],
        signals: ["earlier that day", "meanwhile", "as soon as", "without warning", "eventually", "looking back", "from that moment on"],
      },
    },
    domains: {
      Listening: "Listen for time words and for what happened first, next and last.",
      Reading: "Track the order of events and how the problem is solved.",
      Speaking: "Tell what happened in order, then say how it ended.",
      Writing: "Write the events in order with time words and give it an ending.",
    },
  },
  Inform: {
    purpose: "Give accurate information about a topic: what it is, its parts, and how it compares.",
    bands: {
      "3-5": {
        moves: ["Name the topic and say what kind of thing it is", "Group facts that belong together", "Add details: facts, numbers and examples", "Close with the main point"],
        functions: ["Define", "Describe parts and features", "Classify", "Compare"],
        signals: ["is a kind of", "has", "for example", "also", "another", "both", "in addition", "in conclusion"],
      },
      "6-8": {
        moves: ["Introduce and define the topic", "Organize information into categories or subtopics", "Develop each part with precise facts, definitions and examples", "Conclude by summarizing the key information"],
        functions: ["Define and classify", "Describe attributes and processes", "Compare and contrast", "Summarize information from sources"],
        signals: ["refers to", "is classified as", "such as", "in addition", "similarly", "whereas", "in contrast", "overall"],
      },
    },
    domains: {
      Listening: "Listen for the topic and the facts that describe it.",
      Reading: "Find the main idea and the details that support it.",
      Speaking: "Name your topic, then give facts grouped in a clear order.",
      Writing: "Define the topic, group your facts, and close with the main point.",
    },
  },
  Explain: {
    purpose: "Tell how something works or why something happens, step by step or cause by cause.",
    bands: {
      "3-5": {
        moves: ["Say what happens or how something works", "Tell the steps or causes in order", "Show how one thing leads to another", "End with the result"],
        functions: ["Tell why or how", "Describe a cause and its effect", "Put the steps of a process in order"],
        signals: ["because", "so", "when", "first", "then", "as a result", "this causes"],
      },
      "6-8": {
        moves: ["Identify the phenomenon or problem", "Describe the chain of causes and effects", "Connect each link with reasoning and evidence", "Conclude with the outcome or a general rule"],
        functions: ["Explain causes and consequences", "Describe a process or system", "Interpret data as evidence", "Justify a solution"],
        signals: ["consequently", "therefore", "due to", "which leads to", "as a result", "this means that", "according to the data"],
      },
    },
    domains: {
      Listening: "Listen for what caused something and what happened because of it.",
      Reading: "Follow the steps or the cause-and-effect chain the text describes.",
      Speaking: "Say what happens, then link each cause to its effect.",
      Writing: "Explain the steps or causes in order and end with the result.",
    },
  },
  Argue: {
    purpose: "Take a position and convince others with reasons and evidence.",
    bands: {
      "3-5": {
        moves: ["State your opinion", "Give reasons", "Support each reason with facts or examples", "Say your opinion again at the end"],
        functions: ["Give an opinion", "Support it with reasons and examples", "Respond to another idea"],
        signals: ["I think", "I believe", "because", "for example", "one reason", "another reason", "that is why"],
      },
      "6-8": {
        moves: ["State a precise claim", "Support it with reasons and relevant evidence", "Acknowledge a counterclaim and respond to it", "Conclude by reinforcing the claim"],
        functions: ["Make a claim", "Cite and weigh evidence", "Address counterclaims", "Persuade an audience"],
        signals: ["the evidence shows", "for instance", "although", "however", "on the other hand", "nevertheless", "therefore"],
      },
    },
    domains: {
      Listening: "Listen for each speaker's position and the reasons they give.",
      Reading: "Find the claim and the evidence that supports it.",
      Speaking: "State your position, give a reason, and back it with evidence.",
      Writing: "Write a claim, support it with evidence, and answer another view.",
    },
  },
});
