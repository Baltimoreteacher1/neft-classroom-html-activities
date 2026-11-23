// conversation-studio: explain a central idea to a partner and test a partner's summary (RI.6.2, SL.6.1).
const V = "g6-ela-central-idea-and-supporting-details";
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const bank = (ee, dev = [], exp = [], br = []) => ({ ee, dev, exp, br });
const opt = (id, fit, text, note) => ({ id, fit, text, note });
const you = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });
const partner = (id, say, note) => ({ id, speaker: "partner", say, ...(note ? { note } : {}) });

// The strong response is authored first for clarity; move it to a varied position so it is not always first.
const POS = [1, 2, 0, 2, 0];
const spread = (a) => {
  let n = 0;
  for (const p of a.purposes)
    for (const t of p.rehearsal.turns) {
      if (t.speaker !== "you") continue;
      const hit = t.options.find((o) => o.fit === "strong");
      const rest = t.options.filter((o) => o !== hit);
      rest.splice(Math.min(POS[n++ % POS.length], rest.length), 0, hit);
      t.options = rest;
    }
  return a;
};

const DATA = {
  id: "g6-ela-central-idea-conversation",
  engine: "conversation-studio",
  title: "Talk it through: the central idea of the shade passage",
  grade: "6",
  band: "6-8",
  subject: "ela",
  lessonId: "g6-ela-central-idea-and-supporting-details",
  standards: ["RI.6.2", "SL.6.1"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.6.2 and SL.6.1; not mapped to a district unit sequence. The topic and every line are original.",
  },
  vocabIds: [`${V}:central-idea`, `${V}:supporting-detail`, `${V}:paraphrase`, `${V}:evidence`],
  minutes: 22,
  intro:
    "Prepare and rehearse two academic conversations about a passage. In the first you explain its central idea to a partner. In the second you test a partner's summary and help improve it.",
  topic: {
    title: "The Shade Under the Trees",
    context:
      "A passage explains that dark pavement and roofs hold heat, that trees cool the air with shade and water vapor, that trees also help people walk and soak up rainwater, and that cities plant them first on hot blocks even though they cost money to care for. Your partner has not read it.",
    claim:
      "Street trees cool city blocks in several practical ways, so they are worth planting even though they cost money to care for.",
    visual: {
      kind: "flow",
      h: 170,
      alt: "A flow of four steps: pavement holds heat, trees cool with shade and vapor, trees help people and rainwater, cities plant trees despite the cost.",
      steps: [
        { label: "Pavement holds heat" },
        { label: "Trees cool the air" },
        { label: "Trees help people and rain" },
        { label: "Cities plant anyway" },
      ],
    },
  },
  roles: [
    {
      id: "explainer",
      label: "Partner A",
      job: "States the idea, gives proof from the text and explains the connection.",
    },
    {
      id: "listener",
      label: "Partner B",
      job: "Listens, asks for proof, says the idea back and names anything that is missing.",
    },
  ],
  moves: [
    {
      id: "topic",
      label: "Name the topic",
      function: "Tell your partner what the text is about in a few words.",
      frames: fr(
        ["The text is about ___."],
        ["The passage is about ___ and what it does for ___."],
        ["The subject of the passage is ___, discussed in relation to ___."],
        ["The text takes up ___ as its subject."],
      ),
      wordBank: bank(["topic", "passage", "about"], ["subject"]),
      example: "The passage is about street trees in cities.",
      listenFor: "A short noun phrase, not a full opinion.",
    },
    {
      id: "central-idea",
      label: "State the central idea",
      function: "Say the most important point the author makes about the topic.",
      frames: fr(
        ["The author's main point is that ___."],
        ["The central idea is that ___, because the author explains ___."],
        ["The central idea of the passage is that ___, which each paragraph supports."],
        ["Across the text the author develops the idea that ___."],
      ),
      wordBank: bank(["main point", "author", "idea"], ["explains", "supports"]),
      example:
        "The central idea is that street trees cool city blocks in several practical ways, so they are worth planting despite their cost.",
      listenFor: "A full sentence that covers every paragraph, not one detail.",
    },
    {
      id: "detail",
      label: "Give a supporting detail",
      function: "Point to one fact or example from the text that proves your idea.",
      frames: fr(
        ["In the text, I read that ___."],
        ["One detail is that ___, in the paragraph about ___."],
        ["The author supports this by noting that ___."],
        ["A key piece of evidence is the author's point that ___."],
      ),
      wordBank: bank(["detail", "paragraph", "the text says"], ["for example"]),
      example:
        "In the second paragraph, the author says leaves block sunlight and release water vapor, and both cool the air.",
      listenFor: "A specific detail with a place in the text.",
    },
    {
      id: "link",
      label: "Connect the detail to the idea",
      function: "Explain how the detail proves the idea.",
      frames: fr(
        ["This shows ___ because ___."],
        ["This detail shows ___ because ___, which supports the idea that ___."],
        ["That detail matters because it demonstrates ___, which is part of the claim that ___."],
        ["This evidence substantiates the idea by showing ___."],
      ),
      wordBank: bank(["shows", "because", "so"], ["supports", "demonstrates"]),
      example:
        "Those details show that trees do real cooling work, and that cooling is a benefit that outweighs the cost of watering and pruning.",
      listenFor: "A because or so that joins the detail to the idea.",
    },
    {
      id: "check",
      label: "Check understanding",
      function: "Ask your partner to say your idea back to you.",
      frames: fr(
        ["Can you say my idea ___?"],
        ["Can you say my central idea in your own words and tell me ___?"],
        ["Would you put the idea into your own words, and which detail convinced you?"],
        ["How would you restate the idea, and does any part of it seem unsupported?"],
      ),
      wordBank: bank(["say it back", "own words"], ["restate"]),
      example:
        "Can you say my central idea back to me in your own words, and tell me which detail convinced you?",
      listenFor: "A real question that invites the partner to speak.",
    },
    {
      id: "opinion",
      label: "Share your opinion",
      function: "Say what you personally think or feel about the topic.",
      frames: fr(
        ["I think ___."],
        ["In my opinion, ___ because ___."],
        ["My own view is that ___, although the text says ___."],
        ["Personally, I would argue ___."],
      ),
      example: "In my opinion, trees make a street feel friendlier.",
      notFit:
        "An opinion belongs in a response, not in a summary of the author's idea. Keep it for after the idea is clear.",
    },
    {
      id: "retell",
      label: "Retell the text in order",
      function: "Go through the passage sentence by sentence from the beginning.",
      frames: fr(
        ["First ___. Then ___."],
        ["The text begins with ___ and then moves to ___."],
        ["The passage opens by ___ and proceeds to ___."],
        ["The text proceeds from ___ to ___."],
      ),
      example:
        "First it says sidewalks get hot. Then it says trees help. Then it talks about watering.",
      notFit:
        "Retelling every sentence repeats the text without choosing the main point, so it does not give a central idea.",
    },
    {
      id: "paraphrase",
      label: "Paraphrase your partner",
      function: "Say what your partner said in your own words to show you understood.",
      frames: fr(
        ["So you are saying ___."],
        ["So you are saying that ___, is that right?"],
        ["If I understand you correctly, you are saying that ___."],
        ["Let me restate your position to be sure I have it: ___."],
      ),
      wordBank: bank(["so you are saying", "is that right"], ["restate"]),
      example: "So you are saying the passage tells us new trees need a lot of care at first.",
      listenFor: "The same meaning in different words.",
    },
    {
      id: "ask-evidence",
      label: "Ask for evidence",
      function: "Ask where in the text your partner found the idea.",
      frames: fr(
        ["Where does the text say ___?"],
        ["Which sentence shows that, and is it in more than one paragraph?"],
        ["Which part of the text supports that, and does it cover the whole passage?"],
        ["What textual evidence supports that, and how far does it extend?"],
      ),
      wordBank: bank(["where", "which sentence"], ["supports"]),
      example: "Which sentence shows that, and does the idea appear in more than one paragraph?",
      listenFor: "A question about the text, not about the person.",
    },
    {
      id: "name-gap",
      label: "Name what is missing",
      function: "Say politely that the idea is too small or leaves out part of the text.",
      frames: fr(
        ["That is one detail. The text also says ___."],
        ["That comes from one paragraph, but the passage also explains ___."],
        [
          "That detail is accurate, but the passage also covers ___, so the idea may be too narrow.",
        ],
        ["The statement is accurate yet insufficient as a central idea because it omits ___."],
      ),
      wordBank: bank(["detail", "also", "too small"], ["too narrow", "leaves out"]),
      example:
        "That comes from one paragraph, but the passage also explains how trees cool a block and why cities plant them, so it may be too small to be the central idea.",
      listenFor: "A comment on the idea, with something specific from the text.",
    },
    {
      id: "offer-revision",
      label: "Offer a revision",
      function: "Suggest a bigger idea that includes what your partner found.",
      frames: fr(
        ["Maybe the idea is ___."],
        ["Maybe the central idea is that ___, and your detail is one part."],
        [
          "Perhaps the central idea is that ___; the point you found would be one supporting detail.",
        ],
        ["I would propose revising the idea to ___, treating your point as evidence."],
      ),
      wordBank: bank(["maybe", "bigger"], ["revise"]),
      example:
        "Maybe the central idea is that street trees cool city blocks in practical ways, so they are worth the cost of care, and the watering is one cost the author admits.",
      listenFor: "A revision that keeps the partner's detail as support.",
    },
    {
      id: "accept",
      label: "Agree without checking",
      function: "Tell your partner the summary is fine without looking back at the text.",
      frames: fr(
        ["Okay, that is good."],
        ["Sure, that sounds right."],
        ["That seems fine to me."],
        ["I have no objections."],
      ),
      example: "Sure, that sounds right to me.",
      notFit:
        "Agreeing quickly skips the evidence. A partner's idea has to be checked against the text before you accept it.",
    },
  ],
  purposes: [
    {
      id: "explain-idea",
      label: "Explain the central idea",
      description:
        "Tell a partner who has not read the text what it is about, what it means and how you know.",
      moveIds: ["topic", "central-idea", "detail", "link", "check", "opinion", "retell"],
      plan: {
        prompt: "Choose the moves that fit, then put them in the order a listener could follow.",
        expected: ["topic", "central-idea", "detail", "link", "check"],
        hints: [
          "Start with what the text covers before you say what it means.",
          "A listener needs the point before the proof, and the proof before the explanation that joins them.",
          "Finish by finding out whether your partner understood instead of assuming.",
        ],
        model:
          "Tell the subject, then say the main point, give one piece of proof, explain how the proof supports the point, and ask your partner to say it back.",
        why: [
          "The subject orients the listener.",
          "The point answers what the author wants us to understand.",
          "A detail from the text shows it is not just your opinion.",
          "The connection shows how the proof matters.",
          "Asking for the idea back shows whether it was understood.",
        ],
      },
      rehearsal: {
        intro:
          "Your partner is a classmate who has not read the passage and wants to understand it.",
        turns: [
          partner("p1", "I have not read the passage about shade and trees. What is it about?"),
          you("y1", "Tell your partner the subject of the passage.", "topic", [
            opt(
              "a",
              "strong",
              "It is about street trees and what they do for a city.",
              "States the subject in a short phrase and hints at what the text says.",
            ),
            opt(
              "b",
              "partial",
              "Trees.",
              "This names the subject, but one word does not orient a listener who has not read it.",
            ),
            opt(
              "c",
              "off",
              "It is about summer and why it is hot.",
              "Summer appears in the passage, but it is not the subject. The text is about street trees.",
            ),
          ]),
          partner("p2", "Okay. But what is the author trying to tell us about street trees?"),
          you("y2", "Say the central idea in one sentence.", "central-idea", [
            opt(
              "a",
              "strong",
              "The central idea is that street trees cool city blocks in several practical ways, so they are worth planting even though they cost money to care for.",
              "It covers every paragraph and says something about the topic.",
            ),
            opt(
              "b",
              "partial",
              "The author says trees are good.",
              "Close in direction, but it does not say how trees are good or what the author concludes.",
            ),
            opt(
              "c",
              "off",
              "Young trees need regular watering for their first few years.",
              "That is a detail from one paragraph. It does not cover the whole passage.",
            ),
          ]),
          partner("p3", "What in the text makes you say that?"),
          you("y3", "Give one detail from the passage that supports your idea.", "detail", [
            opt(
              "a",
              "strong",
              "In the second paragraph the author says leaves block sunlight and release water vapor, and both cool the air.",
              "A specific detail from a specific place in the text.",
            ),
            opt(
              "b",
              "partial",
              "There is a lot of information about trees in it.",
              "This points to the text but names no detail, so a listener cannot check it.",
            ),
            opt(
              "c",
              "off",
              "I think trees are pretty, so I agree with the author.",
              "That is an opinion. The question asks for something the text says.",
            ),
          ]),
          partner("p4", "But how does that connect to the idea that trees are worth planting?"),
          you("y4", "Explain how the detail proves the idea.", "link", [
            opt(
              "a",
              "strong",
              "Those details show trees do real cooling work, and the cooling is a benefit that outweighs the cost of watering and pruning.",
              "It uses show and joins the detail to the idea and to the cost.",
            ),
            opt(
              "b",
              "partial",
              "It connects because trees are important.",
              "It gives a general reason but does not say how the detail proves the idea.",
            ),
            opt(
              "c",
              "off",
              "It connects because it is in the same paragraph.",
              "Being in the same paragraph is about location, not about meaning.",
            ),
          ]),
          partner("p5", "I think I follow. Is there anything you would like to check with me?"),
          you("y5", "Check that your partner understood.", "check", [
            opt(
              "a",
              "strong",
              "Can you say my central idea back to me in your own words, and tell me which detail convinced you?",
              "A real question that asks the partner to restate the idea and name proof.",
            ),
            opt(
              "b",
              "partial",
              "Do you get it?",
              "A yes or no question. It does not show whether the idea was understood.",
            ),
            opt(
              "c",
              "off",
              "Okay, that is all I have, so we are done.",
              "This ends the talk without checking understanding.",
            ),
          ]),
        ],
      },
    },
    {
      id: "test-summary",
      label: "Test a partner's summary",
      description: "Listen to a partner's summary, check it against the text and help improve it.",
      moveIds: [
        "paraphrase",
        "ask-evidence",
        "name-gap",
        "offer-revision",
        "accept",
        "opinion",
        "retell",
      ],
      plan: {
        prompt: "Choose the moves that help a partner improve a summary, then order them.",
        expected: ["paraphrase", "ask-evidence", "name-gap", "offer-revision"],
        hints: [
          "Show that you understood what was said before you respond to it.",
          "Look for support in the text before you decide whether the summary is complete.",
          "Only after you have named what is missing is it useful to suggest something better.",
        ],
        model:
          "Say your partner's idea in your own words, ask where the text supports it, point out what the idea leaves out, then offer a bigger idea that keeps the partner's detail.",
        why: [
          "Restating shows the partner you listened.",
          "A question about the text keeps the talk about evidence.",
          "Naming the gap tells the partner what to fix.",
          "A revision gives a next step instead of only criticism.",
        ],
      },
      rehearsal: {
        intro: "Your partner has written a summary and wants honest, useful feedback.",
        turns: [
          partner(
            "p1",
            "Here is my summary: the passage says young trees need regular watering for their first few years.",
          ),
          you("y1", "Show that you understood the summary.", "paraphrase", [
            opt(
              "a",
              "strong",
              "So you are saying the passage tells us new trees need a lot of care at first.",
              "Restates the meaning in new words and checks with the partner.",
            ),
            opt(
              "b",
              "partial",
              "Watering. Okay.",
              "This repeats a word but does not show that you understood the idea.",
            ),
            opt(
              "c",
              "off",
              "That is wrong.",
              "A judgment before understanding. Restate first, then respond.",
            ),
          ]),
          partner("p2", "Right, that is what I read in the text."),
          you("y2", "Ask where the text supports the summary.", "ask-evidence", [
            opt(
              "a",
              "strong",
              "Which sentence shows that, and does the idea appear in more than one paragraph?",
              "Asks for a location and for how far the idea reaches.",
            ),
            opt(
              "b",
              "partial",
              "How do you know?",
              "A fair question, but it does not point to the text or ask how much it covers.",
            ),
            opt(
              "c",
              "off",
              "I read it differently, so you should change it.",
              "This puts your reading above the text instead of asking for evidence.",
            ),
          ]),
          partner("p3", "It is in the fourth paragraph. I thought it was the main thing."),
          you("y3", "Say what the summary is missing.", "name-gap", [
            opt(
              "a",
              "strong",
              "That comes from one paragraph, but the passage also explains how trees cool a block and why cities plant them, so it may be too small to be the central idea.",
              "Names the limit and points to what else the text says.",
            ),
            opt(
              "b",
              "partial",
              "I think it needs more.",
              "True, but it does not say what is missing, so the partner cannot act on it.",
            ),
            opt(
              "c",
              "off",
              "That is a boring summary.",
              "This criticizes style instead of the idea. It gives the partner nothing to fix.",
            ),
          ]),
          partner("p4", "Oh, I see. What would you say the central idea is?"),
          you("y4", "Offer a revision that keeps your partner's detail.", "offer-revision", [
            opt(
              "a",
              "strong",
              "Maybe the central idea is that street trees cool city blocks in practical ways, so they are worth the cost of care, and the watering is one cost the author admits.",
              "A bigger idea that includes the partner's detail as support.",
            ),
            opt(
              "b",
              "partial",
              "Try making it longer.",
              "Length is not the problem. The idea has to cover more of the text.",
            ),
            opt(
              "c",
              "off",
              "Just copy the last sentence of the passage.",
              "Copying is not a revision, and the last sentence alone does not state the whole idea.",
            ),
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    { id: "idea", label: "I stated an idea that covers the whole text, not one detail." },
    { id: "proof", label: "I named a detail from the text and said where it is." },
    { id: "connect", label: "I used because, so or this shows to join my detail to my idea." },
    { id: "listen", label: "I said my partner's idea in my own words before I responded." },
  ],
  rubric: {
    criteria: [
      {
        id: "idea",
        label: "Central idea",
        levels: [
          { score: 1, descriptor: "Names the topic or one detail." },
          { score: 2, descriptor: "States an idea about the topic that covers part of the text." },
          { score: 3, descriptor: "States an idea in a full sentence that covers the whole text." },
        ],
      },
      {
        id: "evidence",
        label: "Text evidence",
        levels: [
          { score: 1, descriptor: "Gives no detail or an opinion." },
          { score: 2, descriptor: "Gives a detail without saying where it is or how it helps." },
          {
            score: 3,
            descriptor: "Gives a specific detail, says where it is and connects it to the idea.",
          },
        ],
      },
      {
        id: "response",
        label: "Responding to a partner",
        levels: [
          { score: 1, descriptor: "Judges or ignores the partner's idea." },
          { score: 2, descriptor: "Restates or questions the idea but does not help improve it." },
          {
            score: 3,
            descriptor: "Restates the idea, asks for evidence and suggests a better idea.",
          },
        ],
      },
    ],
  },
  reflection: {
    prompt: "What did you say or ask that helped your partner understand or improve an idea?",
    frames: {
      ee: ["I said ___.", "I asked ___."],
      dev: ["My partner understood better when I ___.", "A question that helped was ___."],
      exp: ["The move that mattered most was ___, because it ___."],
      br: ["Looking back, the exchange improved once I ___, which allowed my partner to ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
