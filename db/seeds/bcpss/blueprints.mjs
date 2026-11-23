// Canonical K-8 BCPSS grades, subjects, curricula, and 12 WIDA Language Blueprints
// (3 blueprints per Key Language Use: Argue, Explain, Inform, Narrate).

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

export const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

export const CURRICULUM_BY_GRADE_SUBJECT = {
  K: {
    ELA: "Wit & Wisdom + Fundations",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "Studies Weekly",
  },
  1: {
    ELA: "Wit & Wisdom + Fundations",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "Studies Weekly",
  },
  2: {
    ELA: "Wit & Wisdom + Fundations",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "Studies Weekly",
  },
  3: {
    ELA: "Wit & Wisdom + Fundations",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "Studies Weekly",
  },
  4: {
    ELA: "Wit & Wisdom",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "BCPSS Social Studies",
  },
  5: {
    ELA: "Wit & Wisdom",
    Math: "Reveal Math",
    Science: "SABES 5E",
    "Social Studies": "BCPSS Social Studies",
  },
  6: {
    ELA: "Wit & Wisdom",
    Math: "Reveal Math",
    Science: "IQWST",
    "Social Studies": "BCPSS Social Studies",
  },
  7: {
    ELA: "Wit & Wisdom",
    Math: "Reveal Math",
    Science: "IQWST",
    "Social Studies": "BCPSS Social Studies",
  },
  8: {
    ELA: "Wit & Wisdom",
    Math: "Reveal Math",
    Science: "IQWST",
    "Social Studies": "BCPSS Social Studies",
  },
};

export const LANGUAGE_BLUEPRINTS = [
  // =========================================================================
  // ARGUE (3)
  // =========================================================================
  {
    id: "argue-claim-evidence",
    wida_klu: "Argue",
    move_name: "State a Claim & Support with Evidence",
    syntax_pattern:
      "Claim + Evidence Connector ('because', 'according to', 'as shown by') + Cited Evidence + Reasoning",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "I think [claim] because [evidence].",
          "The [text/data] shows [evidence], so [claim].",
          "My claim is [claim]. One reason is [evidence].",
        ],
        word_bank: ["claim", "evidence", "because", "shows", "reason", "proves", "data"],
        teacher_move:
          "Pair a visual evidence card or highlighted text line with the frame; have students point to the exact line or number before speaking.",
      },
      level_3_4: {
        sentence_frames: [
          "According to [source], [claim] because [evidence].",
          "This evidence demonstrates that [claim] since [reasoning].",
          "Based on [observation/quote], it is clear that [claim].",
        ],
        word_bank: [
          "according to",
          "demonstrates",
          "supports",
          "evidence",
          "reasoning",
          "therefore",
          "significant",
        ],
        teacher_move:
          "Color-code claim (blue), evidence (green), and reasoning (amber) on an anchor sentence and ask partners to verify all three parts.",
      },
      level_5_6: {
        sentence_frames: [
          "While multiple interpretations exist, [source] compels the conclusion that [claim] because [evidence].",
          "Taken together, [evidence 1] and [evidence 2] substantiate the claim that [claim].",
          "The primary evidence from [source] confirms [claim], underscoring [broader significance].",
        ],
        word_bank: [
          "substantiate",
          "compelling",
          "corroborate",
          "underscore",
          "consequently",
          "warrant",
          "empirical",
        ],
        teacher_move:
          "Push students to explain the warrant—why their chosen evidence actually proves the claim rather than merely restating the quote or data.",
      },
    },
  },
  {
    id: "argue-justify-solution",
    wida_klu: "Argue",
    move_name: "Justify a Solution or Strategy",
    syntax_pattern:
      "Method/Choice + Justification ('works because', 'is valid since') + Mathematical/Logical Verification",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "First I [step 1], then I [step 2]. My answer is [result].",
          "I chose [strategy] because it helps me [action].",
          "My answer [result] makes sense because [check].",
        ],
        word_bank: ["first", "then", "strategy", "answer", "check", "model", "total"],
        teacher_move:
          "Let students annotate a tape diagram, number line, or table first, then narrate each label using the frame.",
      },
      level_3_4: {
        sentence_frames: [
          "I solved this by [strategy] because [mathematical/logical reason].",
          "My solution of [result] is reasonable since [verification/estimate].",
          "Rather than [alternative], I used [strategy] to show [relationship].",
        ],
        word_bank: [
          "justify",
          "reasonable",
          "equivalent",
          "verify",
          "strategy",
          "represents",
          "efficient",
        ],
        teacher_move:
          "Use 'My Favorite No' with a partner check: have students explain why one step is valid and pinpoint where an alternative breaks down.",
      },
      level_5_6: {
        sentence_frames: [
          "Applying [strategy] guarantees an accurate solution because [generalized property or rule].",
          "Although [alternative method] also yields [result], [chosen strategy] is more efficient because [justification].",
          "We can verify that [solution] satisfies every constraint by substituting [check].",
        ],
        word_bank: [
          "constraint",
          "generalize",
          "invariant",
          "verify",
          "optimal",
          "criterion",
          "valid",
        ],
        teacher_move:
          "Ask students to defend their method against a peer's different strategy using a mathematical or disciplinary criterion.",
      },
    },
  },
  {
    id: "argue-counterclaim-rebuttal",
    wida_klu: "Argue",
    move_name: "Address a Counterclaim & Rebut",
    syntax_pattern:
      "Concession ('Although some argue...') + Counterclaim + Pivot ('however', 'yet') + Evidence-Based Rebuttal",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "Some people think [counterclaim], but [rebuttal].",
          "Even though [counterclaim], I still think [claim] because [evidence].",
          "Another idea is [counterclaim]. However, the facts show [evidence].",
        ],
        word_bank: ["some", "but", "however", "although", "evidence", "disagree", "still"],
        teacher_move:
          "Stage a two-column T-chart ('Other View' vs. 'Our Evidence') so students physically cross from left to right when saying 'however'.",
      },
      level_3_4: {
        sentence_frames: [
          "Although some might argue that [counterclaim], the evidence from [source] shows [rebuttal].",
          "While it is true that [concession], this overlooks [stronger evidence].",
          "Critics may point to [counterclaim]; however, [rebuttal] proves [claim].",
        ],
        word_bank: [
          "although",
          "however",
          "counterclaim",
          "rebuttal",
          "overlooks",
          "perspective",
          "stronger",
        ],
        teacher_move:
          "Teach the semicolon + 'however,' punctuation pattern explicitly alongside oral turn-taking ('I hear X; however, Y').",
      },
      level_5_6: {
        sentence_frames: [
          "Proponents of [counterclaim] rightly note [concession]; nevertheless, [evidence] demonstrates that [rebuttal].",
          "Even if one grants that [counterclaim], the broader pattern in [source] refutes this position because [reasoning].",
          "While [counterclaim] accounts for [narrow case], it fails to explain [key evidence].",
        ],
        word_bank: [
          "proponents",
          "nevertheless",
          "refute",
          "concede",
          "nuance",
          "outweighs",
          "counterargument",
        ],
        teacher_move:
          "Require students to state the strongest version of the opposing view before rebutting it with primary evidence.",
      },
    },
  },

  // =========================================================================
  // EXPLAIN (3)
  // =========================================================================
  {
    id: "explain-cause-effect",
    wida_klu: "Explain",
    move_name: "Explain Cause & Effect",
    syntax_pattern:
      "Cause Clause + Causal Linker ('causes', 'leads to', 'as a result of') + Observable Effect",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "[Cause] happens, so [effect] happens.",
          "[Effect] happened because [cause].",
          "When [cause], it causes [effect].",
        ],
        word_bank: ["because", "so", "causes", "when", "changes", "result", "happens"],
        teacher_move:
          "Draw a simple arrow diagram ([Cause] -> [Effect]) on the board and track the arrow left-to-right for 'so/leads to' and right-to-left for 'because'.",
      },
      level_3_4: {
        sentence_frames: [
          "Because [cause], [effect] occurs as a result.",
          "An increase/change in [cause] leads to [effect] since [mechanism].",
          "As a result of [cause], [subject] experienced [effect].",
        ],
        word_bank: [
          "as a result",
          "leads to",
          "therefore",
          "consequently",
          "impact",
          "factor",
          "mechanism",
        ],
        teacher_move:
          "Contrast 'because' (followed by a clause) with 'because of' (followed by a noun phrase) using two examples from today's unit.",
      },
      level_5_6: {
        sentence_frames: [
          "The underlying [cause] triggered a chain reaction in which [intermediate step], ultimately resulting in [effect].",
          "Consequently, [cause] not only produced [immediate effect] but also reshaped [long-term outcome].",
          "Driven by [cause], [system/group] underwent [effect], as evidenced by [detail].",
        ],
        word_bank: [
          "triggered",
          "consequently",
          "underlying",
          "catalyst",
          "precipitated",
          "outcome",
          "cascade",
        ],
        teacher_move:
          "Have students map multi-step causal chains (A -> B -> C) and pack one step into a nominalized noun phrase ('erosion', 'migration', 'heating').",
      },
    },
  },
  {
    id: "explain-proportional-reasoning",
    wida_klu: "Explain",
    move_name: "Explain Proportional & Quantitative Relationships",
    syntax_pattern:
      "Rate/Ratio Statement ('For every X, there are Y') + Scaling Operation + Preserved Relationship",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "For every [number] [unit A], there are [number] [unit B].",
          "When I multiply both numbers by [factor], I get [new ratio].",
          "The unit rate is [number] [unit A] per 1 [unit B].",
        ],
        word_bank: ["for every", "per", "ratio", "rate", "multiply", "equal", "group"],
        teacher_move:
          "Keep units glued to numbers at all times ('3 cups per 2 batches', never bare '3 to 2') using color-coded unit labels.",
      },
      level_3_4: {
        sentence_frames: [
          "The relationship between [quantity A] and [quantity B] stays equivalent because both scale by [factor].",
          "At a constant rate of [value] [unit A] per [unit B], [amount] requires [result].",
          "Since [ratio 1] equals [ratio 2], the two quantities are proportional.",
        ],
        word_bank: [
          "equivalent",
          "proportional",
          "constant",
          "scale factor",
          "unit rate",
          "per",
          "corresponds",
        ],
        teacher_move:
          "Bridge a ratio table or double number line directly into the sentence frame so students read horizontally ('for every') and vertically ('scaled by').",
      },
      level_5_6: {
        sentence_frames: [
          "Because the constant of proportionality is [k] [unit A] per [unit B], any change in [quantity B] scales [quantity A] multiplicatively.",
          "Comparing the unit rates reveals that [option A] is more [efficient/cost-effective] by [difference] per [unit].",
          "Although the additive difference changes, the multiplicative ratio [a:b] remains invariant across the table.",
        ],
        word_bank: [
          "constant of proportionality",
          "multiplicative",
          "invariant",
          "unit rate",
          "scale",
          "linear",
          "equivalent",
        ],
        teacher_move:
          "Explicitly contrast additive language ('plus 4 more') with multiplicative language ('4 times as many') to eliminate the #1 ratio misconception.",
      },
    },
  },
  {
    id: "explain-process-system",
    wida_klu: "Explain",
    move_name: "Explain a Process, Cycle, or System",
    syntax_pattern:
      "System Input/Component + Sequential Action Verb + Interaction + System Output",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "First, [part 1] [action]. Next, [part 2] [action].",
          "[Component] works with [component] to make [output].",
          "Inside this system, [input] turns into [output].",
        ],
        word_bank: ["first", "next", "then", "finally", "system", "part", "moves"],
        teacher_move:
          "Point to numbered stages on a labeled diagram while students chorally read the sequence verbs before writing.",
      },
      level_3_4: {
        sentence_frames: [
          "During [stage], [component] interacts with [component], which allows [process] to continue.",
          "This process begins when [input] enters [system] and ends when [output] is produced.",
          "If [component] is disrupted, then [downstream part] cannot [function].",
        ],
        word_bank: [
          "process",
          "interacts",
          "transfers",
          "cycle",
          "component",
          "transforms",
          "energy",
        ],
        teacher_move:
          "Highlight active scientific/procedural verbs ('absorbs', 'transfers', 'regroups', 'circulates') and ban vague verbs like 'does' or 'goes'.",
      },
      level_5_6: {
        sentence_frames: [
          "Within the [system], [component A] drives [process] by [mechanism], maintaining equilibrium across [whole system].",
          "As [input] undergoes [transformation], [conserved quantity] is redistributed rather than lost.",
          "Any perturbation to [variable] alters the rate of [process], demonstrating how interdependent the components are.",
        ],
        word_bank: [
          "equilibrium",
          "interdependent",
          "mechanism",
          "redistribution",
          "conservation",
          "feedback",
          "perturbation",
        ],
        teacher_move:
          "Prompt students to explain both the micro-level mechanism and the macro-level observable output in a single cohesive paragraph.",
      },
    },
  },

  // =========================================================================
  // INFORM (3)
  // =========================================================================
  {
    id: "inform-compare-contrast",
    wida_klu: "Inform",
    move_name: "Compare & Contrast Attributes or Perspectives",
    syntax_pattern:
      "Shared Feature ('Both X and Y...') + Contrast Marker ('whereas', 'in contrast') + Distinguishing Feature",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "Both [A] and [B] have [similarity].",
          "[A] is [trait], but [B] is [different trait].",
          "[A] and [B] are alike because [similarity], and different because [difference].",
        ],
        word_bank: ["both", "same", "alike", "different", "but", "more", "less"],
        teacher_move:
          "Use a Venn diagram with sentence strips placed physically across the center ('Both...') and outer rings ('...but...').",
      },
      level_3_4: {
        sentence_frames: [
          "Both [A] and [B] share [similarity]; however, [A] [feature] whereas [B] [feature].",
          "Unlike [A], which [feature], [B] [contrasting feature].",
          "A key similarity between [A] and [B] is [trait], while an important difference is [trait].",
        ],
        word_bank: [
          "similarly",
          "whereas",
          "unlike",
          "in contrast",
          "attribute",
          "perspective",
          "distinguish",
        ],
        teacher_move:
          "Model parallel grammatical structure on both sides of 'whereas' so both clauses compare the exact same attribute.",
      },
      level_5_6: {
        sentence_frames: [
          "While [A] and [B] converge on [shared criterion], they diverge significantly in [contrasting criterion].",
          "In contrast to [A], which relies on [mechanism/feature], [B] achieves [outcome] through [alternative].",
          "Examining [A] alongside [B] reveals that [criterion] accounts for their primary difference.",
        ],
        word_bank: [
          "converge",
          "diverge",
          "criterion",
          "in contrast to",
          "parallel",
          "distinction",
          "whereas",
        ],
        teacher_move:
          "Ask students to name the comparison criterion explicitly (e.g., 'in terms of scale', 'in terms of governance') before contrasting.",
      },
    },
  },
  {
    id: "inform-classify-define",
    wida_klu: "Inform",
    move_name: "Classify, Define & Describe Precise Attributes",
    syntax_pattern:
      "Term + Category ('is a type of...') + Defining Relative Clause ('that has / which measures...') + Non-Example",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "A [term] is a kind of [category] that has [attribute].",
          "I know this is a [term] because it has [feature].",
          "[Item] belongs in the [group] group because [rule].",
        ],
        word_bank: ["kind of", "group", "sort", "attribute", "has", "belongs", "rule"],
        teacher_move:
          "Use a Frayer Model with quick sketches and a non-example so students test their definition against a tricky counterexample.",
      },
      level_3_4: {
        sentence_frames: [
          "[Term] can be classified as [category] because its defining attributes include [feature 1] and [feature 2].",
          "Unlike [non-example], a [term] always [necessary condition].",
          "We distinguish [term] from [related term] by examining [observable property].",
        ],
        word_bank: [
          "classify",
          "category",
          "defining",
          "property",
          "characteristic",
          "criteria",
          "distinguish",
        ],
        teacher_move:
          "Have students revise a loose everyday description ('it's pointy') into a precise disciplinary definition using 'that/which' relative clauses.",
      },
      level_5_6: {
        sentence_frames: [
          "Within [domain], [term] is defined as [superordinate category] characterized by [necessary and sufficient properties].",
          "Although [borderline example] shares [superficial trait], it is excluded from [category] because it lacks [defining criterion].",
          "Taxonomically, [term] bridges [category A] and [category B] through [attribute].",
        ],
        word_bank: [
          "characterized by",
          "necessary",
          "sufficient",
          "criterion",
          "taxonomy",
          "exclude",
          "property",
        ],
        teacher_move:
          "Challenge students with a borderline case ('Is a square a rectangle? Is a virus living?') to sharpen precision in defining clauses.",
      },
    },
  },
  {
    id: "inform-summarize-main-idea",
    wida_klu: "Inform",
    move_name: "Summarize Central Idea & Key Details",
    syntax_pattern:
      "Central Idea Statement + Synthesis Verb ('illustrates', 'highlights') + 2-3 Essential Details",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "This [text/topic] is mostly about [main idea].",
          "One important detail is [detail 1]. Another detail is [detail 2].",
          "I learned that [central idea] from [section/picture].",
        ],
        word_bank: ["mostly about", "main idea", "detail", "important", "topic", "learned", "fact"],
        teacher_move:
          "Use the '10-Word Gist' routine on sticky notes before expanding into the two-sentence summary frame.",
      },
      level_3_4: {
        sentence_frames: [
          "The central idea of [source] is that [main idea], which is supported by [key detail 1] and [key detail 2].",
          "In summary, [author/section] explains how [central idea] by highlighting [key details].",
          "Three essential details—[detail 1], [detail 2], and [detail 3]—develop the main idea that [central idea].",
        ],
        word_bank: [
          "central idea",
          "summarize",
          "essential",
          "highlights",
          "develops",
          "key detail",
          "objective",
        ],
        teacher_move:
          "Coach students to strip out personal opinions ('I liked...') and minor trivia so summaries remain objective and concise.",
      },
      level_5_6: {
        sentence_frames: [
          "[Author/Source] advances the central idea that [thesis] by synthesizing [evidence thread 1] with [evidence thread 2].",
          "Across [sections/sources], a cohesive pattern emerges: [central idea], underscored by [essential details].",
          "Distilling [source] objectively reveals that [central idea] hinges on [key mechanism or shift].",
        ],
        word_bank: [
          "advances",
          "synthesizing",
          "cohesive",
          "objective",
          "distill",
          "underscored",
          "central",
        ],
        teacher_move:
          "Have students condense a 5-sentence summary into 2 dense sentences using appositives and participial phrases.",
      },
    },
  },

  // =========================================================================
  // NARRATE (3)
  // =========================================================================
  {
    id: "narrate-sequence-events",
    wida_klu: "Narrate",
    move_name: "Sequence Events & Turning Points",
    syntax_pattern:
      "Temporal Anchor ('Initially', 'After...', 'At the turning point') + Past-Tense Action + Consequence",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "First, [event 1]. Next, [event 2]. Finally, [event 3].",
          "In the beginning, [character/group] [action]. Then, [turning point].",
          "After [event 1], [character/group] decided to [event 2].",
        ],
        word_bank: ["first", "next", "then", "after", "finally", "beginning", "end"],
        teacher_move:
          "Sequence 3–4 picture or timeline cards physically on desks before orally rehearsing past-tense verbs.",
      },
      level_3_4: {
        sentence_frames: [
          "Initially, [situation]; however, once [turning point], [consequence unfolded].",
          "Following [earlier event], [character/group] responded by [action], which led to [outcome].",
          "Over time, [event 1] shifted into [event 2] as [catalyst occurred].",
        ],
        word_bank: [
          "initially",
          "following",
          "meanwhile",
          "turning point",
          "eventually",
          "responded",
          "chronological",
        ],
        teacher_move:
          "Check verb tense consistency across the sequence (simple past + past perfect for earlier background events).",
      },
      level_5_6: {
        sentence_frames: [
          "Prior to [turning point], [context prevailed]; in the aftermath, [group/character] navigated [shift].",
          "The sequence from [event 1] to [event 2] marks a decisive inflection point because [significance].",
          "Simultaneously, while [parallel event] unfolded, [subject] confronted [challenge].",
        ],
        word_bank: [
          "prior to",
          "aftermath",
          "simultaneously",
          "inflection point",
          "unfolded",
          "culminated",
          "chronology",
        ],
        teacher_move:
          "Ask students to link chronology to causality so their narrative explains *why* the order of events mattered.",
      },
    },
  },
  {
    id: "narrate-perspective-dialogue",
    wida_klu: "Narrate",
    move_name: "Convey Perspective, Voice & Motivation",
    syntax_pattern:
      "Point-of-View Signal ('From X's perspective...') + Internal Motivation/Dialogue + Contrast with Another View",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "[Character/Person] felt [emotion] because [reason].",
          "When [character] said '[quote]', they wanted [goal].",
          "From [character]'s view, [event] was [adjective].",
        ],
        word_bank: ["felt", "wanted", "said", "view", "thought", "because", "hoped"],
        teacher_move:
          "Use thought bubbles and speech bubbles on a storyboard so students separate what a character *says* from what they *feel/want*.",
      },
      level_3_4: {
        sentence_frames: [
          "From [character/person]'s perspective, [event] mattered because [motivation or value].",
          "Through the dialogue '[quote]', the author reveals that [character] values [trait/goal].",
          "Unlike [other person], [character] viewed [situation] as [interpretation].",
        ],
        word_bank: [
          "perspective",
          "motivation",
          "reveals",
          "dialogue",
          "point of view",
          "values",
          "reacts",
        ],
        teacher_move:
          "Model precise reporting verbs ('insisted', 'whispered', 'questioned', 'pleaded') to replace overused 'said'.",
      },
      level_5_6: {
        sentence_frames: [
          "By filtering [event] through [narrator]'s perspective, the text foregrounds [tension] while obscuring [other view].",
          "[Character]'s choice to [action/dialogue] exposes an internal conflict between [value 1] and [value 2].",
          "Juxtaposing [voice A] with [voice B] illustrates how lived experience shapes interpretation.",
        ],
        word_bank: [
          "foregrounds",
          "juxtaposing",
          "internal conflict",
          "subjective",
          "nuanced",
          "voice",
          "motive",
        ],
        teacher_move:
          "Have students rewrite a 3-sentence scene from a secondary character's or historical witness's viewpoint, shifting evaluative adjectives.",
      },
    },
  },
  {
    id: "narrate-problem-resolution",
    wida_klu: "Narrate",
    move_name: "Trace Problem, Conflict & Resolution",
    syntax_pattern:
      "Inciting Conflict ('Faced with...') + Attempts/Obstacles + Resolution + Theme/Lesson",
    scaffolds_json: {
      level_1_2: {
        sentence_frames: [
          "The problem was [conflict]. [Character] solved it by [action].",
          "At first, [character] could not [goal], so they tried [attempt].",
          "In the end, [resolution], and [character] learned [lesson].",
        ],
        word_bank: ["problem", "conflict", "tried", "solved", "resolution", "changed", "lesson"],
        teacher_move:
          "Use the Somebody-Wanted-But-So-Then (SWBST) graphic organizer to scaffold oral retelling before writing.",
      },
      level_3_4: {
        sentence_frames: [
          "Faced with [conflict], [character/group] attempted to [strategy], which resulted in [complication or progress].",
          "The central conflict is resolved when [resolution], demonstrating the theme that [theme].",
          "Because [obstacle] stood in the way, [character] had to adapt by [action].",
        ],
        word_bank: [
          "conflict",
          "obstacle",
          "resolution",
          "theme",
          "adapt",
          "perseverance",
          "consequence",
        ],
        teacher_move:
          "Guide students to distinguish the *plot resolution* (what happened) from the *theme* (the universal takeaway).",
      },
      level_5_6: {
        sentence_frames: [
          "Although [character/group] initially confronted [conflict] through [approach], true resolution required [deeper shift].",
          "The tension between [force A] and [force B] culminates in [climax], reframing [theme].",
          "Rather than offering a simple fix, the resolution leaves [complexity], underscoring [insight].",
        ],
        word_bank: [
          "culminates",
          "reframing",
          "tension",
          "catalyst",
          "transformation",
          "complexity",
          "resilience",
        ],
        teacher_move:
          "Ask students to trace how the protagonist or historical actors *changed* between the inciting problem and the final resolution.",
      },
    },
  },
];
