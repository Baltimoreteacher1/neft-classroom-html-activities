window.ENG = window.ENG || {};
window.ENG.writing = {
  title: "Writing Workshop",
  icon: "🖊️",
  intro:
    "Strong literary analysis and argument writing makes a clear claim and proves it with evidence from the text. In this workshop you'll build thesis statements, develop CER body paragraphs, and write introductions that pull a reader in.",
  models: [
    {
      type: "Thesis Statement",
      title: "Debatable, focused thesis (To Kill a Mockingbird)",
      text: "In To Kill a Mockingbird, Harper Lee uses Scout's gradual loss of innocence to argue that genuine moral courage means defending justice even when an entire community stands against you.",
      annotations: [
        "Names the author and title, then makes a claim that someone could reasonably disagree with — it isn't just a plot summary.",
        "Identifies a specific literary device (Scout's loss of innocence) as the vehicle for the argument, so the body paragraphs already have a focus.",
        "Ends with the 'so what' — the larger theme about moral courage — which gives the whole essay a purpose beyond retelling the story.",
      ],
    },
    {
      type: "Analytical Paragraph (CER)",
      title: "Claim–Evidence–Reasoning body paragraph (Of Mice and Men)",
      text: 'Steinbeck presents loneliness as the inescapable condition of the powerless. When Crooks admits, "A guy needs somebody—to be near him," his desperate confession reveals that isolation has worn down even his pride (Steinbeck 72). The dash mid-sentence makes Crooks stumble, as if the need is too painful to say smoothly, and the vague word "somebody" shows he is not asking for much — just anyone. Because Steinbeck gives this longing to a character the ranch has pushed to the margins, he suggests that loneliness is not a personal failing but a wound inflicted by a society that discards the weak.',
      annotations: [
        "Opens with a clear topic-sentence CLAIM that ties directly back to a thesis about loneliness and power.",
        "Integrates EVIDENCE smoothly with a quotation sandwich and a proper in-text citation rather than dropping the quote in cold.",
        "Spends most of the paragraph on REASONING — analyzing the dash and the word 'somebody' — instead of just restating the quote, then connects back to the larger theme.",
      ],
    },
    {
      type: "Introduction Hook",
      title: "Hook that opens with a tension, not a definition",
      text: "We tell children that honesty is always the best policy — and then we hand them a world that rewards the liars. That contradiction sits at the heart of The Great Gatsby, where Jay Gatsby builds a glittering life on a foundation of invented stories. F. Scott Fitzgerald uses Gatsby's elaborate deceptions to argue that the American Dream often demands the very dishonesty it claims to condemn.",
      annotations: [
        "Starts with a provocative idea the reader feels before the book is even named, instead of the tired 'Since the beginning of time...' opener.",
        "Moves from the broad hook to the specific text in one smooth pivot, so the reader sees why the hook matters.",
        "Ends on a sharp, debatable thesis, giving the introduction a clear destination rather than trailing off into summary.",
      ],
    },
  ],
  rubric: [
    {
      criterion: "Thesis / Claim",
      level4:
        "Presents a precise, debatable claim that interprets the text and previews a clear line of reasoning.",
      level3:
        "States a clear, arguable claim that responds to the prompt and is mostly focused.",
      level2:
        "Offers a claim, but it is vague, mostly summary, or only partly addresses the prompt.",
    },
    {
      criterion: "Evidence & Textual Support",
      level4:
        "Selects the strongest, most relevant quotations and details, smoothly embeds them, and cites accurately.",
      level3:
        "Uses relevant textual evidence with mostly smooth integration and generally correct citations.",
      level2:
        "Includes some evidence, but it is loosely connected, dropped in without setup, or weakly cited.",
    },
    {
      criterion: "Analysis / Reasoning",
      level4:
        "Explains how and why the evidence proves the claim, analyzing specific language and connecting to the larger theme.",
      level3:
        "Explains the evidence and links it to the claim, though some reasoning stays general.",
      level2:
        "Restates or paraphrases the evidence with little explanation of how it supports the claim.",
    },
    {
      criterion: "Organization",
      level4:
        "Builds a logical progression with a focused intro, unified paragraphs, purposeful transitions, and a thoughtful conclusion.",
      level3:
        "Follows a clear structure with topic sentences and transitions that mostly guide the reader.",
      level2:
        "Shows a basic structure, but paragraphs wander, transitions are missing, or the order feels random.",
    },
    {
      criterion: "Language & Conventions",
      level4:
        "Uses precise, varied, academic language with strong control of grammar, punctuation, and spelling.",
      level3:
        "Communicates clearly with mostly correct conventions; minor errors do not interfere with meaning.",
      level2:
        "Frequent errors in grammar, punctuation, or word choice occasionally make the meaning unclear.",
    },
  ],
  prompts: [
    {
      title: "Character & Theme Analysis",
      prompt:
        "Choose a character from a novel or story you've read this year. In a multi-paragraph essay, analyze how that character changes from the beginning to the end, and explain what the author reveals about a larger theme through that change. Support your analysis with at least two pieces of textual evidence.",
      scaffold: [
        "Draft a thesis: 'In ___, the author uses ___'s transformation from ___ to ___ to reveal that ___.'",
        "For each body paragraph, choose one quotation that shows the character before and one that shows them after the change.",
        "After each quotation, write at least two sentences of reasoning that answer 'How does this prove my claim?' before moving on.",
      ],
    },
    {
      title: "Argument: Take a Position",
      prompt:
        "Should high schools require students to perform community service to graduate? Write an argumentative essay that states your position, supports it with reasons and evidence, and addresses at least one counterclaim before refuting it.",
      scaffold: [
        "State your claim in one sentence, then list your two strongest reasons.",
        "Use the frame 'Some people argue that ___; however, ___' to write your counterclaim paragraph.",
        "Close by restating your claim in fresh words and naming why it matters to your reader.",
      ],
    },
    {
      title: "Compare Two Texts",
      prompt:
        "Select two texts (a poem and a short story, or two poems) that explore a similar theme. Write an essay analyzing how each author develops that theme differently, using specific evidence from both texts to support your comparison.",
      scaffold: [
        "Name the shared theme, then finish: 'While both texts explore ___, ___ emphasizes ___ whereas ___ emphasizes ___.'",
        "Organize point-by-point: pick one element (imagery, tone, structure) and discuss both texts within the same paragraph.",
        "Use comparison transitions — 'similarly,' 'in contrast,' 'unlike' — to keep both texts in view throughout.",
      ],
    },
  ],
  checklist: [
    "My thesis makes a clear, debatable claim that a reader could disagree with — it isn't just a summary.",
    "Every body paragraph has a topic sentence that connects back to my thesis.",
    "Each quotation is introduced, cited correctly, and followed by at least two sentences of my own analysis.",
    "My transitions guide the reader smoothly from one idea to the next instead of jumping.",
    "My conclusion restates my argument in new words and explains why it matters.",
    "I reread aloud and fixed errors in grammar, punctuation, spelling, and word choice.",
  ],
};
