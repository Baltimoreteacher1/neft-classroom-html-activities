// Grades 6-8 publisher pass, Reading Room lessons, batch 6a: narrative, data, and science texts for older learners.
// Original EduWonderLab texts. Every dataset, person and event below is fictional and labeled as such.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "translation-desk-story",
    level: "A",
    title: "At the Translation Desk (a short story)",
    summary:
      "A student volunteer learns that helping a family understand a school message means checking the meaning, not only changing the words.",
    genre: "Realistic fiction (made-up characters)",
    subject: "English language arts",
    topics: ["interpreting and translating", "asking clarifying questions", "school community"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Retell a sequence of events and explain why a character made a choice.",
    languageFeatures: ["sequence words", "clarifying questions", "because statements"],
    minutes: 15,
    content:
      "Follow a short story, order its events, and explain why a character checks meaning before answering.",
    language:
      "Use first, then and finally to retell events, and use because to explain a character's choice.",
    essential: "What does a good helper do when a message is not clear?",
    background:
      "Think about a time when you helped someone understand something in another language, or when someone helped you.",
    hook: "Camila knows every word on the note. So why does she still not answer right away?",
    purpose:
      "Read to find out how Camila handles a message she is not sure about, and why her way works.",
    vocab: [
      [
        "dismissal",
        "the time when students leave school for the day",
        "Early dismissal means students leave at one o'clock.",
        "salida",
      ],
      [
        "clarify",
        "to make something clear by asking or checking",
        "She asked a question to clarify the message.",
        "aclarar",
      ],
      [
        "meaning",
        "the idea that words or signs are trying to say",
        "The meaning of a message matters more than each single word.",
        "significado",
      ],
      [
        "volunteer",
        "a person who helps without being paid",
        "Camila is a volunteer at the family night desk.",
        "voluntaria",
      ],
    ],
    paras: [
      {
        text: "On family night, Camila sat at the translation desk in the school library. She was a volunteer. Her job was to help families understand school papers. She spoke English and Spanish, but she was still learning how to explain school words.",
        q: "Where is Camila, and what is her job?",
      },
      {
        text: "Mr. Reyes held up a note. It said, “Early dismissal is moved to Thursday.” He asked, “Does this mean my daughter comes home early?” Camila knew every word on the note, but she was not sure what time early dismissal meant. She did not guess.",
        q: "Why does Camila not answer right away?",
      },
      {
        text: "Instead, Camila walked to a teacher and asked, “Does early dismissal mean noon, or one o’clock?” The teacher said, “One o’clock. The buses run at the same time as always.” Then Camila went back and said, “So on Thursday, your daughter leaves at one o’clock. Is that what you understood?”",
        q: "What does Camila do after she asks the teacher?",
      },
      {
        text: "Mr. Reyes nodded, and Camila wrote the message in both languages. Later she told a friend, “The hard part was not the words. The hard part was saying that I did not know yet.” A good helper does more than change words from one language to another. A good helper checks the meaning and says it back.",
        q: "What does Camila learn about being a good helper?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What did the note say?",
        opts: [
          "Early dismissal is moved to Thursday.",
          "The parent meeting is moved to Thursday.",
          "The buses will run an hour late on Thursday.",
        ],
        why: [
          "The parent meeting belongs to a different message; this note is about early dismissal.",
          "The teacher says the buses run at the same time as always, so nothing about the buses changed.",
        ],
        rat: "Paragraph 2 quotes the note: “Early dismissal is moved to Thursday.”",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraphs 2 and 3, what does the word dismissal mean? Use the teacher's answer to help you.",
        opts: [
          "the time when students leave school",
          "a school rule about a late bus",
          "a meeting for the families of students",
        ],
        why: [
          "The teacher answers with a clock time and says nothing about a rule, so the word is about when students go home.",
          "The meeting is a different event; dismissal is tied to one o'clock and the buses.",
        ],
        rat: "The teacher answers Camila's question about dismissal with “One o’clock,” which shows dismissal is the time students leave.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put these events in the order they happen in the story.",
        items: [
          "Mr. Reyes asks what the note means.",
          "Camila asks a teacher about the time.",
          "Camila says the message back to Mr. Reyes.",
          "Camila writes the message in both languages.",
        ],
        rat: "Paragraphs 2 through 4 give this order: Mr. Reyes asks, Camila asks the teacher, Camila says it back, and then she writes it in both languages.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why did Camila not simply translate the words on the note?",
        opts: [
          "Knowing the words was not enough, because she did not know what time early dismissal meant.",
          "Mr. Reyes did not want to hear the note in his language, so she walked away.",
          "The note was written in a language that Camila had never learned to read.",
        ],
        why: [
          "Mr. Reyes asked what the note meant, and nothing in the story says he refused to listen.",
          "The story says Camila knew every word on the note, so reading it was not the problem.",
        ],
        rat: "Paragraph 2 says Camila knew every word but was not sure of the meaning, so she checked with a teacher instead of guessing.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Connecting words",
        type: "connector",
        sentence: "Camila did not guess. ______, she walked to a teacher and asked a question.",
        prompt: "Choose the connecting word that best fits the blank.",
        opts: ["Instead", "Therefore", "Meanwhile"],
        why: [
          "Therefore would mean not guessing caused her to ask, but the sentence needs a word that sets her choice against guessing.",
          "Meanwhile would mean two things happened at the same time, but asking replaced guessing.",
        ],
        rat: "The writer sets Camila's choice to ask against the choice to guess, and instead shows that she did one thing in place of the other.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a character's choice",
        type: "short",
        prompt:
          "What does Camila do when a message is unclear, and why is that a good choice? Use two details from the story.",
        lookFor: [
          "Says Camila asks a teacher instead of guessing",
          "Says she checks the answer with Mr. Reyes by saying it back",
          "Gives a reason with because, such as the meaning matters more than the words",
        ],
        rubric: [
          "Names what Camila does",
          "Uses a detail from the story",
          "Explains why it is a good choice",
        ],
        frame: "When the message is unclear, Camila ___. This is a good choice because ___.",
        model:
          "When the message is unclear, Camila asks a teacher what early dismissal means and then says the answer back to Mr. Reyes. This is a good choice because the meaning matters more than the words, and guessing could send the family the wrong time.",
      },
    ],
    transfer: {
      prompt:
        "Think of a message that someone might misunderstand, such as a note about a schedule change. Write one clarifying question you would ask and one sentence saying the message back.",
      lookFor: [
        "Writes a clarifying question about the unclear part",
        "Says the message back in a complete sentence",
        "Uses a phrase such as Do you mean or Is that what you understood",
      ],
      frame: "I would ask, “Do you mean ___?” Then I would say, “So ___. Is that right?”",
    },
    guide: {
      mini: "Write the sentence “Early dismissal is moved to Thursday” on the board. Ask students what two things they need to know before they could pass the message on correctly (which Thursday and what time). Model Do you mean ___? and then say the message back.",
      discussion: [
        "Why is it a good idea to say a message back to the person?",
        "What could have gone wrong if Camila had guessed?",
        "When is it fine to say “I do not know yet”?",
      ],
      misconception:
        "Students may think a good interpreter never needs to ask a question. In the story the questions are what make the answer reliable.",
      answerNotes: [
        "Question 3: the order is Mr. Reyes asks, Camila asks the teacher, Camila says it back, Camila writes it in both languages.",
        "Question 4: Camila knew the words, so the problem was meaning, not reading.",
      ],
      model:
        "When the message is unclear, Camila asks a teacher what early dismissal means and then says the answer back to Mr. Reyes. This is a good choice because the meaning matters more than the words.",
    },
    family: family(
      "Read the story together. Ask your student to explain, in any language, why Camila asked the teacher before answering. Then practice saying a message back: one person gives a short message, and the other says it back and asks, “Is that right?”",
      "Lean juntos el cuento. Pida a su estudiante que explique, en cualquier idioma, por qué Camila le preguntó a la maestra antes de responder. Luego practiquen repetir un mensaje: una persona da un mensaje corto y la otra lo repite y pregunta: ¿Es correcto?",
      [
        "What did Camila check before she gave her answer?",
        "How can you check that you understood a message correctly?",
      ],
    ),
    connections: {
      write:
        "Write a short note in two languages and ask a partner to check the meaning, not only the words.",
      speak: "Practice a clarifying exchange: ask Do you mean ___? and say the message back.",
      listen:
        "Listen to the task At the Translation Desk and notice what the volunteer checks before answering.",
    },
  },
  {
    id: "bridge-fair-test-data",
    level: "B",
    title: "Which Bridge Is Stronger? Reading a Fair Test",
    summary:
      "Read a table of made-up bridge test results and decide which comparisons are fair and which claims the data supports.",
    genre: "Informational text with data (made-up sample)",
    subject: "Science and math",
    topics: ["fair tests", "reading a table", "variables and evidence"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction: "Explain which claims a data table supports and which comparisons are fair.",
    languageFeatures: ["comparison language", "limiting words such as only and may", "because"],
    minutes: 18,
    content:
      "Read a table, identify which two bridges can be compared fairly, and judge which claims the data supports.",
    language: "Use compare, differ and because to explain why a comparison is fair or not fair.",
    essential: "When can we say that one design is better than another?",
    background:
      "Think about a time two people tried different ways to do the same task. Could you tell which way was better?",
    hook: "One bridge held 14 textbooks and another held 10. Does that prove the first design is stronger?",
    purpose:
      "Read to find out which bridges can be compared fairly, and what a fair comparison needs.",
    vocab: [
      [
        "span",
        "the distance that a bridge crosses between two supports",
        "The span of the bridge is 30 centimeters.",
        "luz del puente",
      ],
      [
        "variable",
        "something in a test that can be changed",
        "Span and material are two variables in the bridge test.",
        "variable",
      ],
      [
        "fair test",
        "a test in which only one variable is changed",
        "A fair test keeps everything the same except one thing.",
        "prueba justa",
      ],
      [
        "evidence",
        "information that supports a claim",
        "The table is evidence about how many books each bridge held.",
        "evidencia",
      ],
    ],
    table: {
      headers: ["Team", "Span (cm)", "Material", "Textbooks held"],
      rows: [
        ["Rivera", "30", "Index cards", "14"],
        ["Osei", "40", "Index cards and straws", "10"],
        ["Kim", "30", "Index cards", "13"],
      ],
      description:
        "A made-up table of three model bridge tests. Rivera and Kim both used a 30 centimeter span and index cards; Osei used a 40 centimeter span and cards with straws.",
    },
    paras: [
      {
        text: "Mr. Chen’s class built model bridges and tested how many textbooks each bridge could hold before it bent. The table shows results from three teams. The numbers are made up for this lesson, but the thinking applies to real tests.",
        q: "What did the class test?",
      },
      {
        text: "At first glance, Rivera’s bridge looks stronger than Osei’s, because 14 is more than 10. But look at the other columns. Rivera’s span was 30 centimeters and Osei’s was 40. Rivera used only index cards, while Osei added straws. Two variables changed at once.",
        q: "Why is the first comparison a problem?",
      },
      {
        text: "Now compare Rivera and Kim. They used the same span and the same material, yet their bridges held 14 and 13 textbooks. That one-book difference shows that even bridges built the same way do not give exactly the same result. A difference of one book may come from small differences in how the bridge was built.",
        q: "What does the Rivera and Kim comparison show?",
      },
      {
        text: "A fair test changes one variable and keeps the others the same. To test the material, a team would keep the span at 30 centimeters and change only the material. Then they would repeat the test and look at the typical result. With evidence like that, the class could make a stronger claim than “my bridge held more.”",
        q: "What would make the test fair?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Read a table",
        type: "choice",
        prompt: "According to the table, how many textbooks did Kim’s bridge hold?",
        opts: ["13", "14", "10"],
        why: [
          "Fourteen is Rivera’s result, in the first row.",
          "Ten is the number Osei’s bridge held; Kim’s row is the last one.",
        ],
        rat: "The table shows that Kim’s bridge, with a 30 centimeter span and index cards, held 13 textbooks.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, “two variables changed at once.” What is a variable?",
        opts: [
          "something in the test that can be changed",
          "the number of textbooks a bridge holds",
          "a team that is very good at building",
        ],
        why: [
          "The number of textbooks is the result of the test, not the thing the teams changed.",
          "A variable is about the test, not about the people, so it does not describe a team.",
        ],
        rat: "Paragraph 2 names span and material as the two things that changed, so a variable is something in the test that can be changed.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Judge a comparison",
        type: "choice",
        prompt: "Which pair of bridges can be compared most fairly, and why?",
        opts: [
          "Rivera and Kim, because they used the same span and the same material",
          "Rivera and Osei, because their results are the farthest apart",
          "Osei and Kim, because they both used some index cards",
        ],
        why: [
          "A big difference in results does not make a comparison fair; the two bridges also differ in span and material.",
          "Osei and Kim differ in span and in material, so more than one variable changed between them.",
        ],
        rat: "Paragraph 3 compares Rivera and Kim because they share the same span and material, so they are the closest to a fair comparison in the table.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that describes how to make the test fair.",
        evidence: ["p4"],
        rat: "Paragraph 4 says a fair test changes one variable and keeps the others the same, and it describes repeating the test.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort claims by the evidence",
        type: "sort",
        prompt: "Sort each claim: does the table support it, or does it go beyond the table?",
        cats: ["The table supports this", "This goes beyond the table"],
        sortItems: [
          ["Kim’s bridge held fewer textbooks than Rivera’s.", 0],
          ["Osei used a longer span than Rivera.", 0],
          ["Straws make a bridge weaker.", 1],
          ["All index card bridges hold exactly 13 or 14 books.", 1],
          ["Rivera and Kim built bridges with the same span and material.", 0],
        ],
        rat: "The first, second and last claims can be read directly in the table. The other two make a general statement that three bridges cannot show.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author’s purpose",
        type: "choice",
        prompt: "Why does the writer compare Rivera with Osei and also Rivera with Kim?",
        opts: [
          "to show a comparison that is not fair and one that is closer to fair",
          "to prove that the Rivera bridge is the strongest design",
          "to explain how to build a bridge from index cards and straws",
        ],
        why: [
          "The writer does not claim Rivera is strongest; the first comparison is used to show a problem.",
          "The text never gives building steps; it is about how to judge the results.",
        ],
        rat: "Paragraph 2 shows a comparison where two variables differ, and paragraph 3 shows a comparison where they match, so the reader can see the difference.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Write a supported claim with a limit",
        type: "short",
        prompt:
          "Write one claim the table supports about the three bridges, and one limit that tells what the table cannot show.",
        lookFor: [
          "States a claim that can be read from the table, with a number",
          "Names a limit such as only three bridges, or two variables changed",
          "Uses a word like but, only or may to mark the limit",
        ],
        rubric: [
          "The claim matches the table",
          "The limit is specific",
          "The language marks the difference between data and a guess",
        ],
        frame: "The table shows that ___, but it cannot show ___.",
        model:
          "The table shows that Rivera’s bridge held 14 textbooks and Kim’s held 13 with the same span and material, but it cannot show which material is stronger, because only three bridges were tested.",
      },
    ],
    transfer: {
      prompt:
        "A class wants to test whether a thicker paper makes a stronger bridge. Explain how to set up a fair test. Name what stays the same, what changes, and what to record.",
      lookFor: [
        "Says to change only the thickness of the paper",
        "Names variables that stay the same, such as span and design",
        "Says to repeat the test and record the typical result",
      ],
      frame:
        "To make a fair test, I would change only ___. I would keep ___ the same. I would ___ and record ___.",
    },
    guide: {
      mini: "Project the table. Cover the Span and Material columns and ask which bridge is stronger. Then uncover them and ask whether the answer changes. Use the Rivera and Kim row to discuss why a one-book difference is not strong evidence.",
      discussion: [
        "Why is a table with more columns sometimes harder to read but more honest?",
        "Which limiting word could you add to a claim to make it safer?",
        "What would you test next, and what would you keep the same?",
      ],
      misconception:
        "Students may treat the biggest number as proof of the best design. The table shows that two variables changed, so the comparison is not fair.",
      answerNotes: [
        "Question 3: Rivera and Kim share span and material, so they are the closest to a fair comparison.",
        "Question 5: the claims about straws and about all index card bridges go beyond three data rows.",
      ],
      model:
        "The table shows that Rivera’s bridge held 14 textbooks and Kim’s held 13 with the same span and material, but it cannot show which material is stronger, because only three bridges were tested.",
    },
    family: family(
      "Talk about the table together. Ask your student which two bridges can be compared fairly and why. Then try a small fair test at home, such as dropping two balls of the same size from the same height onto different surfaces. Explain in any language what stays the same and what changes.",
      "Conversen sobre la tabla. Pida a su estudiante que diga qué dos puentes se pueden comparar de manera justa y por qué. Luego hagan una prueba justa pequeña en casa, por ejemplo soltar dos pelotas del mismo tamaño desde la misma altura sobre superficies distintas. Expliquen en cualquier idioma qué se mantiene igual y qué cambia.",
      [
        "Which two things were different about Rivera’s and Osei’s bridges?",
        "What would you change, and what would you keep the same, in a fair test?",
      ],
    ),
    connections: {
      write:
        "Write a lab note that states one supported claim and one limit about a fair test you designed.",
      speak:
        "Explain to a partner why two bridges cannot be compared when span and material both changed.",
      listen:
        "Listen to the task Bridge Test: Is It a Fair Comparison and name the two differences between the bridges.",
    },
  },
  {
    id: "lunch-line-data-and-voices",
    level: "B",
    title: "Counting the Wait: Data and Voices",
    summary:
      "Read a made-up lunch-line survey and three student comments, and sort what is data, what is opinion, and what still needs investigating.",
    genre: "Informational text with data (made-up survey)",
    subject: "Math and social studies",
    topics: ["survey data", "fact and opinion", "asking investigable questions"],
    keyUse: "Inform",
    eldStandard: "ELD-MA",
    languageFunction:
      "Report survey results accurately and tell them apart from opinions and questions.",
    languageFeatures: ["fractions and percents in sentences", "opinion language", "question forms"],
    minutes: 18,
    content:
      "Read a table of survey counts, compute simple shares, and separate data from opinion.",
    language: "Use out of, percent and I think to report data and opinions in different ways.",
    essential: "What can a survey tell us, and what can it not tell us?",
    background:
      "Think about a long line you have waited in. How could you find out how long people usually wait?",
    hook: "Everyone has an opinion about the lunch line. Can a survey settle it?",
    purpose:
      "Read to find out what the survey results show and how they differ from what students say.",
    vocab: [
      [
        "survey",
        "a set of questions asked to many people",
        "The survey asked 60 students how long they waited.",
        "encuesta",
      ],
      [
        "data",
        "facts and numbers that are collected",
        "The survey data shows how many students waited under five minutes.",
        "datos",
      ],
      [
        "opinion",
        "what a person thinks or feels",
        "Lena’s view that the line is fine is an opinion.",
        "opinión",
      ],
      [
        "investigate",
        "to look into something carefully",
        "The class could investigate whether pizza days are slower.",
        "investigar",
      ],
    ],
    table: {
      headers: ["How long a student waited", "Number of students"],
      rows: [
        ["Under 5 minutes", "36"],
        ["5 to 10 minutes", "20"],
        ["More than 10 minutes", "4"],
        ["Total surveyed", "60"],
      ],
      description:
        "A made-up survey of 60 students about their wait in the lunch line: 36 waited under 5 minutes, 20 waited 5 to 10 minutes, and 4 waited more than 10 minutes.",
    },
    paras: [
      {
        text: "A student reporter named Jonas surveyed 60 students about how long they waited in the lunch line. The survey is made up for this lesson. Jonas put the results in a table. Of the 60 students, 36 said they waited under 5 minutes, 20 said 5 to 10 minutes, and 4 said more than 10 minutes.",
        q: "What did Jonas collect, and how did he organize it?",
      },
      {
        text: "These counts are data. Data are facts that can be checked by counting. Thirty-six out of 60 is the same as 60 percent. Twenty out of 60 is one third. Only 4 out of 60, a little under 7 percent, waited more than 10 minutes.",
        q: "What do the counts show?",
      },
      {
        text: "Then Jonas shared three voices. Lena said, “I think the line is fine.” Omar said he waits longest on pizza days and suggested checking whether pizza days really are slower. Priya said, “I want the cafeteria to open a second line.” Lena’s view and Priya’s request are opinions. Omar’s idea is a question that could be investigated.",
        q: "Which statements are opinions, and which is a question?",
      },
      {
        text: "The survey has a limit. It tells how long students said they waited, but it does not tell why some waits were longer. To answer Omar’s question, Jonas would need new evidence, such as counting the wait on pizza days and on other days.",
        q: "What can the survey not tell us?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Read a table",
        type: "choice",
        prompt: "How many students waited 5 to 10 minutes?",
        opts: ["20", "36", "4"],
        why: [
          "Thirty-six students waited under 5 minutes, which is a different row of the table.",
          "Four students waited more than 10 minutes, which is the smallest group.",
        ],
        rat: "The table row for 5 to 10 minutes shows 20 students.",
      },
      {
        kind: "data",
        phase: "first",
        skill: "Compute a share",
        type: "choice",
        prompt: "What percent of the students waited under 5 minutes?",
        opts: ["60 percent", "36 percent", "40 percent"],
        why: [
          "Thirty-six is the number of students, not the percent; the percent compares 36 with the total of 60.",
          "Forty percent is the share of students who waited 5 minutes or more, not the share who waited under 5.",
        ],
        rat: "Paragraph 2 says 36 out of 60 is 60 percent, because 36 divided by 60 is 0.6.",
      },
      {
        kind: "vocab",
        phase: "second",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, Lena’s statement is an opinion. What is an opinion?",
        opts: [
          "what a person thinks or feels",
          "a fact that can be checked by counting",
          "a question that a survey answers",
        ],
        why: [
          "Facts that can be checked by counting are called data in the text, not opinions.",
          "Paragraph 4 says the survey cannot answer why, so an opinion is not a survey answer.",
        ],
        rat: "Paragraph 3 says Lena says I think the line is fine, and the writer calls that an opinion, which is what someone thinks.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sort statements by kind",
        type: "sort",
        prompt: "Sort each statement into the right group.",
        cats: ["Data from the survey", "Opinion or request", "Question to investigate"],
        sortItems: [
          ["Twenty students waited 5 to 10 minutes.", 0],
          ["The cafeteria should open a second line.", 1],
          ["The line is fine.", 1],
          ["Are pizza days really slower?", 2],
          ["Four students waited more than 10 minutes.", 0],
        ],
        rat: "Counts from the table are data, Lena’s view and Priya’s request are opinions, and Omar’s suggestion is a question to investigate.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference about limits",
        type: "choice",
        prompt: "Which question could the survey NOT answer by itself?",
        opts: [
          "Why were some waits longer than others?",
          "How many students waited under 5 minutes?",
          "How many students did Jonas survey in all?",
        ],
        why: [
          "The table gives the number of students who waited under 5 minutes, so the survey answers this one.",
          "The total of 60 students is listed in the table, so the survey answers this one.",
        ],
        rat: "Paragraph 4 says the survey tells how long students said they waited but not why some waits were longer.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains what the survey cannot tell us.",
        evidence: ["p4"],
        rat: "Paragraph 4 names the limit of the survey and says new evidence would be needed.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Design a follow-up investigation",
        type: "short",
        prompt:
          "Write one investigation Jonas could do to answer Omar’s question about pizza days. Say what he would measure and what he would compare.",
        lookFor: [
          "Says to measure the wait on pizza days and on other days",
          "Says to compare the two sets of waits",
          "Mentions keeping other things the same, such as the time of day",
        ],
        rubric: ["Names what is measured", "Names what is compared", "Keeps the test fair"],
        frame: "Jonas could measure ___ on ___ days and on ___ days, and then compare ___.",
        model:
          "Jonas could measure the wait on pizza days and on other days at the same time of day, and then compare the typical wait for the two kinds of days. That would give evidence about Omar’s question instead of an opinion.",
      },
    ],
    transfer: {
      prompt:
        "Think of a question about your school that people argue about. Write one fact you could collect, one opinion you have heard, and one question you could investigate.",
      lookFor: [
        "Names a fact that can be collected by counting or measuring",
        "States an opinion with a signal such as I think or should",
        "Writes a question that could be investigated with new evidence",
      ],
      frame: "A fact I could collect is ___. One opinion is ___. A question to investigate is ___.",
    },
    guide: {
      mini: "Write the three statements 36 out of 60, I think the line is fine, and Are pizza days slower on the board. Ask students to sort them, then ask which can be checked by counting and which need different evidence.",
      discussion: [
        "Can a survey show that an opinion is wrong? Why or why not?",
        "What does it mean to say that a survey answers how long but not why?",
        "Which signal words tell you that someone is giving an opinion?",
      ],
      misconception:
        "Students may think a number always makes a statement a fact. Survey counts are data about what students said, and they still do not explain causes.",
      answerNotes: [
        "Question 2: 36 divided by 60 is 0.6, which is 60 percent.",
        "Question 5: the survey does not give reasons, so the why question needs new evidence.",
      ],
      model:
        "Jonas could measure the wait on pizza days and on other days at the same time of day, and then compare the typical wait for the two kinds of days.",
    },
    family: family(
      "Look at the survey table together. Ask your student to say one fact from the table and one opinion from the text. Then talk about how your family could find out something with a small count, such as how many minutes each person spends getting ready. You can talk in any language.",
      "Miren juntos la tabla de la encuesta. Pida a su estudiante que diga un dato de la tabla y una opinión del texto. Luego conversen sobre cómo su familia podría averiguar algo con un conteo pequeño, por ejemplo cuántos minutos tarda cada persona en alistarse. Pueden hablar en cualquier idioma.",
      [
        "What is one fact from the survey table?",
        "What is one opinion in the text, and how can you tell?",
      ],
    ),
    connections: {
      write:
        "Write a short report that separates three facts, one opinion and one question about a school issue.",
      speak: "Explain the difference between data and opinion using the lunch-line survey.",
      listen:
        "Listen to the task Lunch Line: Numbers, Opinions, and Questions and sort what you hear.",
    },
  },
  {
    id: "tide-pool-adaptations",
    level: "B",
    title: "Life Between the Tides",
    summary:
      "Read a science article about how tide pool animals handle changes, and explain how one feature helps one animal.",
    genre: "Informational science text",
    subject: "Science",
    topics: ["adaptations", "tide pools", "cause and effect"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction:
      "Explain how an animal feature helps it live in a changing place, using cause and effect.",
    languageFeatures: ["cause and effect language", "because and so", "technical vocabulary"],
    minutes: 18,
    content:
      "Read an informational text and match animal features to the challenges of a tide pool.",
    language: "Use because and so to explain how a feature helps an animal survive.",
    essential: "How do living things survive in a place that keeps changing?",
    background:
      "Think about a place that changes a lot during the day, such as a beach or a parking lot in the sun. What would it be like to live there?",
    hook: "Twice a day the ocean leaves, and the animals in a tide pool must wait for it to come back.",
    purpose:
      "Read to find out what challenges tide pool animals face and how some of them handle those challenges.",
    vocab: [
      [
        "tide pool",
        "a small pool of sea water left on rocks when the tide goes out",
        "Crabs and sea stars can live in a tide pool.",
        "poza de marea",
      ],
      [
        "adaptation",
        "a feature or behavior that helps a living thing survive",
        "A hard shell is an adaptation that protects an animal.",
        "adaptación",
      ],
      [
        "low tide",
        "the time when the sea is at its lowest point on the shore",
        "At low tide, the rocks are wet but not covered.",
        "marea baja",
      ],
      ["cling", "to hold on tightly to something", "Sea stars cling to rocks.", "aferrarse"],
    ],
    paras: [
      {
        text: "A tide pool is a small pool of sea water that stays on the rocks when the tide goes out. Twice a day the ocean rises and falls. When the sea is at low tide, the animals in a tide pool are left behind. They have to live through big changes until the water returns.",
        q: "What is a tide pool?",
      },
      {
        text: "These changes are challenges. At low tide, the sun can warm the water in a small pool. Waves can crash over the rocks and push animals around. Animals that live out of the water for a while may begin to dry out. Each animal in a tide pool has features that help it handle some of these challenges.",
        q: "What challenges do tide pool animals face?",
      },
      {
        text: "A limpet is a small animal with a cone-shaped shell. At low tide, it clamps tight to the rock, which helps keep it from drying out. A sea star holds on with hundreds of tiny tube feet, so waves are less likely to wash it away. A hermit crab does not grow its own shell. It borrows an empty shell for protection, and it looks for a bigger shell as it grows.",
        q: "How do a limpet, a sea star and a hermit crab handle changes?",
      },
      {
        text: "Scientists call features like these adaptations. An adaptation is not something an animal chooses in one day. It is a feature or behavior that helps a kind of animal survive in the place where it lives. When people visit a tide pool, they can help by looking carefully, walking slowly on wet rocks, and leaving the animals where they found them.",
        q: "What is an adaptation, and how can visitors help?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 3, how does a sea star hold on?",
        opts: [
          "with hundreds of tiny tube feet",
          "with a hard cone-shaped shell",
          "with borrowed empty shells",
        ],
        why: [
          "A cone-shaped shell belongs to the limpet, which clamps to the rock rather than holding on with feet.",
          "Borrowed shells belong to the hermit crab, which uses them for protection.",
        ],
        rat: "Paragraph 3 says a sea star holds on with hundreds of tiny tube feet.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 4, what is an adaptation?",
        opts: [
          "a feature or behavior that helps a living thing survive",
          "a change that an animal chooses to make in one day",
          "a place where sea animals go at low tide",
        ],
        why: [
          "The paragraph says an adaptation is not something an animal chooses in one day.",
          "A place is a habitat; the paragraph defines an adaptation as a feature or behavior.",
        ],
        rat: "Paragraph 4 defines an adaptation as a feature or behavior that helps a kind of animal survive where it lives.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Match a feature to a challenge",
        type: "sort",
        prompt: "Match each feature to the challenge it helps an animal handle.",
        cats: ["Drying out", "Waves", "Needing protection"],
        sortItems: [
          ["A limpet clamps tight to the rock.", 0],
          ["A sea star holds on with tube feet.", 1],
          ["A hermit crab borrows an empty shell.", 2],
          ["Animals are left out of the water at low tide.", 0],
          ["Waves crash over the rocks.", 1],
        ],
        rat: "The limpet clamps to keep from drying out, the sea star holds on against waves, and the hermit crab’s shell gives protection. The last two items name challenges from paragraph 2.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Cause and effect",
        type: "cloze",
        prompt: "Complete the sentences with the words that match the text.",
        cloze: [
          "A limpet clamps to the rock, ",
          ["so", "but", "or"],
          " it is less likely to dry out. A hermit crab borrows an empty shell ",
          ["because", "although", "unless"],
          " it does not grow its own shell.",
        ],
        rat: "Paragraph 3 gives a cause and an effect for each animal: clamping leads to less drying out, and not growing its own shell is the reason for borrowing one.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "A hermit crab grows bigger. What does the text suggest it will do?",
        opts: [
          "look for a bigger empty shell",
          "grow a new shell of its own",
          "stop needing any protection",
        ],
        why: [
          "The text says a hermit crab does not grow its own shell, so it cannot grow a new one.",
          "The shell gives protection, and nothing in the text says that a larger crab stops needing it.",
        ],
        rat: "Paragraph 3 says a hermit crab looks for a bigger shell as it grows.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How is this article organized?",
        opts: [
          "It names a setting, then challenges, then examples of how animals handle them.",
          "It tells the story of one long day on the beach from the morning to the night.",
          "It lists the animals in order from the smallest animal to the largest animal.",
        ],
        why: [
          "The text is informational and does not follow a single character through a day.",
          "The animals are not ordered by size; each one is chosen to show a different feature.",
        ],
        rat: "Paragraph 1 describes the tide pool, paragraph 2 gives the challenges, and paragraph 3 gives animal examples.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a feature with because",
        type: "short",
        prompt:
          "Choose one animal from the text. Explain how one of its features helps it live in a tide pool. Use the word because.",
        lookFor: [
          "Names one animal and one feature from the text",
          "Names the challenge that the feature helps with",
          "Uses because or so to connect the feature and the challenge",
        ],
        rubric: [
          "The feature is from the text",
          "The challenge is named",
          "The connection uses because or so",
        ],
        frame: "A ___ has ___, which helps it because ___.",
        model:
          "A limpet clamps tight to the rock at low tide, which helps it because the clamping keeps the animal from drying out while the pool is without fresh sea water.",
      },
    ],
    transfer: {
      prompt:
        "Think of an animal that lives in a place that changes, such as a desert or a pond that freezes. Explain one feature of that animal and one challenge it helps with. If you do not know, write a question you would research.",
      lookFor: [
        "Names an animal and a feature",
        "Names a challenge that the feature helps with",
        "Uses because or so, or writes a researchable question",
      ],
      frame: "A ___ has ___. This helps it handle ___ because ___.",
    },
    guide: {
      mini: "Draw a two-column chart on the board with the headings Challenge and Feature. Ask students to fill in a limpet, a sea star and a hermit crab, then turn each row into a sentence with because.",
      discussion: [
        "Why can one animal have a feature that helps with one challenge but not another?",
        "How is an adaptation different from something an animal does once?",
        "Why is it important to leave tide pool animals where you found them?",
      ],
      misconception:
        "Students may think animals choose or change their features to fit a place. The text describes adaptations as features that help a kind of animal survive over time.",
      answerNotes: [
        "Question 3: the limpet is matched with drying out, the sea star with waves, and the hermit crab with protection.",
        "Question 5: paragraph 3 says the hermit crab looks for a bigger shell as it grows.",
      ],
      model:
        "A limpet clamps tight to the rock at low tide, which helps it because the clamping keeps the animal from drying out.",
    },
    family: family(
      "Read the article together. Ask your student to explain one animal and one feature, using the word because. Then think of an animal in your home or neighborhood and talk about one feature that helps it live where it lives. You can talk in any language.",
      "Lean juntos el artículo. Pida a su estudiante que explique un animal y una característica, usando la palabra porque. Luego piensen en un animal de su casa o de su vecindario y conversen sobre una característica que le ayuda a vivir donde vive. Pueden hablar en cualquier idioma.",
      [
        "Which animal in the article is your favorite, and what feature helps it?",
        "How does the word because help you explain a feature?",
      ],
    ),
    connections: {
      write: "Write a short explanation of how one feature helps one animal, using because.",
      speak: "Explain to a partner how a limpet, a sea star or a hermit crab handles a challenge.",
      listen: "Listen to the task Field Notes: Life in a Tide Pool and complete the notes.",
    },
  },
];
