// Conversation Studio: rehearse a spoken opinion with a reason, evidence and an answer to a different view. Original content; the trial data are invented for practice.
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
  id: "g5-ela-opinion-conversation",
  engine: "conversation-studio",
  title: "Talk it out: stretch breaks",
  grade: "5",
  band: "3-5",
  subject: "ela",
  lessonId: "g5-ela-opinion-writing-reasons-evidence",
  standards: ["SL.5.1", "W.5.1c"],
  vocabIds: [
    "g5-ela-opinion-writing-reasons-evidence:opinion",
    "g5-ela-opinion-writing-reasons-evidence:reason",
    "g5-ela-opinion-writing-reasons-evidence:evidence",
  ],
  minutes: 20,
  intro:
    "Your class tried short stretch breaks for two weeks. A classmate is not sure they are a good idea. Plan a talk that gives your opinion with a reason and evidence, answers the other view, and ends strongly. Then rehearse it.",
  topic: {
    title: "Should our class take a five-minute stretch break every hour?",
    context:
      "In a two-week trial, the class took a five-minute stretch break at the end of each hour of the four-hour morning block. At the end, 22 of 25 students said they could focus better after a break. The teacher noticed that the breaks added up to about 20 minutes less teaching time each day. Your partner has not made up their mind.",
    claim: "Our class should keep taking stretch breaks, because students focus better after them.",
    visual: {
      kind: "bars",
      alt: "A bar chart of the class trial. 22 students said they focus better after a break and 3 said they did not notice a difference.",
      longDesc:
        "Two bars. Focus better after a break: 22 students. No difference: 3 students. The total is 25 students.",
      xLabel: "Answer",
      yLabel: "Students",
      unit: "students",
      data: [
        { label: "Focus better", value: 22 },
        { label: "No difference", value: 3 },
      ],
    },
  },
  roles: [
    {
      id: "speaker",
      label: "Speaker",
      job: "State an opinion and support it with a reason and evidence.",
    },
    { id: "listener", label: "Listener", job: "Listen, ask for proof, and share another view." },
  ],
  moves: [
    move(
      "opinion",
      "State your opinion",
      "Tell your partner what you think about the question in one clear sentence.",
      {
        ee: ["I think ___ ."],
        dev: ["I think our class should ___ ."],
        exp: ["In my opinion, our class should ___ ."],
        br: ["I am convinced that our class should ___ ."],
      },
      "I think our class should keep taking a five-minute stretch break every hour.",
      {
        wordBank: { ee: ["stretch", "break", "class", "should"], dev: [], exp: [], br: [] },
        listenFor: "An opinion that answers the question, with should or a clear verb.",
      },
    ),
    move(
      "reason",
      "Give a reason",
      "Say why you think so, using because.",
      {
        ee: ["I think this because ___ ."],
        dev: ["I think this because ___ ."],
        exp: ["My main reason is that ___ ."],
        br: ["The primary reason I hold this view is that ___ ."],
      },
      "My main reason is that students focus better after a break.",
      { listenFor: "A reason that is connected to the opinion, not a second opinion." },
    ),
    move(
      "evidence",
      "Back the reason with a fact",
      "Give a fact, a number or a detail from the trial that proves your reason.",
      {
        ee: ["For example, ___ ."],
        dev: ["For example, ___ students said ___ ."],
        exp: ["For example, in the trial, ___ out of ___ students said ___ ."],
        br: ["The trial data support this: ___ out of ___ students reported ___ ."],
      },
      "For example, in the trial, 22 out of 25 students said they could focus better after a break.",
      {
        wordBank: { ee: ["22", "25", "students", "focus"], dev: [], exp: [], br: [] },
        listenFor: "A real number or detail from the trial.",
      },
    ),
    move(
      "acknowledge",
      "Show you heard the other view",
      "Say what the other view is and that you understand it, before you respond.",
      {
        ee: ["You think ___ ."],
        dev: ["I hear that you think ___ ."],
        exp: ["I understand your point that ___ ."],
        br: ["That is a fair concern: ___ ."],
      },
      "I understand your point that the breaks take about 20 minutes away from teaching each day.",
      { listenFor: "The partner's concern restated accurately and respectfully." },
    ),
    move(
      "rebut",
      "Answer the other view with a reason",
      "Say why your opinion still holds, using but, however or still.",
      {
        ee: ["But ___ ."],
        dev: ["But I still think ___ because ___ ."],
        exp: ["However, I still think ___ because ___ ."],
        br: ["Nevertheless, the evidence suggests that ___ , so ___ ."],
      },
      "However, I still think the breaks are worth it because students who focus better learn more in the time that is left.",
      { listenFor: "A reason that answers the other view, not just a repeat of the opinion." },
    ),
    move(
      "conclude",
      "Finish by restating your opinion",
      "End the talk by saying your opinion again and the main reason in one sentence.",
      {
        ee: ["So I think ___ ."],
        dev: ["So I think ___ because ___ ."],
        exp: ["For these reasons, I think ___ ."],
        br: ["In conclusion, I maintain that ___ because ___ ."],
      },
      "For these reasons, I think our class should keep the stretch breaks.",
      { listenFor: "The opinion again and the key reason, in different words from the opening." },
    ),
    move(
      "friends",
      "Say that everyone you know agrees",
      "Tell your partner that other people think the same.",
      {
        ee: ["My friends think ___ ."],
        dev: ["My friends and I think ___ ."],
        exp: ["Everyone I know believes ___ ."],
        br: ["The common view among my peers is ___ ."],
      },
      "Everyone I know thinks stretch breaks are great.",
      {
        notFit:
          "What your friends think is not evidence. Use a fact or a number from the trial instead.",
      },
    ),
    move(
      "attack",
      "Tell your partner their idea is silly",
      "Say that the other view is wrong or silly.",
      {
        ee: ["You are ___ ."],
        dev: ["That idea is ___ ."],
        exp: ["That is a ___ idea because ___ ."],
        br: ["That view is unreasonable because ___ ."],
      },
      "That idea is silly.",
      {
        notFit:
          "A strong speaker answers the idea, not the person. Show you heard the other view first, then give your reason.",
      },
    ),
    move(
      "weekend",
      "Tell a story about your weekend",
      "Tell about something you did over the weekend.",
      {
        ee: ["On Saturday, I ___ ."],
        dev: ["On Saturday, I ___ and then ___ ."],
        exp: ["Over the weekend, I ___ because ___ ."],
        br: ["Last weekend I happened to ___ ."],
      },
      "On Saturday, I went to the park with my cousins.",
      {
        notFit:
          "That story does not help answer the question about stretch breaks. Keep your talk on the topic.",
      },
    ),
  ],
  purposes: [
    {
      id: "argue",
      label: "Argue for an opinion",
      description:
        "State an opinion, support it with a reason and evidence, answer another view, and finish strongly.",
      moveIds: [
        "opinion",
        "reason",
        "evidence",
        "acknowledge",
        "rebut",
        "conclude",
        "friends",
        "attack",
        "weekend",
      ],
      plan: {
        prompt:
          "Choose the moves that fit an opinion talk, then put them in the order you would use them.",
        expected: ["opinion", "reason", "evidence", "acknowledge", "rebut", "conclude"],
        hints: [
          "A listener needs to know what you think before they hear why.",
          "Three of the moves do not help a listener understand or believe your opinion. Leave them out.",
          "Facts come after the reason they prove, and the ending comes after the other view has been answered.",
        ],
        model:
          "Start by saying what you think, then give a reason, then a fact that proves the reason. Show that you heard the other view, answer it with a reason, and finish by saying your opinion again.",
        why: [
          "Your opinion comes first so your partner knows what the reasons are for.",
          "A reason tells why you think so.",
          "Evidence proves the reason with a fact or number.",
          "Showing you heard the other view makes your partner willing to listen.",
          "Answering with a reason shows your opinion still holds.",
          "Ending with your opinion again leaves a clear message.",
        ],
      },
      rehearsal: {
        intro:
          "Your partner is a classmate who is on the fence about stretch breaks and worried about lost teaching time.",
        turns: [
          say(
            "t1",
            "I am not sure about the stretch breaks. What do you think we should do?",
            "Partner asks for your opinion.",
          ),
          turn("t2", "State your opinion clearly.", "opinion", [
            opt(
              "a",
              "I think our class should keep taking a five-minute stretch break every hour.",
              "strong",
              "A clear opinion that answers the question.",
            ),
            opt(
              "b",
              "Stretch breaks are okay, I guess.",
              "partial",
              "That does not take a side. Say what the class should do.",
            ),
            opt(
              "c",
              "I stretch when I wake up in the morning.",
              "off",
              "That is about you, not about what the class should do.",
            ),
          ]),
          say("t3", "Okay. Why do you think so?", "Partner asks for a reason."),
          turn("t4", "Give your main reason.", "reason", [
            opt(
              "a",
              "My main reason is that students focus better after a break.",
              "strong",
              "A reason that connects directly to the opinion.",
            ),
            opt(
              "b",
              "Because it is good.",
              "partial",
              "Say what makes it good. Name what the breaks help with.",
            ),
            opt(
              "c",
              "I also think we should have a longer lunch.",
              "off",
              "That is a different opinion. Give a reason for the breaks.",
            ),
          ]),
          say("t5", "Can you prove students focus better?", "Partner asks for evidence."),
          turn("t6", "Back your reason with a fact.", "evidence", [
            opt(
              "a",
              "For example, in the trial, 22 out of 25 students said they could focus better after a break.",
              "strong",
              "A real number from the trial that proves the reason.",
            ),
            opt(
              "b",
              "A lot of students said it helped.",
              "partial",
              "Good start. Give the number so your partner can check it.",
            ),
            opt(
              "c",
              "My friends all like the breaks.",
              "off",
              "What friends like is not evidence about focus. Use the trial.",
            ),
          ]),
          say(
            "t7",
            "But the breaks take about 20 minutes away from teaching every day. That bothers me.",
            "Partner raises a concern.",
          ),
          turn("t8", "Show that you heard the concern.", "acknowledge", [
            opt(
              "a",
              "I understand your point that the breaks take about 20 minutes away from teaching each day.",
              "strong",
              "Restates the concern accurately and respectfully.",
            ),
            opt(
              "b",
              "That does not matter.",
              "off",
              "Brushing the concern aside does not help your partner listen.",
            ),
            opt(
              "c",
              "You said something about time.",
              "partial",
              "Say exactly what the concern is so your partner knows you understood.",
            ),
          ]),
          say("t9", "So how do you answer that?", "Partner invites a response."),
          turn("t10", "Answer the concern with a reason.", "rebut", [
            opt(
              "a",
              "However, I still think the breaks are worth it because students who focus better learn more in the time that is left.",
              "strong",
              "Answers the concern with a reason connected to the evidence.",
            ),
            opt(
              "b",
              "But I still think we should do it.",
              "partial",
              "You kept your opinion, but give a reason that answers the concern.",
            ),
            opt(
              "c",
              "You are wrong about the time.",
              "off",
              "The time is a fact from the trial. Answer the concern instead of saying your partner is wrong.",
            ),
          ]),
          say(
            "t11",
            "Hmm, that makes some sense. Anything else before we decide?",
            "Partner leaves room for an ending.",
          ),
          turn("t12", "Finish by restating your opinion.", "conclude", [
            opt(
              "a",
              "For these reasons, I think our class should keep the stretch breaks.",
              "strong",
              "Restates the opinion with a closing phrase.",
            ),
            opt(
              "b",
              "That is all I have.",
              "off",
              "End with your opinion so your partner remembers it.",
            ),
            opt(
              "c",
              "So I think yes.",
              "partial",
              "Clear but short. Say what you think we should do and why.",
            ),
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    { id: "s1", label: "I stated my opinion in one clear sentence." },
    { id: "s2", label: "I gave a reason with because or my main reason is." },
    { id: "s3", label: "I used a fact or number from the trial as evidence." },
    { id: "s4", label: "I showed I heard the other view before I answered it." },
    { id: "s5", label: "I finished by restating my opinion." },
  ],
  rubric: {
    criteria: [
      {
        id: "r1",
        label: "Opinion and reason",
        levels: [
          { score: 1, descriptor: "States an opinion with no reason." },
          { score: 2, descriptor: "States an opinion and one reason." },
          { score: 3, descriptor: "States a clear opinion and a reason that connects to it." },
        ],
      },
      {
        id: "r2",
        label: "Evidence",
        levels: [
          { score: 1, descriptor: "Uses feelings or what friends think." },
          { score: 2, descriptor: "Uses a general fact without a number." },
          { score: 3, descriptor: "Uses a specific fact or number from the trial." },
        ],
      },
      {
        id: "r3",
        label: "Answering another view",
        levels: [
          { score: 1, descriptor: "Ignores or dismisses the other view." },
          { score: 2, descriptor: "Names the other view." },
          { score: 3, descriptor: "Names the other view fairly and answers it with a reason." },
        ],
      },
      {
        id: "r4",
        label: "Linking words",
        levels: [
          { score: 1, descriptor: "Ideas are stated one after another." },
          { score: 2, descriptor: "Uses because or for example." },
          {
            score: 3,
            descriptor:
              "Uses several linking words such as for example, however and for these reasons.",
          },
        ],
      },
    ],
  },
  reflection: {
    prompt:
      "Which part of your opinion talk was strongest, and what will you add when you write it down?",
    frames: {
      ee: ["The strongest part was ___ .", "I will add ___ ."],
      dev: ["The strongest part was ___ because ___ .", "When I write, I will add ___ ."],
      exp: ["My evidence was strongest because ___ ; in my writing I will add ___ ."],
      br: ["The strongest part of my talk was ___ , and I will strengthen my writing by ___ ."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
