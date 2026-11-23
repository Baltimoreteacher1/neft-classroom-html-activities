// Conversation Studio: a partner talk comparing two story characters by what they do. Original content.
const move = (id, label, fn, frames, example, extra = {}) => ({
  id,
  label,
  function: fn,
  frames,
  example,
  ...extra,
});
const turn = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });
const say = (id, text, note) => ({ id, speaker: "partner", say: text, note });
const opt = (id, text, fit, note) => ({ id, text, fit, note });

export default {
  id: "g3-ela-compare-characters-conversation",
  engine: "conversation-studio",
  title: "Talk it out: compare Nia and Theo",
  grade: "3",
  band: "3-5",
  subject: "ela",
  lessonId: "g3-ela-compare-characters-actions",
  standards: ["RL.3.3", "SL.3.1"],
  vocabIds: [
    "g3-ela-compare-characters-actions:compare",
    "g3-ela-compare-characters-actions:contrast",
    "g3-ela-compare-characters-actions:evidence",
  ],
  minutes: 18,
  intro:
    "A classmate read The Spilled Seeds but is not sure how Nia and Theo are different. Plan a short talk that compares what the two characters do, rehearse it, and check how it went.",
  topic: {
    title: "Nia and Theo in The Spilled Seeds",
    context:
      "In the story, a strong wind tips over the tray of bean seeds in the class garden. Nia stomps out of the room and says everything is ruined. Theo kneels down and picks up the seeds one at a time. After Nia peeks in and sees the cup filling up, she comes back to help, and the two of them plant every seed by lunch.",
    claim:
      "Nia and Theo faced the same trouble but acted in different ways, and Theo's calm actions changed what happened next.",
    visual: {
      kind: "venn",
      w: 560,
      h: 380,
      alt: "Two overlapping circles. Nia only: walks out, gives up. Theo only: stays, keeps going. Both: same job, same goal.",
      longDesc:
        "A Venn diagram of two story characters facing the same spill. Nia's circle: walks out and gives up at first. Theo's circle: stays and keeps going. The overlap: they have the same job and the same goal, to get the seeds planted.",
      sets: [
        { label: "Nia", items: ["walks out", "gives up"] },
        { label: "Theo", items: ["stays", "keeps going"] },
      ],
      overlap: ["same job", "same goal"],
    },
  },
  roles: [
    {
      id: "comparer",
      label: "Comparer",
      job: "Compare the two characters by what they do and prove your ideas.",
    },
    { id: "listener", label: "Listener", job: "Listen, ask for proof, and say what is clear." },
  ],
  moves: [
    move(
      "introduce",
      "Name the characters and their trouble",
      "Tell your partner who you are comparing and what goes wrong in the story.",
      {
        ee: ["The story is about ___ and ___.", "The ___ spilled."],
        dev: ["In the story, ___ and ___ have a problem. The ___ spilled."],
        exp: ["I am going to compare ___ and ___ when ___ happens."],
        br: ["I will compare how ___ and ___ respond when ___."],
      },
      "In the story, Nia and Theo have a problem. The wind spills the seeds in the class garden. I will tell what each of them does.",
      {
        wordBank: { ee: ["Nia", "Theo", "seeds", "wind"], dev: [], exp: [], br: [] },
        listenFor: "Both characters are named and the problem is stated.",
      },
    ),
    move(
      "action-nia",
      "Tell what Nia did",
      "Say what Nia does after the spill, using action words.",
      {
        ee: ["Nia ___ .", "She ___ to the door."],
        dev: ["First, Nia ___ and then she ___ ."],
        exp: ["After the spill, Nia ___, and she said ___ ."],
        br: ["Nia's first response was to ___, which she followed by ___ ."],
      },
      "Nia threw up her hands, stomped to the door and said it was all ruined.",
      {
        wordBank: { ee: ["stomped", "door", "said"], dev: [], exp: [], br: [] },
        listenFor: "A real action from the text, not just a feeling.",
      },
    ),
    move(
      "action-theo",
      "Tell what Theo did",
      "Say what Theo does after the spill, using action words.",
      {
        ee: ["Theo ___ .", "He picked up ___ ."],
        dev: ["First, Theo ___ and then he ___ ."],
        exp: ["After the spill, Theo ___, and he ___ ."],
        br: ["Theo's first response was to ___, after which he ___ ."],
      },
      "Theo took a deep breath, knelt on the floor and picked up one seed at a time.",
      {
        wordBank: { ee: ["knelt", "picked up", "cup"], dev: [], exp: [], br: [] },
        listenFor: "A real action from the text, with a detail about how he worked.",
      },
    ),
    move(
      "alike",
      "Show something the same",
      "Tell one way the two characters are alike, using both.",
      {
        ee: ["Both ___ and ___ are ___ ."],
        dev: ["Both Nia and Theo ___ ."],
        exp: ["Nia and Theo are alike because both ___ ."],
        br: ["A similarity between the two is that each ___ ."],
      },
      "Both Nia and Theo are in charge of the garden, and both want the seeds planted.",
      { listenFor: "The word both and a detail that is true for both characters." },
    ),
    move(
      "contrast",
      "Show a difference",
      "Tell how their actions are different using but, while or however.",
      {
        ee: ["Nia ___ , but Theo ___ ."],
        dev: ["Nia ___ , but Theo ___ ."],
        exp: ["While Nia ___, Theo ___ ."],
        br: ["Although Nia ___, Theo ___ ; this difference shows ___ ."],
      },
      "Nia left the room, but Theo stayed and started to work.",
      {
        wordBank: { ee: ["but", "while", "different"], dev: [], exp: [], br: [] },
        listenFor: "A contrast word that joins two different actions.",
      },
    ),
    move(
      "trait",
      "Name a trait and the proof",
      "Say what a character is like and the action that proves it.",
      {
        ee: ["Theo is ___ ."],
        dev: ["Theo is ___ because he ___ ."],
        exp: ["I think Theo is ___ because the text says he ___ ."],
        br: ["Theo's ___ is evident when he ___ ."],
      },
      "I think Theo is patient because the text says he picked up one seed at a time.",
      {
        wordBank: { ee: ["patient", "upset", "calm"], dev: [], exp: [], br: [] },
        listenFor: "A trait word and a real action from the text as proof.",
      },
    ),
    move(
      "effect",
      "Tell how one action changed what happened next",
      "Say how what one character did led to a change in the story.",
      {
        ee: ["Theo ___ , so Nia ___ ."],
        dev: ["Theo worked, so Nia ___ ."],
        exp: ["Because Theo ___, Nia ___ ."],
        br: ["Theo's ___ had the effect of ___ ."],
      },
      "Because Theo kept working, Nia peeked in, saw the cup filling up and came back to help.",
      { listenFor: "A cause and the change it led to." },
    ),
    move(
      "check",
      "Check with your partner",
      "Ask your partner to agree, disagree or add proof.",
      {
        ee: ["Do you agree?"],
        dev: ["Do you agree? What did you notice?"],
        exp: ["Do you agree with my proof, or did you notice something else?"],
        br: ["Does the evidence I gave persuade you, or would you add a detail?"],
      },
      "Do you agree with my proof, or did you notice something else?",
    ),
    move(
      "favorite",
      "Say which character you like better",
      "Tell your opinion about the characters.",
      {
        ee: ["I like ___ ."],
        dev: ["I like ___ better because ___ ."],
        exp: ["Personally, I prefer ___ because ___ ."],
        br: ["In my view, ___ is more appealing because ___ ."],
      },
      "I like Theo better because he is nice.",
      {
        notFit:
          "That is an opinion about the people. Today you are comparing what they do, with proof from the story.",
      },
    ),
    move(
      "retell",
      "Retell the whole story from the beginning",
      "Tell every part of the story in order.",
      {
        ee: ["First, ___ . Then, ___ ."],
        dev: ["First, ___ . Next, ___ . Then, ___ . Last, ___ ."],
        exp: ["The story begins when ___ . After that, ___ ."],
        br: ["The narrative opens with ___, and then ___ ."],
      },
      "First the wind spilled the seeds. Next Nia left. Then Theo picked them up. Last they planted them.",
      {
        notFit:
          "Your partner has already read the story. A comparison picks out two characters and what each one does, so you do not retell everything.",
      },
    ),
  ],
  purposes: [
    {
      id: "compare",
      label: "Compare two characters by their actions",
      description:
        "Tell what each character does, how they are alike and different, and prove it with the story.",
      moveIds: [
        "introduce",
        "action-nia",
        "action-theo",
        "alike",
        "contrast",
        "trait",
        "effect",
        "check",
        "favorite",
        "retell",
      ],
      plan: {
        prompt:
          "Choose the moves that fit a comparison of two characters, then put them in the order you would use them.",
        expected: [
          "introduce",
          ["action-nia", "action-theo"],
          ["alike", "contrast"],
          "trait",
          "effect",
          "check",
        ],
        hints: [
          "Your partner needs to know who you are talking about before you start comparing.",
          "Two of the moves are about your own opinion or the whole story. Leave them out.",
          "The actions come before the ideas you build from them, and the check comes last.",
        ],
        model:
          "Start by naming the two characters and the trouble, then tell what each one did. After the actions are on the table, say what is the same and what is different, name a trait with proof, say how one action changed what happened, and finish by checking with your partner.",
        why: [
          "Naming the characters and the trouble tells your partner what you are comparing.",
          "The actions are the facts you will compare. Either character can go first.",
          "Alike and different can go in either order once the actions are known.",
          "A trait is an idea, and the actions you already told are its proof.",
          "Showing the effect of an action connects the characters to the events.",
          "Checking with your partner makes the talk go both ways.",
        ],
      },
      rehearsal: {
        intro:
          "Your partner is a classmate who read The Spilled Seeds but is not sure how the two characters are different.",
        turns: [
          say(
            "t1",
            "I read The Spilled Seeds, but I am not sure how Nia and Theo are different. Can you compare them for me?",
            "Partner asks for a comparison.",
          ),
          turn(
            "t2",
            "Begin by telling your partner who you are comparing and what goes wrong.",
            "introduce",
            [
              opt(
                "a",
                "In the story, Nia and Theo have a problem. The wind spills the seeds in the class garden. I will tell what each of them does.",
                "strong",
                "Names both characters and the trouble, and says what the talk will do.",
              ),
              opt(
                "b",
                "Nia and Theo are in the story.",
                "partial",
                "You named the characters, but say what goes wrong and what you will compare.",
              ),
              opt(
                "c",
                "I like gardens because they are green.",
                "off",
                "That is about gardens, not about the characters. Name Nia, Theo and their trouble.",
              ),
            ],
          ),
          say(
            "t3",
            "Okay. What did Nia do when the seeds spilled?",
            "Partner asks about the first character.",
          ),
          turn("t4", "Tell what Nia did.", "action-nia", [
            opt(
              "a",
              "Nia threw up her hands, stomped to the door and said it was all ruined.",
              "strong",
              "States real actions from the story.",
            ),
            opt(
              "b",
              "Nia was mad.",
              "partial",
              "That is how she felt. Tell what she did that shows it.",
            ),
            opt(
              "c",
              "Nia is a better gardener than Theo.",
              "off",
              "The story does not say that. Tell what Nia did after the spill.",
            ),
          ]),
          say("t5", "And what about Theo?", "Partner asks about the second character."),
          turn("t6", "Tell what Theo did.", "action-theo", [
            opt(
              "a",
              "Theo took a deep breath, knelt on the floor and picked up one seed at a time.",
              "strong",
              "States real actions and how he worked.",
            ),
            opt(
              "b",
              "Theo picked up seeds.",
              "partial",
              "That is true. Add how he did it so your partner can see the difference from Nia.",
            ),
            opt(
              "c",
              "Theo is patient.",
              "off",
              "Patient is a trait. Say the action first, then the trait.",
            ),
          ]),
          say("t7", "So how are they different?", "Partner asks for a contrast."),
          turn("t8", "Show a difference between what Nia did and what Theo did.", "contrast", [
            opt(
              "a",
              "Nia left the room, but Theo stayed and started to work.",
              "strong",
              "Uses but to join two different actions.",
            ),
            opt(
              "b",
              "They are different.",
              "partial",
              "Say how they are different. Use but or while with an action for each.",
            ),
            opt(
              "c",
              "They both have names.",
              "off",
              "That is true of both, so it does not show a difference.",
            ),
          ]),
          say("t9", "That helps. What would you say Theo is like?", "Partner asks for a trait."),
          turn("t10", "Name a trait for Theo and give the proof.", "trait", [
            opt(
              "a",
              "I think Theo is patient because the text says he picked up one seed at a time.",
              "strong",
              "Names a trait and uses an action from the text as proof.",
            ),
            opt(
              "b",
              "Theo is patient.",
              "partial",
              "Good trait. Add the action from the text that proves it.",
            ),
            opt(
              "c",
              "I think Theo is silly because he is a boy.",
              "off",
              "Nothing in the story proves that. Use what he does.",
            ),
          ]),
          say(
            "t11",
            "Did Theo's actions change anything in the story?",
            "Partner asks about effect.",
          ),
          turn("t12", "Tell how Theo's actions changed what happened next.", "effect", [
            opt(
              "a",
              "Because Theo kept working, Nia peeked in, saw the cup filling up and came back to help.",
              "strong",
              "Connects a cause with the change it led to.",
            ),
            opt(
              "b",
              "Nia came back.",
              "partial",
              "True, but say why. What did Theo's work lead Nia to do?",
            ),
            opt(
              "c",
              "The seeds planted themselves.",
              "off",
              "The story says the two of them planted the seeds. Tell what led to that.",
            ),
          ]),
          say(
            "t13",
            "I think I understand the difference now. Is there anything you want to ask me?",
            "Partner leaves space for a check.",
          ),
          turn("t14", "Check in with your partner.", "check", [
            opt(
              "a",
              "Do you agree with my proof, or did you notice something else?",
              "strong",
              "Invites the partner to agree or add to your proof.",
            ),
            opt(
              "b",
              "You should agree with me.",
              "off",
              "A good talk invites the other person to think. Ask what they noticed.",
            ),
            opt(
              "c",
              "Did you hear me?",
              "partial",
              "Close, but ask about their thinking, not about hearing.",
            ),
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    { id: "s1", label: "I named both characters and the trouble in the story." },
    { id: "s2", label: "I told what each character did with real actions from the story." },
    { id: "s3", label: "I used but, while or both to show how they are different or alike." },
    { id: "s4", label: "I gave a trait and the action that proves it." },
    { id: "s5", label: "I asked my partner what they think." },
  ],
  rubric: {
    criteria: [
      {
        id: "r1",
        label: "Actions from the story",
        levels: [
          { score: 1, descriptor: "Names feelings or opinions but few actions." },
          { score: 2, descriptor: "Tells one real action for each character." },
          { score: 3, descriptor: "Tells several real actions and how each was done." },
        ],
      },
      {
        id: "r2",
        label: "Comparing",
        levels: [
          { score: 1, descriptor: "Talks about one character at a time." },
          { score: 2, descriptor: "Names one likeness or one difference." },
          { score: 3, descriptor: "Names a likeness and a difference with contrast words." },
        ],
      },
      {
        id: "r3",
        label: "Proof for a trait",
        levels: [
          { score: 1, descriptor: "Names a trait with no proof." },
          { score: 2, descriptor: "Names a trait and one action as proof." },
          { score: 3, descriptor: "Names a trait and explains how the action proves it." },
        ],
      },
      {
        id: "r4",
        label: "Talking with a partner",
        levels: [
          { score: 1, descriptor: "Does not invite the partner to share." },
          { score: 2, descriptor: "Asks the partner if they agree." },
          { score: 3, descriptor: "Asks and responds to what the partner noticed." },
        ],
      },
    ],
  },
  reflection: {
    prompt: "Which move helped your comparison the most, and what will you add next time?",
    frames: {
      ee: ["I used ___ .", "Next time I will say ___ ."],
      dev: ["The move ___ helped because ___ .", "Next time I will try ___ ."],
      exp: ["Using ___ made my comparison clearer because ___ ."],
      br: ["My comparison was strongest when I ___; next I will add ___ ."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
