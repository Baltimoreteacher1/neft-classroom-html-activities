// Project: grade 7 math, statistics. Sample a population, see how estimates vary, compare two groups, recommend a decision. Original.
// The two populations below are invented for the project; the totals, means and mean absolute deviations in the text are exact for these values.
const lv = (score, label, descriptor) => ({ score, label, descriptor });
const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const slipTable = (alt, longDesc, rows) => ({
  kind: "table",
  w: 480,
  h: 330,
  alt,
  longDesc,
  head: ["Row", "a", "b", "c", "d", "e"],
  rows: rows.map((r, i) => [String(i + 1), ...r]),
});

const grade7 = slipTable(
  "Population table for grade 7: 40 slips, each a number of minutes of homework in one night, in 8 rows of 5.",
  "Grade 7 slips, in minutes. Row 1: 15, 20, 20, 25, 25. Row 2: 30, 30, 30, 30, 35. Row 3: 35, 35, 35, 40, 40. Row 4: 40, 40, 40, 45, 45. Row 5: 45, 45, 50, 50, 50. Row 6: 50, 55, 55, 60, 60. Row 7: 60, 65, 70, 75, 80. Row 8: 25, 30, 35, 40, 45.",
  [
    ["15", "20", "20", "25", "25"],
    ["30", "30", "30", "30", "35"],
    ["35", "35", "35", "40", "40"],
    ["40", "40", "40", "45", "45"],
    ["45", "45", "50", "50", "50"],
    ["50", "55", "55", "60", "60"],
    ["60", "65", "70", "75", "80"],
    ["25", "30", "35", "40", "45"],
  ],
);

const grade8 = slipTable(
  "Population table for grade 8: 40 slips, each a number of minutes of homework in one night, in 8 rows of 5.",
  "Grade 8 slips, in minutes. Row 1: 25, 30, 35, 40, 40. Row 2: 45, 45, 50, 50, 50. Row 3: 55, 55, 55, 55, 60. Row 4: 60, 60, 60, 60, 65. Row 5: 65, 65, 65, 70, 70. Row 6: 70, 75, 75, 80, 80. Row 7: 85, 90, 95, 100, 45. Row 8: 50, 55, 60, 65, 45.",
  [
    ["25", "30", "35", "40", "40"],
    ["45", "45", "50", "50", "50"],
    ["55", "55", "55", "55", "60"],
    ["60", "60", "60", "60", "65"],
    ["65", "65", "65", "70", "70"],
    ["70", "75", "75", "80", "80"],
    ["85", "90", "95", "100", "45"],
    ["50", "55", "60", "65", "45"],
  ],
);

const studyFlow = {
  kind: "flow",
  w: 480,
  h: 200,
  alt: "Five steps of the study: ask a question, choose a sample, repeat the sample, compare two groups, make a recommendation.",
  steps: [
    { label: "Ask a statistical question" },
    { label: "Choose a random sample" },
    { label: "Repeat and see the spread" },
    { label: "Compare two groups" },
    { label: "Recommend" },
  ],
};

const samplingMethods = {
  kind: "table",
  w: 480,
  h: 250,
  alt: "Comparison of three ways to pick a sample from slips in a bag: the first ten on the list, ten volunteers, and ten slips drawn at random. Only the random draw gives every slip the same chance.",
  longDesc:
    "First ten on the list: easy, but only the top of the list is chosen, so the sample is biased. Ten volunteers: people who choose themselves may differ from the rest. Ten slips drawn at random: every slip has the same chance, so the sample is more likely to represent the whole population.",
  head: ["Method", "Every slip has the same chance?", "Trust it?"],
  rows: [
    ["First ten on the list", "No", "No, it is biased"],
    ["Ten volunteers", "No", "Not by itself"],
    ["Ten drawn at random", "Yes", "Yes, and check the spread"],
  ],
};

export default {
  id: "homework-minutes-sampling-study",
  kind: "project",
  title: "How Much Homework Is Too Much? A Sampling Study",
  subtitle: "Random samples, how much estimates vary, and a recommendation to the school council",
  drivingQuestion:
    "How can a random sample tell us what a whole grade level does, how much can we trust it, and what should we recommend to the school council because of it?",
  studentQuestion:
    "If we only ask ten students, how close can we get to what the whole grade reports, and when should we not trust what we see?",
  grade: "7",
  grades: ["7"],
  band: "6-8",
  bands: ["6-8"],
  subject: "math",
  subjects: ["math"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS 7.SP.A.1, 7.SP.A.2, 7.SP.B.3 and 7.SP.B.4 plus SL.7.1; not mapped to a district unit sequence. The two populations of 40 values are invented for this project.",
  },
  standards: ["7.SP.A.1", "7.SP.A.2", "7.SP.B.3", "7.SP.B.4", "SL.7.1"],
  wida: {
    eld: ["ELD-MA", "ELD-SI"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "6-8",
  },
  sessions: 10,
  sessionMinutes: 50,
  duration: 500,
  intro:
    "A school council wants to decide whether grade 7 and grade 8 should have different homework guidelines. Nobody can ask every student, so your team will use samples. You will draw slips from two bags, one for each grade, where each slip is the number of minutes of homework one student reports on a typical night. You will compare a convenient sample with a random sample, repeat random samples to see how much estimates move, find the center and the spread for each grade, and decide how different the grades really are. You finish with a recommendation to the council that says both what the data suggests and how sure you are.",
  hook: "Ask five volunteers how many minutes of homework they did last night and write the numbers on the board. Ask: can we say what the whole grade does? Why or why not?",
  contentTargets: [
    "I can explain why a random sample is more likely to represent a population than a convenient sample.",
    "I can draw several random samples of the same size and describe how the sample means vary.",
    "I can find the mean and the mean absolute deviation of a sample and compare two groups.",
    "I can describe the difference between two groups as a multiple of the variability and say how sure I am.",
  ],
  languageTargets: [
    {
      function: "Justify a claim about a population",
      structure:
        "Based on our random samples, we estimate that ___. We are fairly sure because ___, but the samples varied from ___ to ___.",
      text: "I can state an estimate with the range of my samples and explain why it is reasonable.",
    },
    {
      function: "Compare two groups with evidence",
      structure:
        "The mean for grade ___ is about ___ minutes more than grade ___, which is about ___ times the typical spread.",
      text: "I can compare two groups using the mean and the mean absolute deviation.",
    },
  ],
  materials: [
    "Two bags or boxes of 40 slips each, one per grade, with the numbers from the population tables (teacher prepares from this page)",
    "A random number tool: number cubes, a random number generator or a deck of numbered cards",
    "Calculators",
    "Dot plot paper or a number line display for sample means",
    "Data tables for samples and for summary statistics",
    "Whiteboards or poster paper for the council presentation",
  ],
  prep: [
    "Print the two populations from the visuals on this page and cut them into 40 slips for each grade. Keep the slips in separate bags, labeled grade 7 and grade 8. These are invented values, so no real student's data is used.",
    "Know the true population values so you can reveal them at the end. Grade 7: sum 1,700 minutes, mean 42.5, median 40, mean absolute deviation 12. Grade 8: sum 2,400, mean 60, median 60, mean absolute deviation 12.75. The difference between the means is 17.5 minutes, about 1.4 times the typical spread of about 12 to 13 minutes.",
    "The slips are printed in order from low to high at the start of each list. That is on purpose: the first ten slips in the list have means of 26 for grade 7 and 41 for grade 8, far below the true means, so a convenience sample from the top of the list is visibly biased.",
    "Decide how students will choose slips at random: shuffle and draw without looking, or use a random number tool to pick slip numbers from 1 to 40. Teams must put each slip back or use new slips for each sample, as you decide.",
    "If you want to use real survey data from your school, plan an anonymous survey with permission from your school leaders and avoid collecting names. This project works with the invented data on this page.",
  ],
  facilitation: [
    {
      day: 1,
      title: "A statistical question and a population",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Use the hook data. Ask students to name the population (all students in a grade) and the sample (the five volunteers). Write both words on the board.",
        "Introduce the question: how many minutes of homework do students report on a typical night, and does grade 8 report more than grade 7?",
      ],
      students: [
        "Write one statistical question about homework time.",
        "Name the population and describe one way the volunteer sample might be misleading.",
      ],
      watchFor:
        "Statistical questions that have one answer (for example, 'How old is our teacher?'). A statistical question expects different answers.",
    },
    {
      day: 2,
      title: "A convenient sample",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Give each team the grade 7 table. Ask them to take the first ten values on the list and find the mean.",
        "Reveal the true mean later in the day and discuss why the sample was low.",
      ],
      students: [
        "Find the mean of the first ten values.",
        "Write why the sample is not representative.",
      ],
      watchFor:
        "Students who think more data always fixes the problem. Ask what changes if they took the first 20 values.",
    },
    {
      day: 3,
      title: "A random sample",
      checkpoint: "cp2",
      minutes: 50,
      teacher: [
        "Model drawing ten slips at random from the grade 7 bag. Record the values and the mean.",
        "Teams draw their own sample of ten, record the numbers and find the mean.",
      ],
      students: [
        "Draw a random sample of 10.",
        "Compute the mean and record it on the class dot plot.",
      ],
      watchFor:
        "Teams choosing slips by looking. Require a method that gives every slip the same chance.",
    },
    {
      day: 4,
      title: "Repeat the sample",
      checkpoint: "cp2",
      minutes: 50,
      teacher: [
        "Teams draw at least five random samples of ten from each bag and record each mean. Gather the class means in a dot plot for each grade.",
        "Ask: where do the sample means cluster? How far apart are they?",
      ],
      students: [
        "Record at least five sample means for each grade.",
        "Describe the shape of the class dot plot.",
      ],
      watchFor: "Averaging only one sample. Ask what the other samples show.",
    },
    {
      day: 5,
      title: "Center and spread",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Teach or review the mean absolute deviation: find the mean, find each distance from the mean, average the distances.",
        "Teams compute the mean and the MAD of one sample for each grade.",
      ],
      students: [
        "Find the mean and the MAD of a sample for each grade.",
        "Explain what the MAD tells about the data.",
      ],
      watchFor:
        "Subtracting without taking absolute value. Ask what a negative distance would mean.",
    },
    {
      day: 6,
      title: "Compare the grades",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Teams compare the sample means and MADs. Ask them to describe the difference as a multiple of the MAD.",
        "Discuss: do the two dot plots overlap, and what does that mean for our conclusion?",
      ],
      students: [
        "Find the difference between the means.",
        "Say how many times larger that difference is than the MAD.",
      ],
      watchFor: "Comparing only the highest values. Ask for centers and spread.",
    },
    {
      day: 7,
      title: "Reveal the populations",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Share the true population means and MADs. Ask: how close were our estimates, and which method got closer, convenience or random?",
        "Teams revise their estimates and write what they would do with a larger sample.",
      ],
      students: [
        "Compare the estimate with the true mean.",
        "Write one change they would make to the study.",
      ],
      watchFor:
        "Students who feel the random samples were wrong when they varied. Variation is expected.",
    },
    {
      day: 8,
      title: "Draft a recommendation",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Present the council's question: should the grades have different homework guidelines? Teams draft a recommendation that uses their numbers and states a limit on what they can claim.",
        "Model a paragraph that states a claim, the evidence and a caution.",
      ],
      students: ["Draft the recommendation.", "Add one caution about sample size or spread."],
      watchFor: "Recommendations that make claims about individual students rather than the group.",
    },
    {
      day: 9,
      title: "Prepare the presentation",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Teams make a one-page display: two dot plots, a summary table and a recommendation. Rehearse a 2-minute talk.",
        "Peers use the feedback frames on this page.",
      ],
      students: ["Build the display.", "Rehearse and revise."],
      watchFor: "Graphs without titles or units. Add the number of samples and minutes.",
    },
    {
      day: 10,
      title: "Present to the council",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Teams present to a council made up of staff and visiting classes. Council members ask one question about sampling and one about the recommendation.",
        "Close with the self-assessment.",
      ],
      students: ["Present.", "Answer questions with evidence."],
      watchFor: "Council questions about opinions rather than data. Redirect to the evidence.",
    },
  ],
  studentDirections: [
    "Write a statistical question about homework time. Name the population.",
    "Take the first ten values on the grade 7 table. Find the mean. Say why this sample is not trustworthy.",
    "Draw a random sample of ten slips from each grade. Record the values and find each mean.",
    "Repeat until you have at least five random samples for each grade. Make a dot plot of the sample means.",
    "Find the mean absolute deviation of one sample from each grade.",
    "Find the difference between the grade means. Say how many times larger it is than the typical spread.",
    "Compare your estimate to the true population values. Say what you learned about sampling.",
    "Write a recommendation to the school council. Include a claim, your evidence and a caution.",
    "Present your display and answer questions.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Question, population and a biased sample",
      days: "Sessions 1 and 2",
      evidence:
        "A statistical question, a named population, the mean of the first ten values on the grade 7 table (26 minutes), and a sentence explaining why that sample is biased.",
      prompt:
        "Write your question and name the population. Find the mean of the first ten values and explain why it is not trustworthy.",
      teacherLook: [
        "The question expects variation in answers.",
        "The mean of the first ten grade 7 values is 26 minutes, which is below the true mean.",
        "The explanation names that the first rows are not a random choice, so some values could never be picked.",
      ],
      tool: null,
    },
    {
      id: "cp2",
      title: "Random samples and their means",
      days: "Sessions 3 and 4",
      evidence:
        "At least five random samples of ten for each grade with the values and the mean of each, and a dot plot of the sample means.",
      prompt:
        "Draw at least five random samples of ten from each bag. Find each mean and plot them.",
      teacherLook: [
        "The method gives every slip the same chance.",
        "Each mean is the sum divided by 10 and the arithmetic is correct.",
        "Grade 7 sample means cluster around 42.5 and grade 8 sample means cluster around 60, though individual samples vary.",
      ],
      tool: null,
    },
    {
      id: "cp3",
      title: "Center, spread and comparison",
      days: "Sessions 5 and 6",
      evidence:
        "The mean and the mean absolute deviation of one sample for each grade, the difference of the means, and a statement of that difference as a multiple of the MAD.",
      prompt:
        "Find the mean and MAD for each sample. Compare the grades with the difference of means.",
      teacherLook: [
        "The MAD is computed from absolute distances.",
        "The comparison compares centers and uses the spread, not just the highest values.",
        "The statement says about how many MADs apart the centers are.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Estimate, check and recommendation draft",
      days: "Sessions 7 and 8",
      evidence:
        "A comparison of the estimate with the true values, a note on what the team would change about the study, and a recommendation paragraph with a claim, evidence and caution.",
      prompt: "Compare your estimate to the true values. Draft your recommendation with a caution.",
      teacherLook: [
        "The true values are mean 42.5 for grade 7 and 60 for grade 8, a difference of 17.5 minutes.",
        "The recommendation uses numbers and not only opinion.",
        "The caution mentions sample size or variation.",
      ],
      tool: null,
    },
    {
      id: "cp5",
      title: "Council presentation",
      days: "Sessions 9 and 10",
      evidence:
        "A one-page display with two dot plots, a summary table and a recommendation, plus a two-minute presentation.",
      prompt: "Present your display and answer two council questions.",
      teacherLook: [
        "Graphs have titles and units.",
        "The talk says how the sample was chosen and why that matters.",
        "Answers use the data.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "flow",
      title: "The study in five steps",
      caption: "We ask, sample, repeat, compare and recommend.",
      visual: studyFlow,
    },
    {
      id: "methods",
      title: "Three ways to pick a sample",
      caption: "Only a random draw gives every slip the same chance.",
      visual: samplingMethods,
    },
    {
      id: "grade7",
      title: "Grade 7 population (40 slips)",
      caption:
        "Invented data: minutes of homework reported by 40 students. Cut into slips and keep in one bag.",
      visual: grade7,
      teacherNote:
        "Sum 1,700 minutes, mean 42.5, median 40, mean absolute deviation 12. The first ten values on the list have a mean of 26.",
    },
    {
      id: "grade8",
      title: "Grade 8 population (40 slips)",
      caption:
        "Invented data: minutes of homework reported by 40 students. Cut into slips and keep in a second bag.",
      visual: grade8,
      teacherNote:
        "Sum 2,400 minutes, mean 60, median 60, mean absolute deviation 12.75. The first ten values on the list have a mean of 41.",
    },
  ],
  organizers: [
    {
      template: "partner-project",
      use: "Roles, plan and reflection for the study team (all checkpoints).",
    },
    {
      template: "cer",
      use: "Claim, evidence and reasoning for the recommendation (checkpoint 4).",
    },
    { template: "gallery-walk", use: "Council display stations (checkpoint 5)." },
  ],
  vocab: {
    entries: [
      {
        id: "population",
        word: "population",
        def: "The whole group you want to learn about.",
        example: "The population is all 40 grade 7 students.",
      },
      {
        id: "sample",
        word: "sample",
        def: "A part of the population that you actually study.",
        example: "Our sample was 10 slips from the bag.",
      },
      {
        id: "random-sample",
        word: "random sample",
        def: "A sample where every member has the same chance of being chosen.",
        example: "Drawing slips without looking gives a random sample.",
      },
      {
        id: "biased",
        word: "biased",
        def: "Unfairly leaning one way because of how the sample was chosen.",
        example: "The first ten slips are a biased sample.",
      },
      {
        id: "representative",
        word: "representative",
        def: "Showing what the whole population is like.",
        example: "A random sample is more likely to be representative.",
      },
      {
        id: "mean",
        word: "mean",
        def: "The sum of the values divided by how many values there are.",
        example: "The mean of the sample is 40 minutes.",
      },
      {
        id: "mad",
        word: "mean absolute deviation",
        def: "The average distance of the values from their mean.",
        example: "The MAD tells how spread out the data is.",
      },
      {
        id: "variability",
        word: "variability",
        def: "How spread out or different the values in a data set are.",
        example: "Sample means show variability.",
      },
      {
        id: "inference",
        word: "inference",
        def: "A conclusion about a population based on data from a sample.",
        example: "Our inference is that grade 8 reports more minutes.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner. Use the table and say each step aloud. Point to the numbers as you talk and use the frames.",
      frames: [
        "The sample is ___ slips.",
        "The mean is ___ minutes.",
        "Grade ___ has more minutes.",
      ],
      wordBank: [
        "sample",
        "population",
        "mean",
        "minutes",
        "random",
        "bag",
        "more",
        "less",
        "compare",
      ],
      oral: "Partner A draws a slip and says the number. Partner B writes it. Switch.",
    },
    dev: {
      directions: "Use the frames. Say your claim to a partner before you write it.",
      frames: [
        "Our random sample has a mean of ___ minutes.",
        "The sample is biased because ___.",
        "Grade ___ reports about ___ minutes more than grade ___.",
      ],
      wordBank: [
        "population",
        "random sample",
        "biased",
        "mean",
        "mean absolute deviation",
        "estimate",
        "compare",
      ],
      oral: "Explain to a partner why a random sample is better than the first ten slips.",
    },
    exp: {
      directions:
        "Write full sentences and include an estimate and a caution. Use frames to start.",
      frames: [
        "Our estimate is ___, but samples ranged from ___ to ___, so ___.",
        "The difference of ___ minutes is about ___ times the typical spread, so ___.",
      ],
      wordBank: [
        "representative",
        "variability",
        "inference",
        "overlap",
        "reasonable",
        "confident",
      ],
      oral: "Argue whether the evidence supports separate guidelines for each grade.",
    },
    br: {
      directions:
        "Write precisely. State the claim, quantify the difference as a multiple of the MAD and name one limitation of your study.",
      frames: [],
      wordBank: [
        "sampling variability",
        "informal inference",
        "multiple of the MAD",
        "generalize",
        "limitation",
      ],
      oral: "Critique another team's sampling method and suggest one improvement.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "sampling",
        label: "Sampling method and bias",
        levels: [
          lv(
            4,
            "Extending",
            "Chooses random samples correctly, explains why the convenience sample is biased with numbers, and suggests a better sampling design.",
          ),
          lv(
            3,
            "Meeting",
            "Draws random samples that give every slip the same chance and explains why the convenience sample is biased.",
          ),
          lv(
            2,
            "Approaching",
            "Draws samples but one method is not random, or the explanation of bias is vague.",
          ),
          lv(
            1,
            "Beginning",
            "Chooses slips by looking or does not distinguish random from convenient.",
          ),
        ],
      },
      {
        id: "variation",
        label: "Repeating samples and variation",
        levels: [
          lv(
            4,
            "Extending",
            "Repeats at least five samples for each grade, plots the means and describes the spread and the center of the dot plot.",
          ),
          lv(
            3,
            "Meeting",
            "Repeats at least five samples for each grade, computes each mean correctly and plots them.",
          ),
          lv(2, "Approaching", "Repeats fewer samples or has one wrong mean."),
          lv(1, "Beginning", "Uses a single sample."),
        ],
      },
      {
        id: "center-spread",
        label: "Center, spread and comparison",
        levels: [
          lv(
            4,
            "Extending",
            "Computes mean and MAD correctly, states the difference as a multiple of the MAD and discusses overlap.",
          ),
          lv(
            3,
            "Meeting",
            "Computes mean and MAD correctly and compares the grades with the difference of means.",
          ),
          lv(2, "Approaching", "Computes the mean but not the MAD, or compares only high values."),
          lv(1, "Beginning", "Compares without computing a center."),
        ],
      },
      {
        id: "recommendation",
        label: "Recommendation and caution",
        levels: [
          lv(
            4,
            "Extending",
            "A clear claim, numeric evidence and a caution tied to sample size or variation, with a next step.",
          ),
          lv(3, "Meeting", "A claim supported by numbers and one caution."),
          lv(2, "Approaching", "A claim with weak or no numbers, or no caution."),
          lv(1, "Beginning", "Opinion without data."),
        ],
      },
      {
        id: "communication",
        label: "Display and presentation",
        levels: [
          lv(
            4,
            "Extending",
            "Titled graphs with units, a clear summary table and a talk that answers questions using the data.",
          ),
          lv(
            3,
            "Meeting",
            "Graphs and table are labeled and the talk explains the sampling method.",
          ),
          lv(
            2,
            "Approaching",
            "The display is missing a title or unit, or the talk skips the method.",
          ),
          lv(1, "Beginning", "The display and the talk are incomplete."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can explain why a random sample is better than a convenient one.",
    "I can find a mean and a mean absolute deviation.",
    "I can describe how much sample means vary.",
    "I can compare two groups using the center and the spread.",
    "I can state a recommendation and what I am not sure about.",
  ],
  peerFeedback: {
    structure: [
      "Partners from another team read the display before the presentation.",
      "The reviewer recomputes one mean and checks that the method is random.",
      "The reviewer gives one glow (a clear, correct piece), one grow (a number or claim to check) and one question.",
    ],
    frames: tiers(
      ["I checked ___. It is ___.", "My question is ___."],
      ["I recomputed ___ and got ___. That matches / does not match.", "One strong part is ___."],
      ["Your claim says ___, but the spread of ___ suggests ___. Could you say ___?"],
      ["Your inference would be stronger with ___. The samples overlap from ___ to ___, so ___."],
    ),
  },
  revision: {
    when: "After the comparison (session 6) and after the reveal of the populations (session 7).",
    steps: [
      "Compare your estimate with the true value and note the difference.",
      "Decide whether your claim still fits the data.",
      "Revise the claim and add a caution about sample size.",
    ],
    evidence:
      "A revised recommendation that names the difference between the estimate and the true mean.",
  },
  finalProduct: {
    title: "A sampling study and a recommendation to the school council",
    description:
      "A one-page display with two dot plots of sample means, a table of means and mean absolute deviations, a written recommendation with a caution and a two-minute presentation.",
    parts: [
      "A statistical question and a population",
      "A convenience sample and a random sample",
      "At least five random samples for each grade, plotted",
      "Means and mean absolute deviations for each grade",
      "A recommendation with evidence and caution",
      "A two-minute presentation",
    ],
    successCriteria: [
      "Samples are random.",
      "The numbers are correct and the graphs are labeled.",
      "The recommendation says what the data supports and what it does not.",
    ],
    audience: "The school council (staff and visiting classes)",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
