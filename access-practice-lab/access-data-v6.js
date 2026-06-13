/* access-data-v6.js — ACCESS Practice Lab v6.0: Model-Test build-out.
 * Brings the Model-Test (full-test simulation) section up to the caliber of the
 * four core domains: adds mixed-domain test-prep activities (varied types),
 * printable worksheets, and a third full model test (Form C). Merged by mergeV6.
 */
window.ACCESS_LAB_V6 = {
 "tests": [
  {
   "id": "model-form-c",
   "title": "ACCESS-Style Practice Test — Form C",
   "gradeCluster": "Grades 6-8",
   "tier": "Model practice",
   "overview": "A third full practice test in four parts: Listening, Reading, Writing, and Speaking. Use the strategies you practiced. Work calmly, read carefully, and do your best. The questions get a little harder as each part goes on.",
   "sections": [
    {
     "domain": "Listening",
     "title": "Listening",
     "directions": "You will hear short talks and conversations read aloud. Listen carefully. You may hear each one one time. After listening, answer the question that follows. Choose the best answer or follow the steps in the question.",
     "estMinutes": 18,
     "items": [
      {
       "id": "mt6-c-l-1",
       "title": "Morning Announcement",
       "skill": "Identifying explicit detail",
       "prompt": "What time will the assembly begin?",
       "type": "multipleChoice",
       "options": [
        {
         "id": "a",
         "text": "At 9:00",
         "visual": "🕘"
        },
        {
         "id": "b",
         "text": "At 10:00",
         "visual": "🕙"
        },
        {
         "id": "c",
         "text": "At 11:00",
         "visual": "🕚"
        }
       ],
       "answer": "b",
       "correct": "Correct. The speaker says the assembly begins at 10:00.",
       "hint": "Listen for the time that comes after the word \"begin.\"",
       "support": "When a question asks \"what time,\" listen for a clock time.",
       "extension": "Where will the assembly take place?",
       "wida": [
        "Identify explicit detail"
       ],
       "listenFor": [
        "a clock time",
        "the word assembly",
        "the word begin"
       ],
       "adminScript": "Good morning, students. Today we have a special music assembly in the auditorium. Please finish your first-period work early, because the assembly will begin at ten o'clock. Now answer: What time will the assembly begin?",
       "teacher": {
        "use": "Listening opener, easiest item.",
        "function": "Listening for an explicit time.",
        "lower": "Read twice slowly.",
        "onLevel": "Read once.",
        "challenge": "Ask for both time and place.",
        "noTech": "Read aloud; students point to the time.",
        "prompt": "How did you know it was 10:00?"
       }
      },
      {
       "id": "mt6-c-l-2",
       "title": "Pack for the Lab",
       "skill": "Identifying multiple details",
       "prompt": "Which items does the teacher say to bring to the lab?",
       "type": "multiSelect",
       "options": [
        {
         "id": "a",
         "text": "A notebook"
        },
        {
         "id": "b",
         "text": "A calculator"
        },
        {
         "id": "c",
         "text": "A soccer ball"
        },
        {
         "id": "d",
         "text": "Safety goggles"
        }
       ],
       "answers": [
        "a",
        "b",
        "d"
       ],
       "correct": "Correct. The teacher lists a notebook, a calculator, and safety goggles.",
       "hint": "Track each item in the list. A soccer ball was not mentioned.",
       "support": "Listen for items joined with \"and.\"",
       "extension": "Why would goggles be needed in a lab?",
       "wida": [
        "Identify multiple details",
        "Track a spoken list"
       ],
       "listenFor": [
        "a list of items",
        "the word and",
        "an item not mentioned"
       ],
       "adminScript": "Before our lab today, make sure you bring a few things. You will need your notebook to record results, a calculator for the math, and your safety goggles. Now answer: Which items does the teacher say to bring to the lab?",
       "teacher": {
        "use": "List-tracking listening item.",
        "function": "Listening for multiple details.",
        "lower": "Pause after each item.",
        "onLevel": "Read once.",
        "challenge": "Add a distractor and ask why it does not belong.",
        "noTech": "Read aloud; students check boxes.",
        "prompt": "Which item is for the math?"
       }
      },
      {
       "id": "mt6-c-l-3",
       "title": "How to Use the Microscope",
       "skill": "Sequencing oral steps",
       "prompt": "Put the steps in the order the teacher explains for using the microscope.",
       "type": "order",
       "items": [
        {
         "id": "i1",
         "text": "Place the slide on the stage."
        },
        {
         "id": "i2",
         "text": "Look through the eyepiece."
        },
        {
         "id": "i3",
         "text": "Turn the knob to focus."
        },
        {
         "id": "i4",
         "text": "Draw what you see."
        }
       ],
       "answer": [
        "i1",
        "i2",
        "i3",
        "i4"
       ],
       "correct": "Correct. Place the slide, look through the eyepiece, focus, then draw.",
       "hint": "Listen for first, next, then, and finally.",
       "support": "Order words signal each step.",
       "extension": "Why focus before you draw?",
       "wida": [
        "Sequence steps",
        "Follow signal words"
       ],
       "listenFor": [
        "order words",
        "what to do first",
        "the last step"
       ],
       "adminScript": "Here is how to use the microscope. First, place the slide on the stage. Next, look through the eyepiece. Then turn the knob to focus until the image is clear. Finally, draw what you see. Now put the steps in order.",
       "teacher": {
        "use": "Sequencing item with academic science talk.",
        "function": "Ordering an oral process.",
        "lower": "Use movable step strips.",
        "onLevel": "Read once.",
        "challenge": "Remove signal words.",
        "noTech": "Read aloud; students number steps.",
        "prompt": "Which step do students skip most?"
       }
      },
      {
       "id": "mt6-c-l-4",
       "title": "Comparing Two Cities",
       "skill": "Interpreting comparative data",
       "prompt": "Complete the summary of what the speaker said about the two cities.",
       "type": "cloze",
       "segments": [
        {
         "text": "Rivertown has 50,000 people, which makes it "
        },
        {
         "blank": {
          "id": "b1",
          "answer": "smaller",
          "options": [
           "smaller",
           "larger",
           "the same"
          ]
         }
        },
        {
         "text": " than Lakeside. Of the two cities, Lakeside is the "
        },
        {
         "blank": {
          "id": "b2",
          "answer": "larger",
          "options": [
           "larger",
           "smaller",
           "older"
          ]
         }
        },
        {
         "text": "."
        }
       ],
       "correct": "Correct. Rivertown is smaller than Lakeside, so Lakeside is the larger city.",
       "hint": "Listen for the comparison words and the population numbers.",
       "support": "Comparatives like \"smaller\" compare two things.",
       "extension": "How many more people live in Lakeside?",
       "wida": [
        "Interpret comparatives",
        "Process academic data language"
       ],
       "listenFor": [
        "population numbers",
        "comparison words",
        "the larger city"
       ],
       "adminScript": "Let's compare two cities in our state. Rivertown has fifty thousand people. Lakeside has eighty thousand people, so Rivertown is smaller than Lakeside. Now complete the summary.",
       "teacher": {
        "use": "Harder item combining data and comparison.",
        "function": "Listening for comparative population data.",
        "lower": "Show the two numbers written down.",
        "onLevel": "Read once.",
        "challenge": "Add a third city and ask which is largest.",
        "noTech": "Read aloud; students fill a printed summary.",
        "prompt": "How do you know which city is larger?"
       }
      }
     ]
    },
    {
     "domain": "Reading",
     "title": "Reading",
     "directions": "Read each passage carefully. Then answer the question or follow the steps. You may read each passage again. Choose the best answer or click the correct part of the text.",
     "estMinutes": 22,
     "items": [
      {
       "id": "mt6-c-r-1",
       "title": "Finding a Detail",
       "skill": "Locating explicit information",
       "prompt": "Click the sentence that tells WHY the desert fox has large ears.",
       "type": "hotText",
       "passageTitle": "The Desert Fox",
       "passage": [
        "The fennec fox lives in the hot, sandy desert.",
        "It is small, with soft fur the color of sand.",
        "Its very large ears help the fox release heat and stay cool.",
        "At night, the fox hunts for insects and small animals."
       ],
       "sentences": [
        {
         "id": "s1",
         "text": "The fennec fox lives in the hot, sandy desert."
        },
        {
         "id": "s2",
         "text": "It is small, with soft fur the color of sand."
        },
        {
         "id": "s3",
         "text": "Its very large ears help the fox release heat and stay cool."
        },
        {
         "id": "s4",
         "text": "At night, the fox hunts for insects and small animals."
        }
       ],
       "answers": [
        "s3"
       ],
       "correct": "Correct. The large ears help the fox release heat and stay cool.",
       "hint": "The question asks \"why.\" Find the sentence about the ears.",
       "support": "Scan for the key word \"ears\" and look for a reason.",
       "extension": "What does the fox eat at night?",
       "wida": [
        "Locate explicit detail"
       ],
       "readFor": [
        "the word ears",
        "a reason word",
        "what helps the fox stay cool"
       ],
       "teacher": {
        "use": "Easiest reading item, explicit detail.",
        "function": "Locating a stated reason.",
        "lower": "Highlight the key word together.",
        "onLevel": "Independent.",
        "challenge": "Find the detail and one more fact.",
        "noTech": "Print and underline.",
        "prompt": "Why are big ears useful in a desert?"
       }
      },
      {
       "id": "mt6-c-r-2",
       "title": "Main Idea",
       "skill": "Identifying the main idea",
       "prompt": "What is the main idea of the passage?",
       "type": "multipleChoice",
       "passageTitle": "The Desert Fox",
       "passage": [
        "The fennec fox lives in the hot, sandy desert.",
        "It is small, with soft fur the color of sand.",
        "Its very large ears help the fox release heat and stay cool.",
        "At night, the fox hunts for insects and small animals."
       ],
       "options": [
        {
         "id": "a",
         "text": "The fennec fox has features that help it live in the desert."
        },
        {
         "id": "b",
         "text": "The fennec fox has soft fur."
        },
        {
         "id": "c",
         "text": "The fennec fox hunts at night."
        }
       ],
       "answer": "a",
       "correct": "Correct. The main idea covers all the features that help the fox live in the desert.",
       "hint": "The main idea covers the whole passage, not one feature.",
       "support": "Choices b and c are details. The main idea ties them together.",
       "extension": "Write a title that matches the main idea.",
       "wida": [
        "Identify central idea"
       ],
       "readFor": [
        "what every sentence is about",
        "an idea bigger than a detail",
        "the desert connection"
       ],
       "teacher": {
        "use": "Main-idea item.",
        "function": "Selecting a central idea.",
        "lower": "Ask if each choice covers everything.",
        "onLevel": "Independent.",
        "challenge": "Students justify why details are too narrow.",
        "noTech": "Read aloud; students point to the broadest choice.",
        "prompt": "How is the main idea bigger than a detail?"
       }
      },
      {
       "id": "mt6-c-r-3",
       "title": "Two Reasons",
       "skill": "Identifying multiple details",
       "prompt": "Which TWO reasons does the writer give for joining the school garden club?",
       "type": "multiSelect",
       "passageTitle": "Join the Garden Club",
       "passage": [
        "Our school garden club meets every Tuesday after school.",
        "Members learn how to grow vegetables and care for plants.",
        "You also make new friends while you work together.",
        "The club meets in the courtyard near the cafeteria."
       ],
       "options": [
        {
         "id": "a",
         "text": "You learn to grow vegetables and care for plants."
        },
        {
         "id": "b",
         "text": "You make new friends."
        },
        {
         "id": "c",
         "text": "The club meets on Tuesday."
        },
        {
         "id": "d",
         "text": "The club meets near the cafeteria."
        }
       ],
       "answers": [
        "a",
        "b"
       ],
       "correct": "Correct. The two reasons are learning to grow plants and making new friends.",
       "hint": "A reason tells WHY to join. Two choices are just facts about when and where.",
       "support": "Separate reasons (why) from details (when/where).",
       "extension": "Which detail tells WHERE the club meets?",
       "wida": [
        "Identify multiple details",
        "Distinguish reasons from facts"
       ],
       "readFor": [
        "why to join",
        "two benefits",
        "facts that are not reasons"
       ],
       "teacher": {
        "use": "Multi-detail reading item.",
        "function": "Selecting two supporting reasons.",
        "lower": "Read each option and ask: is it a reason or a fact?",
        "onLevel": "Independent.",
        "challenge": "Add a third reason as a distractor.",
        "noTech": "Print; students check the two reasons.",
        "prompt": "How is a reason different from a fact about time?"
       }
      },
      {
       "id": "mt6-c-r-4",
       "title": "Word in Context",
       "skill": "Using context clues",
       "prompt": "Complete the sentence about what the underlined word means.",
       "type": "cloze",
       "passageTitle": "Join the Garden Club",
       "passage": [
        "The soil in our garden was dry and hard at first.",
        "We added water and compost until it became rich and easy to dig."
       ],
       "segments": [
        {
         "text": "In the passage, the word \"soil\" means the "
        },
        {
         "blank": {
          "id": "b1",
          "answer": "dirt plants grow in",
          "options": [
           "dirt plants grow in",
           "tools we use",
           "water we add"
          ]
         }
        },
        {
         "text": ". The word \"rich\" here means "
        },
        {
         "blank": {
          "id": "b2",
          "answer": "full of nutrients",
          "options": [
           "full of nutrients",
           "having money",
           "very dry"
          ]
         }
        },
        {
         "text": "."
        }
       ],
       "correct": "Correct. \"Soil\" is the dirt plants grow in, and \"rich\" here means full of nutrients.",
       "hint": "Use the nearby words: dig, water, and compost.",
       "support": "Context clues are the words around an unknown word.",
       "extension": "Use the word \"soil\" in your own sentence.",
       "wida": [
        "Use context clues",
        "Determine word meaning"
       ],
       "readFor": [
        "words near the unknown word",
        "examples that hint meaning",
        "the best fit"
       ],
       "teacher": {
        "use": "Vocabulary-in-context reading item.",
        "function": "Using clues to define words.",
        "lower": "Read the clue words aloud.",
        "onLevel": "Independent.",
        "challenge": "Students predict before choosing.",
        "noTech": "Print and fill the blanks.",
        "prompt": "Which words helped you define rich?"
       }
      }
     ]
    },
    {
     "domain": "Writing",
     "title": "Writing",
     "directions": "Read each task carefully. Plan your ideas, then write a clear response in complete sentences. Use the word bank and sentence frames to help you. Take your time and check your work.",
     "estMinutes": 25,
     "items": [
      {
       "id": "mt6-c-w-1",
       "title": "Explain a Process",
       "skill": "Writing a sequenced explanation",
       "prompt": "Explain how to study for a test. Write 4-6 sentences using order words.",
       "type": "constructed",
       "responseLabel": "Your response",
       "responsePlaceholder": "First, you should ...",
       "wordBank": [
        "first",
        "next",
        "then",
        "after that",
        "finally",
        "make sure",
        "every day"
       ],
       "correct": "Good work. A strong response uses order words and clear, complete sentences.",
       "hint": "Use a different order word for each step and tell why it helps.",
       "support": "Structure: first, next, then, finally. Begin each sentence with an order word.",
       "extension": "Add one sentence about what to do the night before the test.",
       "wida": [
        "Sequence a process in writing",
        "Use procedural transitions"
       ],
       "frames": [
        "First, you should ___.",
        "Next, ___.",
        "Finally, ___."
       ],
       "teacher": {
        "use": "First writing task, procedural.",
        "function": "Writing a sequenced explanation.",
        "lower": "Provide a frame for each step.",
        "onLevel": "Write 4-6 sentences.",
        "challenge": "Add reasons for each step.",
        "noTech": "Write on paper.",
        "prompt": "Why does order matter when you explain a process?"
       }
      },
      {
       "id": "mt6-c-w-2",
       "title": "State and Support an Opinion",
       "skill": "Writing an argument with reasons",
       "prompt": "Some schools want to give every student a tablet for class. Do you agree or disagree? Write a paragraph that states your opinion and gives two reasons.",
       "type": "constructed",
       "responseLabel": "Your response",
       "responsePlaceholder": "I believe that ...",
       "wordBank": [
        "I believe",
        "one reason",
        "another reason",
        "for example",
        "in addition",
        "in conclusion"
       ],
       "correct": "Good work. A strong response states a clear opinion and supports it with reasons and a conclusion.",
       "hint": "Start with your opinion, give two reasons with examples, and end with a conclusion.",
       "support": "Structure: claim, reason one, reason two, conclusion. Use transitions to connect ideas.",
       "extension": "Add a sentence that responds to someone who disagrees.",
       "wida": [
        "Develop an argument",
        "Support a claim",
        "Use transitions"
       ],
       "frames": [
        "I believe that ___.",
        "One reason is ___.",
        "In conclusion, ___."
       ],
       "teacher": {
        "use": "Second writing task, argumentative.",
        "function": "Writing a claim with supporting reasons.",
        "lower": "Provide a paragraph frame.",
        "onLevel": "Write a full paragraph.",
        "challenge": "Include a counterargument.",
        "noTech": "Write and peer review.",
        "prompt": "Which reason is strongest?"
       }
      }
     ]
    },
    {
     "domain": "Speaking",
     "title": "Speaking",
     "directions": "You will be given a topic and a short time to plan. Then you will speak your answer aloud in complete sentences. Use the sentence frames to organize your ideas. Speak clearly and stay on the topic.",
     "estMinutes": 12,
     "items": [
      {
       "id": "mt6-c-s-1",
       "title": "Describe and Explain",
       "skill": "Describing with details",
       "prompt": "Describe a hobby you enjoy and explain why you like it. Speak 4-5 sentences.",
       "type": "constructed",
       "responseLabel": "Planning notes",
       "responsePlaceholder": "My favorite hobby is ...",
       "wordBank": [
        "my favorite hobby",
        "because",
        "I can",
        "for example",
        "it makes me feel"
       ],
       "correct": "Good work. A strong answer describes the hobby and gives clear reasons.",
       "hint": "Name the hobby, describe it, and use \"because\" to explain why you like it.",
       "support": "Use the frame \"My favorite hobby is ___ because ___.\"",
       "extension": "Compare it to another hobby you like less.",
       "wida": [
        "Describe with detail",
        "Give reasons orally"
       ],
       "frames": [
        "My favorite hobby is ___.",
        "I like it because ___.",
        "For example, ___."
       ],
       "adminScript": "Think about a hobby you enjoy. I want you to describe it and explain why you like it. Speak four or five sentences. You have one minute to plan, then you will speak.",
       "teacher": {
        "use": "First speaking task, descriptive.",
        "function": "Describing with supporting reasons.",
        "lower": "Offer a sentence starter.",
        "onLevel": "Speak 4-5 sentences.",
        "challenge": "Add a comparison.",
        "noTech": "Speak to a partner.",
        "prompt": "What made that your favorite hobby?"
       }
      },
      {
       "id": "mt6-c-s-2",
       "title": "Give an Opinion with Reasons",
       "skill": "Stating and supporting an opinion",
       "prompt": "Should students be allowed to use phones during lunch? Give your opinion and support it with two reasons. Speak 5-6 sentences.",
       "type": "constructed",
       "responseLabel": "Planning notes",
       "responsePlaceholder": "In my opinion, ...",
       "wordBank": [
        "in my opinion",
        "first of all",
        "in addition",
        "because",
        "however",
        "in conclusion"
       ],
       "correct": "Good work. A strong answer states an opinion and supports it with two clear reasons.",
       "hint": "State your opinion, give two reasons with \"because,\" and end with a conclusion.",
       "support": "Structure: opinion, reason one, reason two, conclusion.",
       "extension": "Mention a reason someone might disagree, then respond.",
       "wida": [
        "Express an opinion",
        "Support with reasons",
        "Organize a response"
       ],
       "frames": [
        "In my opinion, ___.",
        "First of all, ___.",
        "In conclusion, ___."
       ],
       "adminScript": "Think about whether students should be allowed to use phones during lunch. I want your opinion. Speak five or six sentences. State your opinion and give two reasons using the word because. Finish with a conclusion. You have two minutes to plan, then you will speak.",
       "teacher": {
        "use": "Final speaking task, opinion with support.",
        "function": "Stating and defending an opinion orally.",
        "lower": "Provide an opinion outline.",
        "onLevel": "Speak 5-6 sentences.",
        "challenge": "Respond to a live counterpoint.",
        "noTech": "Present to a small group.",
        "prompt": "What reason was most convincing?"
       }
      }
     ]
    }
   ]
  }
 ],
 "appendActivities": {
  "Model-Test": {
   "6-8-A": [
    {
     "id": "mt6-a-evidence",
     "title": "Find the Evidence",
     "skill": "Locate text evidence for an answer",
     "time": "7 min",
     "wida": [
      "Locate explicit detail",
      "Cite text evidence"
     ],
     "directions": "Read the passage. Click the ONE sentence that best proves the answer to the question.",
     "readFor": [
      "the key word in the question",
      "a sentence that states a fact",
      "where the proof is in the text"
     ],
     "vocabulary": [
      [
       "evidence",
       "proof from the text",
       "evidencia: prueba del texto"
      ],
      [
       "prove",
       "to show something is true",
       "probar: mostrar que algo es verdad"
      ],
      [
       "support",
       "to back up an answer",
       "apoyar: respaldar una respuesta"
      ]
     ],
     "frames": [
      "The evidence is in the sentence ___.",
      "This sentence proves ___ because ___."
     ],
     "type": "hotText",
     "prompt": "Click the sentence that proves WHY the city built more bike lanes.",
     "passageTitle": "Safer Streets for Bikes",
     "passage": [
      "Last year the city counted more bicycles on the road than ever before.",
      "City leaders worried that bikes and cars were too close together.",
      "To keep riders safe, the city painted special bike lanes on busy streets.",
      "Now many families say they feel comfortable riding to school and work."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "Last year the city counted more bicycles on the road than ever before."
      },
      {
       "id": "s2",
       "text": "City leaders worried that bikes and cars were too close together."
      },
      {
       "id": "s3",
       "text": "To keep riders safe, the city painted special bike lanes on busy streets."
      },
      {
       "id": "s4",
       "text": "Now many families say they feel comfortable riding to school and work."
      }
     ],
     "answers": [
      "s3"
     ],
     "correct": "Correct. Sentence 3 states the reason: the city built bike lanes to keep riders safe.",
     "hint": "A test asks \"why,\" so look for a sentence with a reason word like \"to keep.\"",
     "support": "Underline the key word in the question, then scan for the matching sentence.",
     "extension": "Find one more sentence that shows the result of the bike lanes.",
     "teacher": {
      "use": "Reading-strategy warm-up on citing evidence.",
      "function": "Locating the proof sentence for a why-question.",
      "lower": "Read the question and circle the key word together.",
      "onLevel": "Students work independently.",
      "challenge": "Ask students to label cause and result sentences.",
      "noTech": "Print the passage; students underline the proof.",
      "prompt": "Which word in the question told you what to look for?"
     }
    },
    {
     "id": "mt6-a-mainidea",
     "title": "Pick the Main Idea",
     "skill": "Identify the main idea of a passage",
     "time": "6 min",
     "wida": [
      "Identify central idea",
      "Distinguish main idea from detail"
     ],
     "directions": "Read the short passage. Choose the sentence that tells the MAIN idea, not just one small detail.",
     "readFor": [
      "what the whole passage is about",
      "an idea that covers every sentence",
      "details that are too small"
     ],
     "vocabulary": [
      [
       "main idea",
       "the most important point",
       "idea principal: el punto más importante"
      ],
      [
       "detail",
       "a small piece of information",
       "detalle: una pequeña información"
      ],
      [
       "topic",
       "what the text is about",
       "tema: de qué trata el texto"
      ]
     ],
     "frames": [
      "The main idea is ___.",
      "The other choices are only ___."
     ],
     "type": "multipleChoice",
     "prompt": "Passage: Sea otters wrap themselves in seaweed so they do not float away while they sleep. They also hold hands with other otters. These habits help otters stay safe in the ocean. What is the main idea?",
     "passageTitle": "Clever Sea Otters",
     "passage": [
      "Sea otters wrap themselves in seaweed so they do not float away while they sleep.",
      "They also hold hands with other otters.",
      "These habits help otters stay safe in the ocean."
     ],
     "options": [
      {
       "id": "a",
       "text": "Sea otters use clever habits to stay safe.",
       "visual": "🦦"
      },
      {
       "id": "b",
       "text": "Otters wrap up in seaweed.",
       "visual": "🌿"
      },
      {
       "id": "c",
       "text": "Otters hold hands.",
       "visual": "🤝"
      }
     ],
     "answer": "a",
     "correct": "Correct. The main idea covers the whole passage: otters use habits to stay safe.",
     "hint": "The main idea is bigger than one habit. It covers ALL the sentences.",
     "support": "Choices b and c are only single details. The main idea ties them together.",
     "extension": "Write your own title that matches the main idea.",
     "teacher": {
      "use": "Main-idea strategy practice.",
      "function": "Choosing a central idea over a detail.",
      "lower": "Read each option and ask: does it cover everything?",
      "onLevel": "Students choose independently.",
      "challenge": "Students explain why the detail choices are too narrow.",
      "noTech": "Read aloud; students point to the broadest choice.",
      "prompt": "How is a main idea different from a detail?"
     }
    },
    {
     "id": "mt6-a-keywords",
     "title": "Listen for Key Words",
     "skill": "Use key words to find the answer",
     "time": "6 min",
     "wida": [
      "Identify key words",
      "Locate explicit detail"
     ],
     "directions": "Listen to the short talk. Use the key word in the question to find the right answer.",
     "listenFor": [
      "the question key word",
      "numbers and times",
      "a place or object"
     ],
     "vocabulary": [
      [
       "key word",
       "the most important word",
       "palabra clave: la palabra más importante"
      ],
      [
       "announcement",
       "a spoken message to a group",
       "anuncio: un mensaje hablado a un grupo"
      ],
      [
       "deadline",
       "the last day to do something",
       "fecha límite: el último día para algo"
      ]
     ],
     "frames": [
      "The key word is ___.",
      "I heard ___, so the answer is ___."
     ],
     "type": "multipleChoice",
     "prompt": "When is the science project due?",
     "options": [
      {
       "id": "a",
       "text": "On Monday",
       "visual": "📅"
      },
      {
       "id": "b",
       "text": "On Friday",
       "visual": "🗓️"
      },
      {
       "id": "c",
       "text": "On Sunday",
       "visual": "📆"
      }
     ],
     "answer": "b",
     "correct": "Correct. The key word is \"due,\" and the speaker says the project is due on Friday.",
     "hint": "The question key word is \"due.\" Listen for the day that comes right after it.",
     "support": "When a question asks \"when,\" listen for a day, date, or time.",
     "extension": "What should students bring to class on Friday?",
     "adminScript": "Good morning, scientists. Your weather poster project is coming along well. Remember, the project is due on Friday, so finish your drawings tonight. We will present them on Monday. Now answer: When is the science project due?",
     "teacher": {
      "use": "Listening-strategy practice on key words.",
      "function": "Matching a question key word to the spoken answer.",
      "lower": "Say the key word aloud before reading the question.",
      "onLevel": "Read the script once.",
      "challenge": "Add a second date as a distractor.",
      "noTech": "Read aloud; students raise the matching day card.",
      "prompt": "Which word in the question told you to listen for a day?"
     }
    },
    {
     "id": "mt6-a-vocabsort",
     "title": "Academic Word Sort",
     "skill": "Sort academic test words by meaning",
     "time": "7 min",
     "wida": [
      "Build academic vocabulary",
      "Classify by meaning"
     ],
     "directions": "Each phrase tells you what a test word means. Choose the academic word that matches each meaning.",
     "listenFor": [
      "the action the word names",
      "what a direction asks for",
      "key academic verbs"
     ],
     "vocabulary": [
      [
       "analyze",
       "look at the parts carefully",
       "analizar: mirar las partes con cuidado"
      ],
      [
       "compare",
       "tell how things are alike",
       "comparar: decir en qué se parecen"
      ],
      [
       "summarize",
       "tell the main points briefly",
       "resumir: decir los puntos principales en breve"
      ],
      [
       "predict",
       "say what will happen next",
       "predecir: decir qué pasará después"
      ]
     ],
     "frames": [
      "The word ___ means ___.",
      "I matched ___ to ___ because ___."
     ],
     "type": "sort",
     "categories": [
      "Analyze",
      "Compare",
      "Summarize",
      "Predict"
     ],
     "items": [
      {
       "id": "v1",
       "text": "Break it into parts and study each one.",
       "answer": "Analyze"
      },
      {
       "id": "v2",
       "text": "Tell how two things are alike or different.",
       "answer": "Compare"
      },
      {
       "id": "v3",
       "text": "Give the main points in a few sentences.",
       "answer": "Summarize"
      },
      {
       "id": "v4",
       "text": "Use clues to say what will happen next.",
       "answer": "Predict"
      }
     ],
     "correct": "Strong work. You matched each academic verb to its meaning.",
     "hint": "Listen for the action: studying parts, telling likeness, shortening, or guessing the future.",
     "support": "These verbs show up in test directions. Knowing them helps you do the right task.",
     "extension": "Write one test question that uses the word \"analyze.\"",
     "teacher": {
      "use": "Academic-vocabulary station.",
      "function": "Classifying test verbs by meaning.",
      "lower": "Sort only two words first: compare and predict.",
      "onLevel": "Students sort all four.",
      "challenge": "Students add a fifth verb such as \"describe.\"",
      "noTech": "Cut meanings into strips and match on desks.",
      "prompt": "Which verb tells you to look at the future?"
     }
    },
    {
     "id": "mt6-a-orderpara",
     "title": "Order the Paragraph",
     "skill": "Organize sentences into a paragraph",
     "time": "7 min",
     "wida": [
      "Organize ideas",
      "Use transitions"
     ],
     "directions": "Put the sentences in the best order to make a clear paragraph. Use the transition words as clues.",
     "readFor": [
      "a topic sentence",
      "transition words",
      "a closing sentence"
     ],
     "vocabulary": [
      [
       "transition",
       "a word that links ideas",
       "transición: una palabra que une ideas"
      ],
      [
       "topic sentence",
       "the first sentence that names the idea",
       "oración temática: la primera oración que nombra la idea"
      ],
      [
       "conclusion",
       "the closing sentence",
       "conclusión: la oración de cierre"
      ]
     ],
     "frames": [
      "The topic sentence is ___.",
      "The word ___ shows this sentence comes ___."
     ],
     "type": "order",
     "items": [
      {
       "id": "o1",
       "text": "Learning to cook is a useful skill for students."
      },
      {
       "id": "o2",
       "text": "First, you learn to follow directions carefully."
      },
      {
       "id": "o3",
       "text": "Next, you practice measuring and mixing."
      },
      {
       "id": "o4",
       "text": "Finally, cooking helps you eat healthy food you enjoy."
      }
     ],
     "answer": [
      "o1",
      "o2",
      "o3",
      "o4"
     ],
     "correct": "Correct. The topic sentence comes first, then the steps with first/next, then the conclusion.",
     "hint": "The topic sentence names the big idea. Then follow first, next, finally.",
     "support": "A clear paragraph opens with the idea, builds with transitions, and closes with a result.",
     "extension": "Add one more sentence with the transition \"in addition.\"",
     "teacher": {
      "use": "Writing-organization practice.",
      "function": "Sequencing sentences into a coherent paragraph.",
      "lower": "Give students the topic sentence first.",
      "onLevel": "Students order all four independently.",
      "challenge": "Remove transition words and ask students to add them.",
      "noTech": "Cut sentences into strips to arrange on desks.",
      "prompt": "Which word told you the closing sentence?"
     }
    },
    {
     "id": "mt6-a-transitions",
     "title": "Choose the Transition",
     "skill": "Use transition words correctly",
     "time": "6 min",
     "wida": [
      "Use transitions",
      "Connect ideas in writing"
     ],
     "directions": "Complete the paragraph by choosing the best transition word for each blank.",
     "readFor": [
      "how ideas connect",
      "adding, contrasting, or concluding",
      "the meaning of each transition"
     ],
     "vocabulary": [
      [
       "however",
       "shows a difference",
       "sin embargo: muestra una diferencia"
      ],
      [
       "in addition",
       "adds another idea",
       "además: agrega otra idea"
      ],
      [
       "therefore",
       "shows a result",
       "por lo tanto: muestra un resultado"
      ]
     ],
     "frames": [
      "I chose ___ because the ideas ___.",
      "The word ___ adds a new idea."
     ],
     "type": "cloze",
     "prompt": "Fill in the transitions that connect the ideas.",
     "segments": [
      {
       "text": "Recycling helps the planet. "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "In addition",
        "options": [
         "In addition",
         "However",
         "Therefore"
        ]
       }
      },
      {
       "text": ", it can save families money. Some people think recycling takes too long. "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "However",
        "options": [
         "However",
         "In addition",
         "For example"
        ]
       }
      },
      {
       "text": ", new bins make it easy. "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "Therefore",
        "options": [
         "Therefore",
         "However",
         "Also"
        ]
       }
      },
      {
       "text": ", more families recycle every year."
      }
     ],
     "correct": "Correct. \"In addition\" adds an idea, \"However\" shows a difference, and \"Therefore\" shows a result.",
     "hint": "Decide if the sentence ADDS an idea, shows a DIFFERENCE, or gives a RESULT.",
     "support": "Match the transition to the job: add, contrast, or conclude.",
     "extension": "Write one new sentence using the transition \"for example.\"",
     "teacher": {
      "use": "Transitions practice for writing organization.",
      "function": "Selecting transitions by relationship between ideas.",
      "lower": "Tell students the job of each blank first.",
      "onLevel": "Students choose independently.",
      "challenge": "Students rewrite a sentence with a different transition.",
      "noTech": "Print and fill the blanks by hand.",
      "prompt": "How did you know the second blank showed a difference?"
     }
    },
    {
     "id": "mt6-a-multiselect-format",
     "title": "Pick All That Apply",
     "skill": "Answer 'select all' test items",
     "time": "6 min",
     "wida": [
      "Track multiple correct answers",
      "Read test directions"
     ],
     "directions": "Some test questions ask you to choose MORE THAN ONE answer. Choose every good test-taking habit.",
     "readFor": [
      "the words choose all",
      "more than one correct answer",
      "habits that help"
     ],
     "vocabulary": [
      [
       "select",
       "to choose",
       "seleccionar: elegir"
      ],
      [
       "habit",
       "something you do often",
       "hábito: algo que haces con frecuencia"
      ],
      [
       "review",
       "to check your work",
       "revisar: comprobar tu trabajo"
      ]
     ],
     "frames": [
      "A good habit is ___.",
      "I chose ___ because it helps me ___."
     ],
     "type": "multiSelect",
     "prompt": "Which of these are GOOD test-taking habits? Choose all that apply.",
     "options": [
      {
       "id": "a",
       "text": "Read every question before you answer."
      },
      {
       "id": "b",
       "text": "Guess quickly without reading."
      },
      {
       "id": "c",
       "text": "Cross out answers you know are wrong."
      },
      {
       "id": "d",
       "text": "Check your work if you have time."
      }
     ],
     "answers": [
      "a",
      "c",
      "d"
     ],
     "correct": "Correct. Reading carefully, crossing out wrong answers, and checking your work are strong habits.",
     "hint": "One choice is a BAD habit. \"Select all\" means more than one can be right.",
     "support": "On select-all items, judge each choice on its own as good or bad.",
     "extension": "Add one more good habit you use during a test.",
     "teacher": {
      "use": "Test-format familiarity (multi-select).",
      "function": "Selecting all correct options.",
      "lower": "Read each habit and ask good or bad.",
      "onLevel": "Students choose independently.",
      "challenge": "Students rank the habits from most to least helpful.",
      "noTech": "Read aloud; students check the good habits.",
      "prompt": "Why is guessing quickly a weak habit?"
     }
    },
    {
     "id": "mt6-a-speak-plan",
     "title": "Plan a Spoken Answer",
     "skill": "Organize ideas before speaking",
     "time": "8 min",
     "wida": [
      "Organize an oral response",
      "Use sentence frames"
     ],
     "directions": "Read the topic. Write planning notes, then practice saying your answer in complete sentences.",
     "sayFor": [
      "an opinion sentence",
      "two reasons",
      "a closing sentence"
     ],
     "vocabulary": [
      [
       "opinion",
       "what you think",
       "opinión: lo que piensas"
      ],
      [
       "reason",
       "why you think it",
       "razón: por qué lo piensas"
      ],
      [
       "organize",
       "to put in order",
       "organizar: poner en orden"
      ]
     ],
     "frames": [
      "In my opinion, ___.",
      "One reason is ___.",
      "In conclusion, ___."
     ],
     "type": "constructed",
     "prompt": "Topic: Should students have a longer lunch break? Plan an answer with an opinion and two reasons.",
     "responseLabel": "Planning notes",
     "responsePlaceholder": "In my opinion, ...",
     "correct": "Response saved. A strong spoken answer states an opinion and gives two clear reasons.",
     "hint": "Start with your opinion, then give two reasons with \"because.\"",
     "support": "Use the frames: opinion, reason one, reason two, conclusion.",
     "extension": "Add a sentence that answers someone who disagrees.",
     "teacher": {
      "use": "Speaking-organization planning task.",
      "function": "Planning and delivering an organized opinion.",
      "lower": "Give students an opinion outline to fill.",
      "onLevel": "Students plan and speak 4-5 sentences.",
      "challenge": "Students add a counterpoint and respond.",
      "noTech": "Students speak to a partner using the frames.",
      "prompt": "Which reason was strongest, and why?"
     }
    },
    {
     "id": "mt6-ws-strategies",
     "title": "Test-Taking Strategies",
     "skill": "Review test-taking strategies",
     "time": "10 min",
     "type": "worksheet",
     "wida": [
      "Apply test strategies",
      "Self-monitor"
     ],
     "directions": "Read each strategy. Check the box, then write one example of how you will use it on the ACCESS test.",
     "sheet": [
      {
       "heading": "Before You Start",
       "items": [
        "Read the directions slowly before you begin. Underline the key word.",
        "Look at how many questions there are and plan your time.",
        "Take a slow breath and remind yourself: I have practiced for this."
       ]
      },
      {
       "heading": "While You Work",
       "items": [
        "Read the whole question before choosing an answer.",
        "Cross out answers you know are wrong, then choose from what is left.",
        "If a question is hard, mark it, skip it, and come back later.",
        "For listening, write a key word as soon as you hear it."
       ]
      },
      {
       "heading": "Before You Finish",
       "items": [
        "Check that you answered every question.",
        "Review any items you marked to come back to.",
        "Make sure your writing has complete sentences and end marks."
       ]
      }
     ],
     "teacher": {
      "use": "Strategy reference and reflection sheet before a practice test.",
      "function": "Reviewing and personalizing test strategies.",
      "lower": "Read each strategy aloud; students restate it.",
      "onLevel": "Students add one example per strategy.",
      "challenge": "Students rank the three most useful strategies.",
      "noTech": "Print and complete by hand.",
      "prompt": "Which strategy will help you most, and why?"
     }
    },
    {
     "id": "mt6-ws-vocab",
     "title": "Academic Vocabulary for ACCESS",
     "skill": "Study academic test vocabulary",
     "time": "10 min",
     "type": "worksheet",
     "wida": [
      "Build academic vocabulary",
      "Use words in context"
     ],
     "directions": "Study each word and its meaning. Then write one sentence that uses the word correctly.",
     "sheet": [
      {
       "heading": "Direction Verbs",
       "items": [
        "analyze — break something into parts and study each part",
        "compare — tell how two things are alike",
        "contrast — tell how two things are different",
        "summarize — give the main points in a few words",
        "explain — tell why or how something happens"
       ]
      },
      {
       "heading": "Reading Words",
       "items": [
        "main idea — the most important point of a text",
        "detail — a small piece of information that supports the main idea",
        "evidence — proof from the text",
        "infer — figure out something using clues"
       ]
      },
      {
       "heading": "Writing Words",
       "items": [
        "topic sentence — the sentence that names the big idea",
        "transition — a word that links ideas, such as however or in addition",
        "conclusion — the closing sentence or idea"
       ]
      }
     ],
     "teacher": {
      "use": "Academic-vocabulary study sheet for test prep.",
      "function": "Studying and applying academic words.",
      "lower": "Review five words at a time; students echo meanings.",
      "onLevel": "Students write one sentence per word.",
      "challenge": "Students group words by domain (reading/writing).",
      "noTech": "Print as a study guide for home.",
      "prompt": "Which word do you see most often on tests?"
     }
    },
    {
     "id": "mt6-ws-bubble",
     "title": "Full-Test Answer Sheet & Bubble Practice",
     "skill": "Practice marking an answer sheet",
     "time": "8 min",
     "type": "worksheet",
     "wida": [
      "Follow test format",
      "Mark responses accurately"
     ],
     "directions": "Practice filling in the bubble for each answer completely and neatly. Use the practice rows below.",
     "sheet": [
      {
       "heading": "How to Bubble",
       "items": [
        "Fill in the whole circle, not just a check mark.",
        "Make your mark dark and stay inside the circle.",
        "Erase fully if you change your answer.",
        "Match the question number to the same number on the answer sheet."
       ]
      },
      {
       "heading": "Practice Rows (fill the chosen letter)",
       "items": [
        "1.   A    B    C    D",
        "2.   A    B    C    D",
        "3.   A    B    C    D",
        "4.   A    B    C    D",
        "5.   A    B    C    D"
       ]
      },
      {
       "heading": "Check Yourself",
       "items": [
        "Did you fill one bubble per row?",
        "Are all your marks dark and neat?",
        "Did your row number match the question number?"
       ]
      }
     ],
     "teacher": {
      "use": "Bubble-sheet familiarity for paper-format readiness.",
      "function": "Practicing accurate answer-sheet marking.",
      "lower": "Model filling one bubble on the board.",
      "onLevel": "Students complete the practice rows.",
      "challenge": "Students self-check using the checklist.",
      "noTech": "Print rows for hand practice.",
      "prompt": "Why does a clear, dark bubble matter on a scanned test?"
     }
    }
   ],
   "6-8-B": [
    {
     "id": "mt6-b-inference",
     "title": "Read Between the Lines",
     "skill": "Make an inference from the text",
     "time": "7 min",
     "wida": [
      "Make inferences",
      "Use text clues"
     ],
     "directions": "Read the passage. The answer is not stated directly. Use clues to choose the best inference.",
     "readFor": [
      "clue words that show feelings",
      "what is NOT said directly",
      "the most likely answer"
     ],
     "vocabulary": [
      [
       "infer",
       "to figure out using clues",
       "inferir: averiguar usando pistas"
      ],
      [
       "clue",
       "a hint in the text",
       "pista: una señal en el texto"
      ],
      [
       "likely",
       "probably true",
       "probable: que probablemente es verdad"
      ]
     ],
     "frames": [
      "The clue ___ shows that ___.",
      "I can infer that ___."
     ],
     "type": "multipleChoice",
     "prompt": "Passage: Maria packed her umbrella and rain boots before school. She looked out the window and frowned. How does Maria most likely feel about the weather?",
     "passageTitle": "A Wet Morning",
     "passage": [
      "Maria packed her umbrella and rain boots before school.",
      "She looked out the window and frowned."
     ],
     "options": [
      {
       "id": "a",
       "text": "She is unhappy about the rain.",
       "visual": "🌧️"
      },
      {
       "id": "b",
       "text": "She is excited for a sunny day.",
       "visual": "☀️"
      },
      {
       "id": "c",
       "text": "She forgot it was a school day.",
       "visual": "🛌"
      }
     ],
     "answer": "a",
     "correct": "Correct. The umbrella, boots, and frown are clues that Maria is unhappy about the rain.",
     "hint": "The text does not say the feeling. Use the clue word \"frowned.\"",
     "support": "An inference uses clues. A frown is a clue about how someone feels.",
     "extension": "Find another clue that shows it will rain.",
     "teacher": {
      "use": "Inference reading strategy.",
      "function": "Inferring a feeling from text clues.",
      "lower": "Underline the clue words together.",
      "onLevel": "Students infer independently.",
      "challenge": "Students name two clues that support the answer.",
      "noTech": "Read aloud; students point to the clue.",
      "prompt": "What clue told you how Maria felt?"
     }
    },
    {
     "id": "mt6-b-context",
     "title": "Word Meaning in Context",
     "skill": "Use context clues for word meaning",
     "time": "6 min",
     "wida": [
      "Use context clues",
      "Determine word meaning"
     ],
     "directions": "Read the passage. Use the words around each blank to choose the best meaning.",
     "readFor": [
      "words near the blank",
      "examples or definitions",
      "the best fit"
     ],
     "vocabulary": [
      [
       "context",
       "the words around a word",
       "contexto: las palabras alrededor de una palabra"
      ],
      [
       "fragile",
       "easy to break",
       "frágil: fácil de romper"
      ],
      [
       "enormous",
       "very large",
       "enorme: muy grande"
      ]
     ],
     "frames": [
      "The word ___ means ___.",
      "The clue ___ helped me choose."
     ],
     "type": "cloze",
     "prompt": "Choose the meaning that fits the sentence.",
     "passageTitle": "Moving Day",
     "passage": [
      "We wrapped the glass dishes in soft cloth because they were fragile.",
      "Then we lifted an enormous couch that barely fit through the door."
     ],
     "segments": [
      {
       "text": "The dishes were fragile, which means they were "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "easy to break",
        "options": [
         "easy to break",
         "very heavy",
         "brand new"
        ]
       }
      },
      {
       "text": ". The couch was enormous, which means it was "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "very large",
        "options": [
         "very large",
         "very soft",
         "very old"
        ]
       }
      },
      {
       "text": "."
      }
     ],
     "correct": "Correct. \"Fragile\" means easy to break, and \"enormous\" means very large.",
     "hint": "Look at the words around each one: soft cloth and barely fit through the door.",
     "support": "Context clues are the nearby words that hint at the meaning.",
     "extension": "Use the word \"fragile\" in a new sentence.",
     "teacher": {
      "use": "Vocabulary-in-context reading strategy.",
      "function": "Using context clues to define words.",
      "lower": "Read the clue words aloud first.",
      "onLevel": "Students choose independently.",
      "challenge": "Students cover the word and predict the meaning.",
      "noTech": "Print and fill the blanks by hand.",
      "prompt": "Which nearby words gave you the meaning?"
     }
    },
    {
     "id": "mt6-b-listen-order",
     "title": "Order What You Hear",
     "skill": "Sequence spoken steps",
     "time": "7 min",
     "wida": [
      "Sequence steps",
      "Follow signal words"
     ],
     "directions": "Listen to the steps. Put them in the order the speaker says them. Use order words as clues.",
     "listenFor": [
      "order words first/next/then/finally",
      "what comes first",
      "the last step"
     ],
     "vocabulary": [
      [
       "sequence",
       "the order of steps",
       "secuencia: el orden de los pasos"
      ],
      [
       "signal word",
       "a word that shows order",
       "palabra de orden: una palabra que muestra el orden"
      ],
      [
       "procedure",
       "a set of steps",
       "procedimiento: un conjunto de pasos"
      ]
     ],
     "frames": [
      "The first step is ___.",
      "The word ___ tells me this comes ___."
     ],
     "type": "order",
     "items": [
      {
       "id": "o1",
       "text": "Log in to the testing website."
      },
      {
       "id": "o2",
       "text": "Read the directions on the screen."
      },
      {
       "id": "o3",
       "text": "Answer each question."
      },
      {
       "id": "o4",
       "text": "Click submit when you finish."
      }
     ],
     "answer": [
      "o1",
      "o2",
      "o3",
      "o4"
     ],
     "correct": "Correct. Log in, read directions, answer questions, then submit.",
     "hint": "Listen for first, next, then, and finally.",
     "support": "Signal words mark each step of a spoken procedure.",
     "extension": "Why is reading the directions before answering important?",
     "adminScript": "Here is how you take the online test. First, log in to the testing website with your name. Next, read the directions on the screen carefully. Then answer each question one at a time. Finally, click submit when you finish. Now put the steps in order.",
     "teacher": {
      "use": "Listening-sequence test-prep item.",
      "function": "Ordering an oral procedure.",
      "lower": "Use movable step strips while listening.",
      "onLevel": "Read the script once.",
      "challenge": "Remove signal words and reread.",
      "noTech": "Read aloud; students number the steps.",
      "prompt": "Which step do students forget most often?"
     }
    },
    {
     "id": "mt6-b-directions-verb",
     "title": "What Is the Question Asking?",
     "skill": "Interpret academic direction verbs",
     "time": "6 min",
     "wida": [
      "Interpret directions",
      "Build academic vocabulary"
     ],
     "directions": "Test questions use special verbs. Read the question and choose what it is really asking you to do.",
     "readFor": [
      "the academic verb",
      "the action the verb names",
      "what to do first"
     ],
     "vocabulary": [
      [
       "describe",
       "tell what something is like",
       "describir: decir cómo es algo"
      ],
      [
       "explain",
       "tell why or how",
       "explicar: decir por qué o cómo"
      ],
      [
       "identify",
       "point out or name",
       "identificar: señalar o nombrar"
      ]
     ],
     "frames": [
      "The verb ___ asks me to ___.",
      "First I will ___."
     ],
     "type": "multipleChoice",
     "prompt": "A question says: \"Explain why the character changed.\" What should you do?",
     "options": [
      {
       "id": "a",
       "text": "Give the reasons the character changed.",
       "visual": "💭"
      },
      {
       "id": "b",
       "text": "List the characters' names.",
       "visual": "📝"
      },
      {
       "id": "c",
       "text": "Draw a picture of the character.",
       "visual": "🎨"
      }
     ],
     "answer": "a",
     "correct": "Correct. \"Explain\" asks you to give reasons — why or how.",
     "hint": "The verb is \"explain.\" It asks for reasons, not just a list.",
     "support": "Match the verb to the task: explain = give reasons; identify = name; describe = tell about.",
     "extension": "What would the question ask if the verb were \"describe\"?",
     "teacher": {
      "use": "Academic direction-verb strategy.",
      "function": "Interpreting the verb \"explain.\"",
      "lower": "Underline the verb in the question.",
      "onLevel": "Students answer independently.",
      "challenge": "Students rewrite the task for a different verb.",
      "noTech": "Read aloud; students point to the matching action.",
      "prompt": "How is \"explain\" different from \"identify\"?"
     }
    },
    {
     "id": "mt6-b-topic-sort",
     "title": "Topic Sentence or Detail?",
     "skill": "Sort topic sentences from details",
     "time": "7 min",
     "wida": [
      "Organize ideas",
      "Distinguish main idea from detail"
     ],
     "directions": "Decide whether each sentence is a TOPIC sentence (the big idea) or a DETAIL (a small fact).",
     "readFor": [
      "a broad idea",
      "a small specific fact",
      "what could open a paragraph"
     ],
     "vocabulary": [
      [
       "broad",
       "covers a lot",
       "amplio: que cubre mucho"
      ],
      [
       "specific",
       "about one small thing",
       "específico: sobre una sola cosa pequeña"
      ],
      [
       "paragraph",
       "a group of sentences about one idea",
       "párrafo: un grupo de oraciones sobre una idea"
      ]
     ],
     "frames": [
      "This is a ___ sentence because ___.",
      "A topic sentence is more ___."
     ],
     "type": "sort",
     "categories": [
      "Topic Sentence",
      "Detail"
     ],
     "items": [
      {
       "id": "t1",
       "text": "Dogs make wonderful pets for many reasons.",
       "answer": "Topic Sentence"
      },
      {
       "id": "t2",
       "text": "My dog wags his tail when I come home.",
       "answer": "Detail"
      },
      {
       "id": "t3",
       "text": "Exercise keeps the body healthy in several ways.",
       "answer": "Topic Sentence"
      },
      {
       "id": "t4",
       "text": "Running for ten minutes raised my heart rate.",
       "answer": "Detail"
      }
     ],
     "correct": "Strong work. Topic sentences are broad; details are small specific facts.",
     "hint": "A topic sentence could open a whole paragraph. A detail is one small fact.",
     "support": "If a sentence is broad enough to start a paragraph, it is a topic sentence.",
     "extension": "Write a detail that supports the topic sentence about dogs.",
     "teacher": {
      "use": "Writing-organization sort.",
      "function": "Distinguishing topic sentences from details.",
      "lower": "Sort only the dog sentences first.",
      "onLevel": "Students sort all four.",
      "challenge": "Students write one detail for each topic sentence.",
      "noTech": "Cut into strips and sort on desks.",
      "prompt": "What makes a sentence broad enough to be a topic sentence?"
     }
    },
    {
     "id": "mt6-b-time-strategy",
     "title": "Smart Test Choices",
     "skill": "Apply test-taking strategy",
     "time": "6 min",
     "wida": [
      "Apply strategy",
      "Reason about a situation"
     ],
     "directions": "Read the test situation. Choose the smartest thing to do.",
     "readFor": [
      "the problem in the situation",
      "the smartest action",
      "what wastes time"
     ],
     "vocabulary": [
      [
       "strategy",
       "a smart plan",
       "estrategia: un plan inteligente"
      ],
      [
       "skip",
       "to leave for later",
       "saltar: dejar para después"
      ],
      [
       "manage time",
       "use your time well",
       "administrar el tiempo: usar bien tu tiempo"
      ]
     ],
     "frames": [
      "The smart choice is ___.",
      "I would ___ because ___."
     ],
     "type": "multipleChoice",
     "prompt": "You reach a hard question and only 10 minutes are left. What is the smartest choice?",
     "options": [
      {
       "id": "a",
       "text": "Mark it, skip ahead, and come back if there is time.",
       "visual": "⏭️"
      },
      {
       "id": "b",
       "text": "Stop the whole test and give up.",
       "visual": "🛑"
      },
      {
       "id": "c",
       "text": "Spend all 10 minutes on that one question.",
       "visual": "⏳"
      }
     ],
     "answer": "a",
     "correct": "Correct. Skip the hard one, answer the rest, and come back if time allows.",
     "hint": "Think about what gets you the MOST questions answered.",
     "support": "Good time management means not getting stuck on one hard item.",
     "extension": "How could you mark a question so you remember to return?",
     "teacher": {
      "use": "Test-taking time-management strategy.",
      "function": "Choosing a smart action under time pressure.",
      "lower": "Talk through what each choice costs.",
      "onLevel": "Students answer independently.",
      "challenge": "Students explain a time plan for a 30-minute test.",
      "noTech": "Read aloud; students vote on the smartest choice.",
      "prompt": "Why is getting stuck on one question risky?"
     }
    },
    {
     "id": "mt6-b-sequence-text",
     "title": "What Happened First?",
     "skill": "Locate sequence in a text",
     "time": "6 min",
     "wida": [
      "Sequence events",
      "Locate explicit detail"
     ],
     "directions": "Read the passage. Click the sentence that tells what the class did FIRST.",
     "readFor": [
      "order words",
      "the first action",
      "time clues"
     ],
     "vocabulary": [
      [
       "first",
       "before the others",
       "primero: antes de los demás"
      ],
      [
       "then",
       "after that",
       "luego: después de eso"
      ],
      [
       "event",
       "something that happens",
       "evento: algo que sucede"
      ]
     ],
     "frames": [
      "The class did ___ first.",
      "The word ___ shows the order."
     ],
     "type": "hotText",
     "prompt": "Click the sentence that tells what the class did FIRST on the field trip.",
     "passageTitle": "A Day at the Aquarium",
     "passage": [
      "When the class arrived, they first watched a short film about the ocean.",
      "After the film, they walked through the shark tunnel.",
      "Then they fed the stingrays in the touch pool.",
      "Finally, they ate lunch outside before the bus ride home."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "When the class arrived, they first watched a short film about the ocean."
      },
      {
       "id": "s2",
       "text": "After the film, they walked through the shark tunnel."
      },
      {
       "id": "s3",
       "text": "Then they fed the stingrays in the touch pool."
      },
      {
       "id": "s4",
       "text": "Finally, they ate lunch outside before the bus ride home."
      }
     ],
     "answers": [
      "s1"
     ],
     "correct": "Correct. The word \"first\" shows the class watched the film before anything else.",
     "hint": "Look for the order word \"first.\"",
     "support": "Order words like first, after, then, and finally show the sequence.",
     "extension": "Click the sentence that tells what they did LAST.",
     "teacher": {
      "use": "Sequence-in-text reading strategy.",
      "function": "Locating the first event using order words.",
      "lower": "Highlight order words together.",
      "onLevel": "Students work independently.",
      "challenge": "Students list all four events in order.",
      "noTech": "Print and underline the order words.",
      "prompt": "Which order word told you the first event?"
     }
    },
    {
     "id": "mt6-b-write-compare",
     "title": "Write a Comparison",
     "skill": "Write a comparison paragraph",
     "time": "9 min",
     "wida": [
      "Compare in writing",
      "Use transitions",
      "Develop a paragraph"
     ],
     "directions": "Read the prompt. Plan your ideas, then write 4-6 sentences that compare the two things.",
     "sayFor": [
      "a topic sentence",
      "two likenesses or differences",
      "a closing sentence"
     ],
     "vocabulary": [
      [
       "compare",
       "tell how things are alike",
       "comparar: decir en qué se parecen"
      ],
      [
       "contrast",
       "tell how things are different",
       "contrastar: decir en qué se diferencian"
      ],
      [
       "both",
       "the two together",
       "ambos: los dos juntos"
      ]
     ],
     "frames": [
      "Both ___ and ___ are ___.",
      "However, ___ is different because ___.",
      "In conclusion, ___."
     ],
     "type": "constructed",
     "prompt": "Prompt: Compare reading a book and watching a movie of the same story. Write 4-6 sentences telling how they are alike and different.",
     "responseLabel": "Your response",
     "responsePlaceholder": "Both a book and a movie ...",
     "wordBank": [
      "both",
      "alike",
      "however",
      "while",
      "in addition",
      "in conclusion"
     ],
     "correct": "Good work. A strong comparison shows likenesses and differences with clear transitions.",
     "hint": "Start with one way they are alike, then a way they are different, then a conclusion.",
     "support": "Structure: topic sentence, likeness, difference, conclusion. Use \"both\" and \"however.\"",
     "extension": "Add a sentence saying which you prefer and why.",
     "teacher": {
      "use": "Writing comparison constructed response.",
      "function": "Composing a compare-contrast paragraph.",
      "lower": "Provide a compare-contrast frame.",
      "onLevel": "Students write 4-6 sentences.",
      "challenge": "Students add a preference with a reason.",
      "noTech": "Write on paper and peer review.",
      "prompt": "Which transition signaled a difference?"
     }
    }
   ]
  }
 }
};
