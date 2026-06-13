/* access-data-v5.js — ACCESS Practice Lab v5.0 catalog expansion.
 * Adds ~60 new activities + 12 printable worksheets across all domains, plus a
 * second ("mini") WIDA-style practice test per domain. Generated/validated from
 * the per-domain content batches; merged additively by app.js (mergeV5).
 */
window.ACCESS_LAB_V5 = {
 "tests": [
  {
   "id": "wida-listening-mini",
   "domain": "Listening",
   "title": "Listening Mini Practice Test",
   "gradeCluster": "Grades 6-8",
   "tier": "WIDA-style model practice",
   "overview": "A short Listening practice set. The teacher or app reads each script aloud. Students answer questions about classroom, science, and community topics.",
   "sections": [
    {
     "domain": "Listening",
     "title": "Listen and Answer",
     "directions": "Listen to each script read aloud. Then answer the question. You may listen one more time if you need to.",
     "estMinutes": 12,
     "items": [
      {
       "id": "lv5-mini-l1",
       "title": "Library Reminder",
       "skill": "Identify a key detail",
       "type": "multipleChoice",
       "prompt": "What does the announcement remind students to do?",
       "options": [
        {
         "id": "a",
         "text": "Return library books",
         "visual": "📚"
        },
        {
         "id": "b",
         "text": "Buy new books",
         "visual": "💵"
        },
        {
         "id": "c",
         "text": "Clean the library",
         "visual": "🧹"
        }
       ],
       "answer": "a",
       "correct": "Correct. The announcement reminds students to return their library books by Friday.",
       "hint": "Listen for the action word and the day.",
       "support": "Return means to give the books back.",
       "extension": "What happens if a book is late?",
       "wida": [
        "identify key details"
       ],
       "listenFor": [
        "an action word",
        "a day",
        "a place"
       ],
       "adminScript": "Attention, students. This is a reminder from the library. Please return your library books by Friday so other students can borrow them. Now answer: what does the announcement remind students to do?"
      },
      {
       "id": "lv5-mini-l2",
       "title": "Bring for the Project",
       "skill": "Identify multiple details",
       "type": "multiSelect",
       "prompt": "Which materials does the teacher say to bring for the art project?",
       "options": [
        {
         "id": "a",
         "text": "Scissors"
        },
        {
         "id": "b",
         "text": "Glue"
        },
        {
         "id": "c",
         "text": "A ruler"
        },
        {
         "id": "d",
         "text": "Colored paper"
        }
       ],
       "answers": [
        "a",
        "b",
        "d"
       ],
       "correct": "Correct. The teacher lists scissors, glue, and colored paper.",
       "hint": "Track the list joined with and. A ruler was not mentioned.",
       "support": "Listen for each item in the list, one at a time.",
       "extension": "Why are scissors useful for this project?",
       "wida": [
        "identify multiple details",
        "track a spoken list"
       ],
       "listenFor": [
        "a list of items",
        "the word and",
        "an item not mentioned"
       ],
       "adminScript": "For tomorrow's art project, please bring scissors, glue, and colored paper. You will not need a ruler. Now answer: which materials does the teacher say to bring?"
      },
      {
       "id": "lv5-mini-l3",
       "title": "Plant Steps",
       "skill": "Sequence oral steps",
       "type": "order",
       "prompt": "Put the steps for planting a seed in the order the teacher explains.",
       "items": [
        {
         "id": "i1",
         "text": "Fill the pot with soil."
        },
        {
         "id": "i2",
         "text": "Make a small hole."
        },
        {
         "id": "i3",
         "text": "Drop in the seed."
        },
        {
         "id": "i4",
         "text": "Water the soil."
        }
       ],
       "answer": [
        "i1",
        "i2",
        "i3",
        "i4"
       ],
       "correct": "Correct. The order is: fill, make a hole, drop the seed, water.",
       "hint": "Listen for order words: first, next, then, finally.",
       "support": "Each signal word marks a new step.",
       "extension": "Why do you water the seed last?",
       "wida": [
        "sequence steps",
        "follow signal words"
       ],
       "listenFor": [
        "order words",
        "the first step",
        "the last step"
       ],
       "adminScript": "Here is how to plant a seed. First, fill the pot with soil. Next, make a small hole with your finger. Then drop in the seed. Finally, water the soil gently. Now put the steps in order."
      },
      {
       "id": "lv5-mini-l4",
       "title": "Weather Report Summary",
       "skill": "Complete a spoken summary",
       "type": "cloze",
       "prompt": "Complete the summary of the weather report.",
       "segments": [
        {
         "text": "Tomorrow morning will be "
        },
        {
         "blank": {
          "id": "b1",
          "answer": "sunny",
          "options": [
           "sunny",
           "rainy",
           "snowy"
          ]
         }
        },
        {
         "text": ", but the afternoon will turn "
        },
        {
         "blank": {
          "id": "b2",
          "answer": "windy",
          "options": [
           "windy",
           "warm",
           "calm"
          ]
         }
        },
        {
         "text": ", so hold onto your papers outside."
        }
       ],
       "correct": "Correct. The morning is sunny and the afternoon turns windy.",
       "hint": "Listen for the weather word for each part of the day.",
       "support": "Match the morning and afternoon weather to the blanks.",
       "extension": "What should you do because it is windy?",
       "wida": [
        "complete a summary",
        "identify key details"
       ],
       "listenFor": [
        "a weather word",
        "a time of day",
        "advice"
       ],
       "adminScript": "Here is tomorrow's weather report. The morning will be sunny and bright. In the afternoon it will turn windy, so hold onto your papers when you are outside. Now complete the summary."
      },
      {
       "id": "lv5-mini-l5",
       "title": "Who Is Speaking?",
       "skill": "Infer the speaker",
       "type": "multipleChoice",
       "prompt": "Who is most likely speaking?",
       "options": [
        {
         "id": "a",
         "text": "A bus driver",
         "visual": "🚌"
        },
        {
         "id": "b",
         "text": "A librarian",
         "visual": "📖"
        },
        {
         "id": "c",
         "text": "A coach",
         "visual": "🏅"
        }
       ],
       "answer": "a",
       "correct": "Correct. The clues about seats, seatbelts, and the next stop point to a bus driver.",
       "hint": "Listen for words about seats, stops, and the road.",
       "support": "Use the place and tools in the speech to guess the speaker.",
       "extension": "What other clue could tell you the speaker's job?",
       "wida": [
        "infer the speaker",
        "use context clues"
       ],
       "listenFor": [
        "place words",
        "tool or vehicle words",
        "what the speaker does"
       ],
       "adminScript": "Please stay in your seats and keep your seatbelts on. Our next stop is the corner of Oak Street, so get ready if that is where you get off. Now answer: who is most likely speaking?"
      },
      {
       "id": "lv5-mini-l6",
       "title": "Recycling Sort",
       "skill": "Connect language to categories",
       "type": "sort",
       "prompt": "Listen to each item. Sort it into the right recycling bin.",
       "categories": [
        "Paper",
        "Plastic",
        "Cans"
       ],
       "items": [
        {
         "id": "s1",
         "text": "an old newspaper",
         "answer": "Paper"
        },
        {
         "id": "s2",
         "text": "an empty water bottle",
         "answer": "Plastic"
        },
        {
         "id": "s3",
         "text": "a soda can",
         "answer": "Cans"
        },
        {
         "id": "s4",
         "text": "a used notebook page",
         "answer": "Paper"
        }
       ],
       "correct": "Strong sorting. You matched each item to the correct recycling bin.",
       "hint": "Listen for what each item is made of.",
       "support": "Newspaper and notebook pages are paper. Bottles are plastic. Cans are metal.",
       "extension": "Name one more item for each bin.",
       "wida": [
        "sorting information",
        "classify by material"
       ],
       "listenFor": [
        "material words",
        "what each item is made of",
        "the bin name"
       ],
       "adminScript": "Listen and sort each item into the right recycling bin. An old newspaper. An empty water bottle. A soda can. A used notebook page. Now place each item in the correct bin."
      }
     ]
    }
   ]
  },
  {
   "id": "wida-reading-mini",
   "domain": "Reading",
   "title": "WIDA Reading Mini-Practice: The Animal Shelter",
   "gradeCluster": "Grades 6-8",
   "tier": "WIDA-style model practice",
   "overview": "A short reading practice set built around one connected text about a community animal shelter. Students read each part, then answer a question that grows in difficulty: locate a detail, sequence events, infer, use vocabulary, and identify the main idea. Estimated time is about 15 minutes.",
   "sections": [
    {
     "domain": "Reading",
     "title": "Read and Answer: The Animal Shelter",
     "directions": "Read each part of the article. Then answer the question for that part. Use only the text to answer.",
     "estMinutes": 15,
     "items": [
      {
       "id": "rv5-mini-1",
       "title": "Part 1: A New Shelter",
       "skill": "Locate an explicit detail",
       "type": "hotText",
       "passageTitle": "The Animal Shelter (Part 1)",
       "passage": [
        "Last year, the town opened a new animal shelter on Oak Street.",
        "The shelter takes in dogs and cats that have no home.",
        "Volunteers feed the animals, clean the cages, and play with them every day.",
        "The shelter's goal is to find a safe family for each animal."
       ],
       "prompt": "Click the sentence that tells the shelter's goal.",
       "sentences": [
        {
         "id": "s1",
         "text": "Last year, the town opened a new animal shelter on Oak Street."
        },
        {
         "id": "s2",
         "text": "The shelter takes in dogs and cats that have no home."
        },
        {
         "id": "s3",
         "text": "Volunteers feed the animals, clean the cages, and play with them every day."
        },
        {
         "id": "s4",
         "text": "The shelter's goal is to find a safe family for each animal."
        }
       ],
       "answers": [
        "s4"
       ],
       "correct": "Correct. The last sentence states the shelter's goal: to find a safe family for each animal.",
       "hint": "Look for the word \"goal.\"",
       "support": "Scan for the key word \"goal.\" The answer is usually in the same sentence.",
       "wida": [
        "Locate explicit detail"
       ]
      },
      {
       "id": "rv5-mini-2",
       "title": "Part 2: What Volunteers Do",
       "skill": "Identify multiple details",
       "type": "multiSelect",
       "passageTitle": "The Animal Shelter (Part 2)",
       "passage": [
        "Volunteers do many jobs at the shelter.",
        "In the morning, they fill the food and water bowls.",
        "They also walk the dogs and brush the cats.",
        "They do not give the animals medicine; only the vet does that."
       ],
       "prompt": "Which jobs do volunteers do? Choose all that apply.",
       "options": [
        {
         "id": "a",
         "text": "Fill the food and water bowls"
        },
        {
         "id": "b",
         "text": "Walk the dogs"
        },
        {
         "id": "c",
         "text": "Give the animals medicine"
        },
        {
         "id": "d",
         "text": "Brush the cats"
        }
       ],
       "answers": [
        "a",
        "b",
        "d"
       ],
       "correct": "Correct. Volunteers fill bowls, walk dogs, and brush cats. Only the vet gives medicine.",
       "hint": "One job is done by the vet, not the volunteers.",
       "support": "Check each choice against the text. Watch the sentence with \"do not.\"",
       "wida": [
        "Identify multiple details",
        "Match claims to text"
       ]
      },
      {
       "id": "rv5-mini-3",
       "title": "Part 3: Adoption Day",
       "skill": "Sequence events",
       "type": "order",
       "passageTitle": "The Animal Shelter (Part 3)",
       "passage": [
        "First, a family visits the shelter to meet the animals.",
        "Next, they choose a pet they would like to take home.",
        "Then a volunteer helps them fill out the adoption papers.",
        "Finally, the family takes their new pet home."
       ],
       "prompt": "Put the steps of adopting a pet in the correct order.",
       "items": [
        {
         "id": "a1",
         "text": "A family visits the shelter to meet the animals."
        },
        {
         "id": "a2",
         "text": "They choose a pet to take home."
        },
        {
         "id": "a3",
         "text": "A volunteer helps them fill out the papers."
        },
        {
         "id": "a4",
         "text": "The family takes the new pet home."
        }
       ],
       "answer": [
        "a1",
        "a2",
        "a3",
        "a4"
       ],
       "correct": "Correct. The order is visit, choose, fill out papers, then take the pet home.",
       "hint": "Use the order words: first, next, then, finally.",
       "support": "Order words signal each step in the process.",
       "wida": [
        "Sequence events",
        "Use signal words"
       ]
      },
      {
       "id": "rv5-mini-4",
       "title": "Part 4: A Word in Context",
       "skill": "Use context clues",
       "type": "multipleChoice",
       "passageTitle": "The Animal Shelter (Part 4)",
       "passage": [
        "The shelter is always grateful for donations.",
        "People bring old towels, blankets, and bags of pet food.",
        "These gifts help the shelter care for more animals each month."
       ],
       "prompt": "In this passage, what does the word \"donations\" most likely mean?",
       "options": [
        {
         "id": "a",
         "text": "gifts that people give to help",
         "visual": "🎁"
        },
        {
         "id": "b",
         "text": "bills that people must pay",
         "visual": "💸"
        },
        {
         "id": "c",
         "text": "animals that run away",
         "visual": "🐾"
        }
       ],
       "answer": "a",
       "correct": "Correct. People bring towels, blankets, and food as gifts, so donations are helpful gifts.",
       "hint": "Read the next sentence. What do people bring?",
       "support": "Context clues are the nearby words that explain a hard word.",
       "wida": [
        "Use context clues",
        "Infer word meaning"
       ]
      },
      {
       "id": "rv5-mini-5",
       "title": "Part 5: Finish the Summary",
       "skill": "Summarize a text",
       "type": "cloze",
       "passageTitle": "The Animal Shelter (Part 5)",
       "passage": [
        "The shelter opened last year and now helps many animals.",
        "Thanks to volunteers and donations, more pets find homes each month.",
        "The town is proud of its new shelter."
       ],
       "prompt": "Complete the summary of the article.",
       "segments": [
        {
         "text": "The new shelter helps animals find homes. With the help of volunteers and "
        },
        {
         "blank": {
          "id": "b1",
          "answer": "donations",
          "options": [
           "donations",
           "medicine",
           "cages"
          ]
         }
        },
        {
         "text": ", more pets are adopted each month. The town is "
        },
        {
         "blank": {
          "id": "b2",
          "answer": "proud",
          "options": [
           "proud",
           "angry",
           "afraid"
          ]
         }
        },
        {
         "text": " of the shelter."
        }
       ],
       "correct": "Correct. Volunteers and donations help, and the town is proud of the shelter.",
       "hint": "Look back at the last part to see what people bring and how the town feels.",
       "support": "Match each blank to a detail you read in the article.",
       "wida": [
        "Summarize a text",
        "Identify supporting details"
       ]
      },
      {
       "id": "rv5-mini-6",
       "title": "Part 6: The Big Idea",
       "skill": "Determine central idea",
       "type": "multipleChoice",
       "passageTitle": "The Animal Shelter (Whole Article)",
       "passage": [
        "From feeding animals to adoption day, the shelter works hard for its town.",
        "Volunteers and donations keep it going.",
        "Because of this care, many animals find a safe family."
       ],
       "prompt": "What is the central idea of the whole article?",
       "options": [
        {
         "id": "a",
         "text": "The shelter helps homeless animals find safe families.",
         "visual": "🏠"
        },
        {
         "id": "b",
         "text": "Oak Street is the busiest street in town.",
         "visual": "🚗"
        },
        {
         "id": "c",
         "text": "Cats are easier to care for than dogs.",
         "visual": "🐱"
        }
       ],
       "answer": "a",
       "correct": "Yes. The whole article is about the shelter helping homeless animals find safe families.",
       "hint": "Think about what every part of the article was mostly about.",
       "support": "The central idea covers the whole text, not just one small detail.",
       "wida": [
        "Determine central idea",
        "Synthesize across a text"
       ]
      }
     ]
    }
   ]
  },
  {
   "id": "wida-speaking-mini",
   "domain": "Speaking",
   "title": "WIDA Practice Test — Speaking: A Day at School",
   "gradeCluster": "Grades 6-8",
   "tier": "WIDA-style model practice",
   "overview": "Look at the pictures of a school day and a class garden project. For each task, plan your answer, then say it aloud in full sentences. Your teacher will listen.",
   "sections": [
    {
     "domain": "Speaking",
     "title": "A Day at School",
     "directions": "We will talk about your school day, compare two classes, explain a process, and give an opinion. Look at the pictures, plan your answer, and say it aloud. Use the word banks to help you.",
     "estMinutes": 12,
     "items": [
      {
       "id": "wsm-1",
       "title": "Speaking Task 1",
       "skill": "Describing a picture using academic language",
       "type": "constructed",
       "passageTitle": "A Day at School",
       "passage": [
        "Look at the picture of a busy school hallway. 🏫🎒🚪 A model student, Mia, said: \"I see students walking with backpacks and a row of lockers.\"",
        "Now it is your turn. What other things do you see in the picture? Say your answer aloud."
       ],
       "adminScript": "Look at the picture of the school hallway. What things do you see? Say your answer aloud in full sentences.",
       "prompt": "Look at the picture of the school hallway. What things do you see?",
       "responseLabel": "Planning notes (then say your answer aloud)",
       "responsePlaceholder": "I see ___ and ___. The ___ is next to the ___.",
       "wordBank": [
        "I see",
        "students",
        "backpacks",
        "lockers",
        "a door",
        "a clock",
        "next to",
        "in front of"
       ],
       "correct": "Strong answer (model): I see students walking to class with their backpacks. There is a long row of lockers next to the wall, and a clock is above the door.",
       "support": "Use the word bank and full sentences. Say your answer out loud, then your teacher can listen."
      },
      {
       "id": "wsm-2",
       "title": "Speaking Task 2",
       "skill": "Comparing two things using comparison words",
       "type": "constructed",
       "passageTitle": "A Day at School",
       "passage": [
        "Two classes voted for a class pet. 📊 Class A chose a hamster, and Class B chose a fish.",
        "Compare the two choices. How are they alike, and how are they different? Say your answer aloud."
       ],
       "adminScript": "Two classes chose different class pets. Tell me one way the pets are alike and one way they are different. Use comparison words.",
       "prompt": "Compare a hamster and a fish as class pets. How are they alike and different?",
       "responseLabel": "Planning notes (then say your answer aloud)",
       "responsePlaceholder": "Both a hamster and a fish are ___. A hamster is ___, but a fish is ___.",
       "wordBank": [
        "Both",
        "are pets",
        "but",
        "a hamster is",
        "a fish is",
        "furry",
        "lives in water",
        "needs a cage",
        "needs a tank"
       ],
       "correct": "Strong answer (model): Both a hamster and a fish are class pets that students take care of. A hamster is furry and needs a cage, but a fish lives in water and needs a tank.",
       "support": "Use the word bank and full sentences. Say your answer out loud, then your teacher can listen."
      },
      {
       "id": "wsm-3",
       "title": "Speaking Task 3",
       "skill": "Explaining a process in order",
       "type": "constructed",
       "passageTitle": "A Day at School",
       "passage": [
        "The science class is growing a bean plant. 🌱☀️💧 They plant a seed, water it, give it sunlight, and watch it grow.",
        "Explain how the class grows the bean plant, step by step. Say your answer aloud."
       ],
       "adminScript": "Explain how the science class grows a bean plant. Tell the steps in order. Use order words like first, then, and finally.",
       "prompt": "Explain how the class grows a bean plant, step by step.",
       "responseLabel": "Planning notes (then say your answer aloud)",
       "responsePlaceholder": "First, the class ___. Then they ___. Finally, ___.",
       "wordBank": [
        "First",
        "Then",
        "Next",
        "Finally",
        "plant a seed",
        "water it",
        "give it sunlight",
        "it grows",
        "because"
       ],
       "correct": "Strong answer (model): First, the class plants a seed in the soil. Then they water it every day and give it sunlight because plants need water and light. Finally, the seed grows into a bean plant.",
       "support": "Use the word bank and full sentences. Say your answer out loud, then your teacher can listen."
      },
      {
       "id": "wsm-4",
       "title": "Speaking Task 4",
       "skill": "Giving an opinion with a reason",
       "type": "constructed",
       "passageTitle": "A Day at School",
       "passage": [
        "Your school may add 15 more minutes of recess or 15 more minutes of lunch. 🍎🏃",
        "Which do you think is better? Give your opinion and a reason. Say your answer aloud."
       ],
       "adminScript": "Your school can add more recess or more lunch time. Which do you think is better, and why? Give your opinion and at least one reason.",
       "prompt": "Should the school add more recess or more lunch time? Give your opinion and a reason.",
       "responseLabel": "Planning notes (then say your answer aloud)",
       "responsePlaceholder": "I think the school should add ___ because ___.",
       "wordBank": [
        "I think the school should add",
        "because",
        "more recess",
        "more lunch",
        "students can play",
        "students can rest",
        "students can eat",
        "In addition"
       ],
       "correct": "Strong answer (model): I think the school should add more recess because students can play and get exercise. In addition, a short break helps us focus better in our afternoon classes.",
       "support": "Use the word bank and full sentences. Say your answer out loud, then your teacher can listen."
      }
     ]
    }
   ]
  },
  {
   "id": "wida-writing-mini",
   "domain": "Writing",
   "title": "Mini Writing Practice: Explain and Persuade",
   "gradeCluster": "Grades 6-8",
   "tier": "WIDA-style model practice",
   "overview": "This short, unofficial classroom practice gives students a test-like writing routine. Students complete one paragraph-ordering task, one sentence-completion task, and two short constructed-response writing prompts. Frames and word banks support multilingual learners while keeping the writing demand at a Grades 6-8 level.",
   "sections": [
    {
     "domain": "Writing",
     "title": "Part 1: Build and Complete",
     "directions": "Read each item carefully. For the ordering item, put the sentences in order. For the cloze item, choose the best word for each blank.",
     "estMinutes": 12,
     "items": [
      {
       "id": "wv5-mini-order-1",
       "title": "Order the Informational Paragraph",
       "skill": "Order sentences into a paragraph",
       "type": "order",
       "wida": [
        "ordering an informational paragraph",
        "using sequence words"
       ],
       "vocabulary": [
        [
         "topic sentence",
         "the sentence that names the main idea",
         "oración temática: la oración que nombra la idea principal"
        ],
        [
         "sequence",
         "the order of the steps",
         "secuencia: el orden de los pasos"
        ]
       ],
       "frames": [
        "First, ___. Next, ___. Finally, ___."
       ],
       "wordBank": [
        "First",
        "Next",
        "Finally"
       ],
       "prompt": "Put the sentences in order to build a clear paragraph about studying for a test.",
       "items": [
        {
         "id": "i1",
         "text": "Studying for a test works best with a simple plan."
        },
        {
         "id": "i2",
         "text": "First, you review your notes from class."
        },
        {
         "id": "i3",
         "text": "Next, you practice with a few sample questions."
        },
        {
         "id": "i4",
         "text": "Finally, you get a good night of sleep before the test."
        }
       ],
       "answer": [
        "i1",
        "i2",
        "i3",
        "i4"
       ],
       "correct": "Correct. The topic sentence comes first, then the steps in order, ending with the final step.",
       "hint": "Find the sentence that names the topic, then follow First, Next, and Finally.",
       "support": "A paragraph begins with a topic sentence and uses sequence words to stay in order.",
       "extension": "Add one more study step using the word then."
      },
      {
       "id": "wv5-mini-cloze-1",
       "title": "Complete the Opinion Sentence",
       "skill": "Choose the best word to complete a sentence",
       "type": "cloze",
       "wida": [
        "completing an opinion sentence",
        "choosing precise words"
       ],
       "vocabulary": [
        [
         "opinion",
         "what you think or feel",
         "opinión: lo que piensas o sientes"
        ],
        [
         "because",
         "the word that gives a reason",
         "porque: la palabra que da una razón"
        ]
       ],
       "frames": [
        "I think ___ because ___."
       ],
       "wordBank": [
        "because",
        "helpful",
        "however"
       ],
       "prompt": "Choose the best word for each blank.",
       "segments": [
        {
         "text": "I think group projects are "
        },
        {
         "blank": {
          "id": "b1",
          "answer": "helpful",
          "options": [
           "helpful",
           "loud",
           "quiet"
          ]
         }
        },
        {
         "text": " "
        },
        {
         "blank": {
          "id": "b2",
          "answer": "because",
          "options": [
           "because",
           "before",
           "between"
          ]
         }
        },
        {
         "text": " students learn from each other."
        }
       ],
       "correct": "Correct. Helpful states the opinion, and because gives the reason.",
       "hint": "Which word names a positive opinion? Which word signals a reason?",
       "support": "An opinion sentence often pairs a describing word with because and a reason.",
       "extension": "Write your own opinion sentence using because."
      }
     ]
    },
    {
     "domain": "Writing",
     "title": "Part 2: Write Your Response",
     "directions": "Read each prompt. Write a complete response. Use the frames and word bank to help you. Check your work when you finish.",
     "estMinutes": 16,
     "items": [
      {
       "id": "wv5-mini-constructed-1",
       "title": "Short Opinion Paragraph",
       "skill": "Write a short opinion paragraph with reasons",
       "type": "constructed",
       "wida": [
        "writing an opinion paragraph",
        "supporting an opinion with reasons"
       ],
       "vocabulary": [
        [
         "opinion",
         "what you think or feel",
         "opinión: lo que piensas o sientes"
        ],
        [
         "reason",
         "why you think something",
         "razón: por qué piensas algo"
        ]
       ],
       "frames": [
        "In my opinion, ___.",
        "One reason is ___. Another reason is ___."
       ],
       "wordBank": [
        "In my opinion",
        "One reason",
        "Another reason",
        "because"
       ],
       "prompt": "Prompt: Should students choose their own seats in class? Write your opinion and give two reasons. Try to write at least 40 words.",
       "responseLabel": "Your opinion paragraph",
       "responsePlaceholder": "In my opinion, ___ . One reason is ___ . Another reason is ___ .",
       "correct": "Strong response: In my opinion, students should choose their own seats. One reason is that students focus better next to people who help them work. Another reason is that choosing a seat teaches responsibility because students must make a good choice.",
       "hint": "State your opinion first, then give two reasons using because.",
       "support": "Model: In my opinion, recess should be longer. One reason is that exercise helps us learn. Another reason is that fresh air relaxes us.",
       "extension": "Add a closing sentence that restates your opinion."
      },
      {
       "id": "wv5-mini-constructed-2",
       "title": "Persuasive Note to a Teacher",
       "skill": "Write a short persuasive note with a polite request",
       "type": "constructed",
       "wida": [
        "writing a persuasive note",
        "using polite request language"
       ],
       "vocabulary": [
        [
         "persuade",
         "to make someone agree with you",
         "persuadir: hacer que alguien esté de acuerdo"
        ],
        [
         "request",
         "asking for something politely",
         "petición: pedir algo con cortesía"
        ]
       ],
       "frames": [
        "Dear ___,",
        "I would like to request ___ because ___.",
        "Thank you for considering this. Sincerely, ___"
       ],
       "wordBank": [
        "Dear",
        "request",
        "because",
        "Sincerely",
        "considering"
       ],
       "prompt": "Prompt: Write a short note asking your teacher for extra time on an assignment. Give one clear reason. Try to write at least 30 words.",
       "responseLabel": "Your persuasive note",
       "responsePlaceholder": "Dear ___, I would like to request ___ because ___. Thank you for considering this. Sincerely, ___",
       "correct": "Strong response: Dear Ms. Patel, I would like to request two more days on the essay because I was sick this week and missed class. Thank you for considering this. Sincerely, Leo.",
       "hint": "Start with Dear, make a polite request with because, and end with Sincerely.",
       "support": "Model: Dear Mr. Kim, I would like to request extra time because my computer broke. Thank you for considering this. Sincerely, Ava.",
       "extension": "Add one sentence offering a plan to finish the work."
      }
     ]
    }
   ]
  }
 ],
 "appendActivities": {
  "Listening": {
   "A": [
    {
     "id": "lv5-class-supplies-mc",
     "title": "Get the Right Supplies",
     "skill": "Follow simple oral directions",
     "time": "5 min",
     "wida": [
      "following classroom directions",
      "matching language to visuals"
     ],
     "directions": "Listen to the teacher. Choose the supply the teacher asks you to take out.",
     "listenFor": [
      "the name of a school supply",
      "the action take out",
      "where to put it"
     ],
     "vocabulary": [
      [
       "supply",
       "a thing you use in school",
       "material: una cosa que usas en la escuela"
      ],
      [
       "take out",
       "get something and put it on your desk",
       "sacar: tomar algo y ponerlo en el escritorio"
      ],
      [
       "folder",
       "a holder for papers",
       "carpeta: un porta papeles"
      ]
     ],
     "frames": [
      "The teacher wants the ___.",
      "I heard the word ___."
     ],
     "type": "multipleChoice",
     "prompt": "What does the teacher ask students to take out?",
     "options": [
      {
       "id": "a",
       "text": "A glue stick",
       "visual": "🖊️"
      },
      {
       "id": "b",
       "text": "A folder",
       "visual": "📁"
      },
      {
       "id": "c",
       "text": "A calculator",
       "visual": "🧮"
      }
     ],
     "answer": "b",
     "correct": "Yes. The teacher asks for a folder to hold today's papers.",
     "hint": "Listen for the word that names a holder for papers.",
     "support": "Model: A folder holds papers. That matches what the teacher said.",
     "extension": "Say it in one sentence: The teacher wants the ___.",
     "adminScript": "Good morning, class. Before we start, please take out your folder so you have a place to keep today's papers. Now answer: What does the teacher ask students to take out?",
     "teacher": {
      "use": "Warm-up before independent ACCESS practice.",
      "function": "Interpret an imperative classroom direction.",
      "lower": "Read each option aloud and let students point first.",
      "onLevel": "Students repeat the supply word before answering.",
      "challenge": "Students write a new direction using take out.",
      "noTech": "Read aloud; students point to the supply.",
      "prompt": "Which word told you the answer?"
     }
    },
    {
     "id": "lv5-lunch-line-mc",
     "title": "In the Lunch Line",
     "skill": "Understand everyday school language",
     "time": "5 min",
     "wida": [
      "matching language to visuals",
      "following classroom directions"
     ],
     "directions": "Listen to the lunch helper. Choose what students should do.",
     "listenFor": [
      "a polite request",
      "an action word",
      "a place in school"
     ],
     "vocabulary": [
      [
       "tray",
       "a flat plate to carry food",
       "bandeja: un plato plano para llevar comida"
      ],
      [
       "line",
       "people waiting one behind another",
       "fila: personas que esperan una detrás de otra"
      ],
      [
       "return",
       "give back",
       "devolver: regresar algo"
      ]
     ],
     "frames": [
      "Students should ___.",
      "The helper said to ___."
     ],
     "type": "multipleChoice",
     "prompt": "What does the lunch helper ask students to do?",
     "options": [
      {
       "id": "a",
       "text": "Take a tray and join the line",
       "visual": "🍽️"
      },
      {
       "id": "b",
       "text": "Run to a seat",
       "visual": "🏃"
      },
      {
       "id": "c",
       "text": "Leave the cafeteria",
       "visual": "🚪"
      }
     ],
     "answer": "a",
     "correct": "Yes. The helper asks students to take a tray and get in line.",
     "hint": "Listen for the two actions: take and join.",
     "support": "Model: A tray carries food, and a line is for waiting.",
     "extension": "Say it in one sentence: Students should ___.",
     "adminScript": "Welcome to lunch, everyone. Please take a clean tray from the stack and join the line quietly. Now answer: What does the lunch helper ask students to do?",
     "teacher": {
      "use": "Everyday language warm-up.",
      "function": "Interpret a polite request.",
      "lower": "Pause after each action word.",
      "onLevel": "Read once.",
      "challenge": "Students list both actions in order.",
      "noTech": "Read aloud; students act it out.",
      "prompt": "How many things did the helper ask for?"
     }
    },
    {
     "id": "lv5-weather-detail-mc",
     "title": "Today's Weather",
     "skill": "Identify a key detail",
     "time": "5 min",
     "wida": [
      "identify key details",
      "match language to visuals"
     ],
     "directions": "Listen to the weather announcement. Choose the correct detail.",
     "listenFor": [
      "a weather word",
      "a number",
      "advice about clothes"
     ],
     "vocabulary": [
      [
       "forecast",
       "what weather is expected",
       "pronóstico: el clima que se espera"
      ],
      [
       "umbrella",
       "a cover you hold in the rain",
       "paraguas: una cubierta para la lluvia"
      ],
      [
       "temperature",
       "how hot or cold it is",
       "temperatura: qué tan caliente o frío está"
      ]
     ],
     "frames": [
      "The weather will be ___.",
      "Students should bring a ___."
     ],
     "type": "multipleChoice",
     "prompt": "What does the announcer say students should bring?",
     "options": [
      {
       "id": "a",
       "text": "An umbrella",
       "visual": "☂️"
      },
      {
       "id": "b",
       "text": "Sunglasses",
       "visual": "🕶️"
      },
      {
       "id": "c",
       "text": "A snow hat",
       "visual": "🧢"
      }
     ],
     "answer": "a",
     "correct": "Yes. Because rain is coming, students should bring an umbrella.",
     "hint": "Listen for the weather word that means water from the sky.",
     "support": "Model: Rain means water from the sky, so an umbrella helps.",
     "extension": "Say it in one sentence: Students should bring a ___ because ___.",
     "adminScript": "Here is today's weather forecast. It will be cloudy this morning with rain in the afternoon. The temperature will be cool. Remember to bring an umbrella so you stay dry. Now answer: What does the announcer say students should bring?",
     "teacher": {
      "use": "Morning routine listening.",
      "function": "Identify a stated key detail.",
      "lower": "Show a picture of rain first.",
      "onLevel": "Read once.",
      "challenge": "Students name two weather details they heard.",
      "noTech": "Read aloud; students draw the weather.",
      "prompt": "What word told you it would rain?"
     }
    },
    {
     "id": "lv5-fire-drill-order",
     "title": "Fire Drill Steps",
     "skill": "Sequence oral steps",
     "time": "6 min",
     "wida": [
      "sequence steps",
      "follow signal words"
     ],
     "directions": "Listen to the safety steps. Put them in the order the teacher says.",
     "listenFor": [
      "order words",
      "what to do first",
      "the last step"
     ],
     "vocabulary": [
      [
       "line up",
       "stand one behind another",
       "formar fila: pararse uno detrás de otro"
      ],
      [
       "exit",
       "the way out",
       "salida: la manera de salir"
      ],
      [
       "calm",
       "quiet and slow",
       "calmado: tranquilo y despacio"
      ]
     ],
     "frames": [
      "First students ___.",
      "The last step is ___."
     ],
     "type": "order",
     "prompt": "Put the fire drill steps in the order the teacher explains.",
     "items": [
      {
       "id": "i1",
       "text": "Stop your work and stand up."
      },
      {
       "id": "i2",
       "text": "Line up quietly at the door."
      },
      {
       "id": "i3",
       "text": "Walk calmly to the exit."
      },
      {
       "id": "i4",
       "text": "Wait outside with your class."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Correct. You followed the order: stop, line up, walk, wait.",
     "hint": "Listen for order words: first, next, then, finally.",
     "support": "Order words signal each step of the drill.",
     "extension": "Why is waiting with your class the last step?",
     "adminScript": "Listen carefully to our fire drill steps. First, stop your work and stand up. Next, line up quietly at the door. Then walk calmly to the exit. Finally, wait outside with your class until I count everyone. Now put the steps in order.",
     "teacher": {
      "use": "Safety routine sequencing.",
      "function": "Order an oral process.",
      "lower": "Use movable step strips.",
      "onLevel": "Read once.",
      "challenge": "Remove the signal words and read again.",
      "noTech": "Read aloud; students number steps.",
      "prompt": "Which signal word helped you most?"
     }
    },
    {
     "id": "lv5-school-places-sort",
     "title": "Where in School?",
     "skill": "Connect language to school places",
     "time": "6 min",
     "wida": [
      "sorting information",
      "matching language to visuals"
     ],
     "directions": "Choose the best school place for each thing you hear. Use the buttons; no dragging needed.",
     "listenFor": [
      "place words",
      "who is speaking",
      "what people do there"
     ],
     "vocabulary": [
      [
       "library",
       "where books are kept",
       "biblioteca: donde se guardan los libros"
      ],
      [
       "gym",
       "a room for sports",
       "gimnasio: una sala para deportes"
      ],
      [
       "office",
       "where the principal works",
       "oficina: donde trabaja el director"
      ]
     ],
     "frames": [
      "This belongs in the ___.",
      "I heard the word ___, so I chose ___."
     ],
     "type": "sort",
     "categories": [
      "Library",
      "Gym",
      "Cafeteria",
      "Office"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Please check out two books today.",
       "answer": "Library"
      },
      {
       "id": "s2",
       "text": "Put on your sneakers for the game.",
       "answer": "Gym"
      },
      {
       "id": "s3",
       "text": "Pick a hot lunch or a cold lunch.",
       "answer": "Cafeteria"
      },
      {
       "id": "s4",
       "text": "Sign in here if you arrive late.",
       "answer": "Office"
      }
     ],
     "correct": "Strong sorting. You matched each phrase to the place where a student would hear it.",
     "hint": "Listen for clue words: books, sneakers, lunch, sign in.",
     "support": "Model: Books belong with the library. Sneakers belong with the gym.",
     "extension": "Choose one phrase and say: This belongs in the ___ because ___.",
     "adminScript": "Listen and decide where you would hear each sentence. Please check out two books today. Put on your sneakers for the game. Pick a hot lunch or a cold lunch. Sign in here if you arrive late. Now sort each sentence into the right place.",
     "teacher": {
      "use": "Partner station: one reads, one sorts.",
      "function": "Classify oral language by school place.",
      "lower": "Sort only two phrases first.",
      "onLevel": "Students explain one choice.",
      "challenge": "Students add a phrase for each place.",
      "noTech": "Cut phrases into strips and sort on desks.",
      "prompt": "What clue word was strongest?"
     }
    },
    {
     "id": "lv5-bring-tomorrow-ms",
     "title": "Bring These Tomorrow",
     "skill": "Identify multiple details",
     "time": "6 min",
     "wida": [
      "identify multiple details",
      "track a spoken list"
     ],
     "directions": "Listen to the teacher's list. Choose every item students must bring.",
     "listenFor": [
      "a list of items",
      "the word and",
      "an item not mentioned"
     ],
     "vocabulary": [
      [
       "permission slip",
       "a paper a parent signs",
       "permiso: un papel que firma un padre"
      ],
      [
       "jacket",
       "a light coat",
       "chaqueta: un abrigo ligero"
      ],
      [
       "snack",
       "a small bit of food",
       "merienda: un poco de comida"
      ]
     ],
     "frames": [
      "Students must bring a ___.",
      "I heard ___ and ___."
     ],
     "type": "multiSelect",
     "prompt": "Which items does the teacher tell students to bring tomorrow?",
     "options": [
      {
       "id": "a",
       "text": "A signed permission slip"
      },
      {
       "id": "b",
       "text": "A jacket"
      },
      {
       "id": "c",
       "text": "A laptop"
      },
      {
       "id": "d",
       "text": "A snack"
      }
     ],
     "answers": [
      "a",
      "b",
      "d"
     ],
     "correct": "Correct. The teacher lists a permission slip, a jacket, and a snack.",
     "hint": "Listen for the list joined with and. A laptop was not mentioned.",
     "support": "When a speaker lists items, track each one and listen for and.",
     "extension": "Why do students need a jacket for the trip?",
     "adminScript": "Tomorrow is our field trip to the park. Please bring a signed permission slip, a jacket because it may be cool, and a small snack for the bus. You do not need a laptop. Now answer: Which items does the teacher tell students to bring tomorrow?",
     "teacher": {
      "use": "List-tracking practice.",
      "function": "Listen for multiple key details.",
      "lower": "Pause after each item.",
      "onLevel": "Read once.",
      "challenge": "Ask why the laptop does not belong.",
      "noTech": "Read aloud; students check boxes.",
      "prompt": "Which word joined the list?"
     }
    },
    {
     "id": "lv5-morning-routine-cloze",
     "title": "The Morning Announcement",
     "skill": "Complete a spoken summary",
     "time": "6 min",
     "wida": [
      "complete a summary",
      "process academic school language"
     ],
     "directions": "Listen to the morning announcement. Then complete the summary.",
     "listenFor": [
      "a day or time",
      "a school event",
      "where to go"
     ],
     "vocabulary": [
      [
       "assembly",
       "a meeting of many students",
       "asamblea: una reunión de muchos estudiantes"
      ],
      [
       "auditorium",
       "a big room with a stage",
       "auditorio: una sala grande con escenario"
      ],
      [
       "schedule",
       "a plan of times",
       "horario: un plan de horas"
      ]
     ],
     "frames": [
      "The assembly is in the ___.",
      "It starts at ___."
     ],
     "type": "cloze",
     "prompt": "Complete the summary of the morning announcement.",
     "segments": [
      {
       "text": "Today there is an assembly in the "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "auditorium",
        "options": [
         "auditorium",
         "gym",
         "library"
        ]
       }
      },
      {
       "text": " that starts at "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "nine o'clock",
        "options": [
         "nine o'clock",
         "noon",
         "three o'clock"
        ]
       }
      },
      {
       "text": "."
      }
     ],
     "correct": "Correct. The assembly is in the auditorium at nine o'clock.",
     "hint": "Listen for the place word and the time.",
     "support": "Match the place and the time you heard to the blanks.",
     "extension": "What should students do before the assembly?",
     "adminScript": "Good morning, students. We have a special schedule today. There will be an assembly in the auditorium that starts at nine o'clock. Please walk quietly with your class. Now complete the summary.",
     "teacher": {
      "use": "Daily announcement listening.",
      "function": "Listen for place and time details.",
      "lower": "Write the place and time on the board first.",
      "onLevel": "Read once.",
      "challenge": "Add a second event and time.",
      "noTech": "Read aloud; students fill a printed summary.",
      "prompt": "Where is the assembly?"
     }
    },
    {
     "id": "lv5-pe-coach-mc",
     "title": "Coach's Direction",
     "skill": "Follow oral directions in sports",
     "time": "5 min",
     "wida": [
      "following directions",
      "matching language to visuals"
     ],
     "directions": "Listen to the coach. Choose what students should do.",
     "listenFor": [
      "an action word",
      "a sports word",
      "a number"
     ],
     "vocabulary": [
      [
       "coach",
       "a person who teaches a sport",
       "entrenador: una persona que enseña un deporte"
      ],
      [
       "stretch",
       "make your body long before exercise",
       "estirar: alargar el cuerpo antes de hacer ejercicio"
      ],
      [
       "lap",
       "one trip around",
       "vuelta: un viaje alrededor"
      ]
     ],
     "frames": [
      "The coach says to ___.",
      "We will ___ first."
     ],
     "type": "multipleChoice",
     "prompt": "What does the coach tell students to do first?",
     "options": [
      {
       "id": "a",
       "text": "Stretch their arms and legs",
       "visual": "🤸"
      },
      {
       "id": "b",
       "text": "Eat a snack",
       "visual": "🍎"
      },
      {
       "id": "c",
       "text": "Sit on the bench",
       "visual": "🪑"
      }
     ],
     "answer": "a",
     "correct": "Yes. The coach says to stretch first to warm up.",
     "hint": "Listen for the word that means make your body long.",
     "support": "Model: Stretch means to warm up before exercise.",
     "extension": "Why do we stretch before running?",
     "adminScript": "Alright, team, before we run our laps, everyone needs to stretch their arms and legs so we do not get hurt. Then we will run two laps. Now answer: What does the coach tell students to do first?",
     "teacher": {
      "use": "PE class listening.",
      "function": "Follow a sequenced oral direction.",
      "lower": "Demonstrate the stretch.",
      "onLevel": "Read once.",
      "challenge": "Students name the second action too.",
      "noTech": "Read aloud; students show the action.",
      "prompt": "What comes after stretching?"
     }
    },
    {
     "id": "lv5-ws-listening-clues",
     "title": "Listening for Clue Words",
     "type": "worksheet",
     "skill": "Use listening strategies",
     "time": "10 min",
     "directions": "Use this page after the listening activities. Talk and write about the clue words that help you understand what you hear.",
     "wida": [
      "use listening strategies",
      "self-monitor comprehension"
     ],
     "sheet": [
      {
       "heading": "Words That Signal Order",
       "items": [
        "Write three order words you can listen for: first, ___, ___.",
        "Why do order words help you put steps in the right order?",
        "Draw arrows to show four steps of a routine you do at school."
       ]
      },
      {
       "heading": "Words That Signal a List",
       "items": [
        "What small word often joins the last two items in a list?",
        "Listen to a partner name three school supplies. Write them down.",
        "How do you know when a speaker is finished with a list?"
       ]
      },
      {
       "heading": "Check Yourself",
       "items": [
        "When you miss a word, what can you do? Write one strategy.",
        "Finish the frame: A clue word that helped me today was ___."
       ]
      }
     ]
    },
    {
     "id": "lv5-ws-science-listening",
     "title": "Listening in Science Class",
     "type": "worksheet",
     "skill": "Listen for academic science details",
     "time": "12 min",
     "directions": "Use this page with the science listening activities. Write what you hear and explain the key ideas.",
     "wida": [
      "process academic science language",
      "identify key details"
     ],
     "sheet": [
      {
       "heading": "Lab Words I Heard",
       "items": [
        "Write the meaning of hypothesis in your own words.",
        "List the four steps of an experiment in order.",
        "Which step tells you to watch carefully?"
       ]
      },
      {
       "heading": "Cause and Effect",
       "items": [
        "Finish the frame: Water evaporates because ___.",
        "What happens to vapor when it cools high in the air?",
        "Draw and label the water cycle with arrows."
       ]
      },
      {
       "heading": "My Question",
       "items": [
        "Write one question you still have about the science talk.",
        "Finish the frame: I learned that ___."
       ]
      }
     ]
    },
    {
     "id": "lv5-ws-school-announcements",
     "title": "Understanding Announcements",
     "type": "worksheet",
     "skill": "Listen for who, what, where, when",
     "time": "10 min",
     "directions": "Use this page after the announcement activities. Write the key facts you hear in each announcement.",
     "wida": [
      "identify key details",
      "answer who what where when"
     ],
     "sheet": [
      {
       "heading": "Who and What",
       "items": [
        "Who is speaking in a morning announcement?",
        "What event was announced? Write one sentence.",
        "Finish the frame: The announcement was about ___."
       ]
      },
      {
       "heading": "Where and When",
       "items": [
        "Where will the event take place?",
        "When does the event start? Write the time.",
        "Why is it important to listen for the place and the time?"
       ]
      },
      {
       "heading": "Plan Your Day",
       "items": [
        "Write what you must bring based on an announcement you heard.",
        "Finish the frame: Before the event, I should ___."
       ]
      }
     ]
    }
   ],
   "B": [
    {
     "id": "lv5-water-cycle-mc",
     "title": "The Water Cycle",
     "skill": "Identify a key science detail",
     "time": "6 min",
     "wida": [
      "identify key details",
      "process academic science language"
     ],
     "directions": "Listen to the science explanation. Choose the correct detail.",
     "listenFor": [
      "a science process word",
      "cause and effect",
      "the result"
     ],
     "vocabulary": [
      [
       "evaporate",
       "turn from water into vapor",
       "evaporar: cambiar de agua a vapor"
      ],
      [
       "condense",
       "turn from vapor into water drops",
       "condensar: cambiar de vapor a gotas de agua"
      ],
      [
       "cycle",
       "a process that repeats",
       "ciclo: un proceso que se repite"
      ]
     ],
     "frames": [
      "Water ___ when it gets warm.",
      "This happens because ___."
     ],
     "type": "multipleChoice",
     "prompt": "According to the teacher, what makes water evaporate?",
     "options": [
      {
       "id": "a",
       "text": "Heat from the sun",
       "visual": "☀️"
      },
      {
       "id": "b",
       "text": "Cold air at night",
       "visual": "❄️"
      },
      {
       "id": "c",
       "text": "Strong wind",
       "visual": "💨"
      }
     ],
     "answer": "a",
     "correct": "Correct. Heat from the sun makes water evaporate into vapor.",
     "hint": "Listen for the cause: what gives the energy to evaporate?",
     "support": "Cause and effect: the sun's heat causes evaporation.",
     "extension": "What happens to the vapor when it cools?",
     "adminScript": "Let's review the water cycle. First, heat from the sun makes water in lakes and oceans evaporate, turning it into vapor that rises into the air. When the vapor cools high up, it condenses into clouds. This cycle repeats again and again. Now answer: what makes water evaporate?",
     "teacher": {
      "use": "Science content listening.",
      "function": "Identify a cause in a process.",
      "lower": "Show a water cycle diagram.",
      "onLevel": "Read once.",
      "challenge": "Students explain condensation too.",
      "noTech": "Read aloud; students label a diagram.",
      "prompt": "What is the cause and what is the effect?"
     }
    },
    {
     "id": "lv5-recycling-ms",
     "title": "The Recycling Project",
     "skill": "Identify multiple details in an explanation",
     "time": "7 min",
     "wida": [
      "identify multiple details",
      "track reasons in speech"
     ],
     "directions": "Listen to the announcement. Choose every material the school will recycle.",
     "listenFor": [
      "a list of materials",
      "the word and",
      "a material not included"
     ],
     "vocabulary": [
      [
       "recycle",
       "use a material again",
       "reciclar: usar un material de nuevo"
      ],
      [
       "material",
       "what something is made of",
       "material: de qué está hecho algo"
      ],
      [
       "bin",
       "a container for trash or recycling",
       "contenedor: un recipiente para basura o reciclaje"
      ]
     ],
     "frames": [
      "The school will recycle ___ and ___.",
      "We will not recycle ___."
     ],
     "type": "multiSelect",
     "prompt": "Which materials does the announcement say the school will recycle?",
     "options": [
      {
       "id": "a",
       "text": "Paper"
      },
      {
       "id": "b",
       "text": "Plastic bottles"
      },
      {
       "id": "c",
       "text": "Glass"
      },
      {
       "id": "d",
       "text": "Aluminum cans"
      }
     ],
     "answers": [
      "a",
      "b",
      "d"
     ],
     "correct": "Correct. The school will recycle paper, plastic bottles, and aluminum cans.",
     "hint": "Listen for the list joined with and. Glass was left out this year.",
     "support": "Track each material as the speaker lists it, and note the one that is excluded.",
     "extension": "Why might glass not be on the list yet?",
     "adminScript": "Attention, students. Our new recycling project starts Monday. We will place blue bins in every classroom for paper, plastic bottles, and aluminum cans. We are not able to recycle glass this year, so please keep glass out of the bins. Now answer: which materials will the school recycle?",
     "teacher": {
      "use": "Community theme list-tracking.",
      "function": "Listen for multiple details and an exclusion.",
      "lower": "Pause after each material.",
      "onLevel": "Read once.",
      "challenge": "Ask why glass is excluded.",
      "noTech": "Read aloud; students check boxes.",
      "prompt": "Which material is not recycled?"
     }
    },
    {
     "id": "lv5-experiment-order",
     "title": "Steps of the Experiment",
     "skill": "Sequence oral lab steps",
     "time": "7 min",
     "wida": [
      "sequence steps",
      "follow signal words"
     ],
     "directions": "Listen to the lab instructions. Put the steps in the order the teacher gives them.",
     "listenFor": [
      "order words",
      "the first step",
      "the last step"
     ],
     "vocabulary": [
      [
       "hypothesis",
       "a guess you can test",
       "hipótesis: una idea que puedes probar"
      ],
      [
       "observe",
       "watch carefully",
       "observar: mirar con cuidado"
      ],
      [
       "record",
       "write down",
       "registrar: anotar"
      ]
     ],
     "frames": [
      "First we ___.",
      "After that we ___."
     ],
     "type": "order",
     "prompt": "Put the experiment steps in the order the teacher explains.",
     "items": [
      {
       "id": "i1",
       "text": "Write your hypothesis."
      },
      {
       "id": "i2",
       "text": "Pour the liquid into the cup."
      },
      {
       "id": "i3",
       "text": "Observe what happens."
      },
      {
       "id": "i4",
       "text": "Record your results in the chart."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Correct. The order is: hypothesis, pour, observe, record.",
     "hint": "Listen for order words: first, next, then, finally.",
     "support": "Each signal word marks a new step in the experiment.",
     "extension": "Why do you write the hypothesis before you start?",
     "adminScript": "Here are the steps for today's experiment. First, write your hypothesis about what will happen. Next, carefully pour the liquid into the cup. Then observe what happens for two minutes. Finally, record your results in the chart. Now put the steps in order.",
     "teacher": {
      "use": "Science lab sequencing.",
      "function": "Order an oral scientific process.",
      "lower": "Use movable step strips.",
      "onLevel": "Read once.",
      "challenge": "Remove signal words and reread.",
      "noTech": "Read aloud; students number steps.",
      "prompt": "Which step do students often skip?"
     }
    },
    {
     "id": "lv5-careers-sort",
     "title": "Who Said It?",
     "skill": "Connect language to careers",
     "time": "7 min",
     "wida": [
      "sorting information",
      "infer the speaker"
     ],
     "directions": "Listen to each sentence. Choose the worker who would most likely say it. Use the buttons; no dragging needed.",
     "listenFor": [
      "job-related words",
      "tools or places",
      "what the person does"
     ],
     "vocabulary": [
      [
       "career",
       "a job a person trains for",
       "carrera: un trabajo para el que una persona se prepara"
      ],
      [
       "patient",
       "a person a doctor helps",
       "paciente: una persona a la que ayuda un médico"
      ],
      [
       "blueprint",
       "a plan drawing for a building",
       "plano: un dibujo del plan de un edificio"
      ]
     ],
     "frames": [
      "A ___ would say this.",
      "I chose ___ because of the word ___."
     ],
     "type": "sort",
     "categories": [
      "Nurse",
      "Engineer",
      "Chef",
      "Teacher"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Let me check your temperature and blood pressure.",
       "answer": "Nurse"
      },
      {
       "id": "s2",
       "text": "I will draw the blueprint for the new bridge.",
       "answer": "Engineer"
      },
      {
       "id": "s3",
       "text": "Taste this soup and tell me if it needs more salt.",
       "answer": "Chef"
      },
      {
       "id": "s4",
       "text": "Open your books and copy the homework.",
       "answer": "Teacher"
      }
     ],
     "correct": "Strong work. You matched each sentence to the career most likely to say it.",
     "hint": "Listen for the tool, place, or task in each sentence.",
     "support": "Model: Blood pressure belongs with a nurse. A blueprint belongs with an engineer.",
     "extension": "Choose one and say: A ___ would say this because ___.",
     "adminScript": "Listen and decide which worker would most likely say each sentence. Let me check your temperature and blood pressure. I will draw the blueprint for the new bridge. Taste this soup and tell me if it needs more salt. Open your books and copy the homework. Now sort each sentence by career.",
     "teacher": {
      "use": "Career exploration listening.",
      "function": "Infer a speaker from oral clues.",
      "lower": "Sort only two sentences first.",
      "onLevel": "Students explain one choice.",
      "challenge": "Students add a sentence for each career.",
      "noTech": "Cut sentences into strips and sort.",
      "prompt": "Which clue word named the job?"
     }
    },
    {
     "id": "lv5-tech-tutorial-cloze",
     "title": "Saving Your Project",
     "skill": "Complete a spoken procedure",
     "time": "7 min",
     "wida": [
      "complete a summary",
      "process technology language"
     ],
     "directions": "Listen to the technology tutorial. Then complete the summary of the steps.",
     "listenFor": [
      "technology words",
      "an action word",
      "the result"
     ],
     "vocabulary": [
      [
       "file",
       "saved work on a computer",
       "archivo: trabajo guardado en una computadora"
      ],
      [
       "folder",
       "a place that holds files",
       "carpeta: un lugar que guarda archivos"
      ],
      [
       "save",
       "keep your work so it is not lost",
       "guardar: conservar tu trabajo para que no se pierda"
      ]
     ],
     "frames": [
      "First you click ___.",
      "Then your file is ___."
     ],
     "type": "cloze",
     "prompt": "Complete the summary of how to save the project.",
     "segments": [
      {
       "text": "First, click the "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "save button",
        "options": [
         "save button",
         "delete button",
         "print button"
        ]
       }
      },
      {
       "text": " in the corner. Then choose the right "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "folder",
        "options": [
         "folder",
         "printer",
         "speaker"
        ]
       }
      },
      {
       "text": " so you can find your file later."
      }
     ],
     "correct": "Correct. Click the save button, then choose the right folder.",
     "hint": "Listen for the action that keeps your work and the place that holds files.",
     "support": "Match each step you heard to the blanks in order.",
     "extension": "Why is choosing the right folder helpful?",
     "adminScript": "Here is how to save your project. First, click the save button in the top corner of the screen. Then choose the right folder so you can find your file later. A good name helps you, too. Now complete the summary.",
     "teacher": {
      "use": "Technology procedure listening.",
      "function": "Listen for ordered procedural details.",
      "lower": "Show the buttons on a screen.",
      "onLevel": "Read once.",
      "challenge": "Add a third step about naming the file.",
      "noTech": "Read aloud; students fill a printed summary.",
      "prompt": "What does the save button do?"
     }
    },
    {
     "id": "lv5-class-debate-mc",
     "title": "A Class Debate",
     "skill": "Identify a speaker's opinion",
     "time": "6 min",
     "wida": [
      "identify opinion",
      "distinguish opinion from reason"
     ],
     "directions": "Listen to the student's argument. Choose the opinion the speaker shares.",
     "listenFor": [
      "an opinion word",
      "a reason",
      "the topic"
     ],
     "vocabulary": [
      [
       "opinion",
       "what someone thinks or feels",
       "opinión: lo que alguien piensa o siente"
      ],
      [
       "reason",
       "why someone thinks it",
       "razón: por qué alguien lo piensa"
      ],
      [
       "agree",
       "think the same",
       "estar de acuerdo: pensar lo mismo"
      ]
     ],
     "frames": [
      "The speaker thinks ___.",
      "The reason is ___."
     ],
     "type": "multipleChoice",
     "prompt": "What is the speaker's main opinion?",
     "options": [
      {
       "id": "a",
       "text": "Schools should have longer recess.",
       "visual": "🏃"
      },
      {
       "id": "b",
       "text": "Recess should be shorter.",
       "visual": "⏱️"
      },
      {
       "id": "c",
       "text": "Recess should be removed.",
       "visual": "🚫"
      }
     ],
     "answer": "a",
     "correct": "Correct. The speaker believes recess should be longer, and gives a reason.",
     "hint": "Listen for the opinion phrase I believe and what the speaker wants more of.",
     "support": "An opinion tells what someone thinks; a reason tells why.",
     "extension": "What reason did the speaker give for the opinion?",
     "adminScript": "Here is one student's argument in our class debate. I believe schools should have longer recess. When students move and play, they come back to class with more focus and energy. A longer break would help everyone learn better. Now answer: what is the speaker's main opinion?",
     "teacher": {
      "use": "Opinion and reason listening.",
      "function": "Distinguish an opinion from its reason.",
      "lower": "Define opinion versus reason first.",
      "onLevel": "Read once.",
      "challenge": "Students restate the reason in their own words.",
      "noTech": "Read aloud; students raise a card for agree or disagree.",
      "prompt": "Where is the reason in the speech?"
     }
    },
    {
     "id": "lv5-food-program-ms",
     "title": "The Community Garden",
     "skill": "Identify multiple supporting details",
     "time": "7 min",
     "wida": [
      "identify multiple details",
      "connect details to a main idea"
     ],
     "directions": "Listen to the announcement about the garden. Choose every job that volunteers can do.",
     "listenFor": [
      "a list of tasks",
      "volunteer words",
      "a task not offered"
     ],
     "vocabulary": [
      [
       "volunteer",
       "someone who helps for free",
       "voluntario: alguien que ayuda gratis"
      ],
      [
       "harvest",
       "pick the food that is ready",
       "cosechar: recoger la comida lista"
      ],
      [
       "donate",
       "give to help others",
       "donar: dar para ayudar a otros"
      ]
     ],
     "frames": [
      "Volunteers can ___.",
      "One job is to ___."
     ],
     "type": "multiSelect",
     "prompt": "Which jobs does the announcement say volunteers can do?",
     "options": [
      {
       "id": "a",
       "text": "Plant seeds"
      },
      {
       "id": "b",
       "text": "Water the plants"
      },
      {
       "id": "c",
       "text": "Drive the delivery truck"
      },
      {
       "id": "d",
       "text": "Harvest the vegetables"
      }
     ],
     "answers": [
      "a",
      "b",
      "d"
     ],
     "correct": "Correct. Volunteers can plant seeds, water plants, and harvest vegetables.",
     "hint": "Listen for the list of tasks. Driving the truck is for adults only.",
     "support": "Track each task and notice the one that students cannot do.",
     "extension": "How does the garden help the community?",
     "adminScript": "Our community garden needs student volunteers this spring. You can help plant seeds, water the plants after school, and harvest the vegetables when they are ready. We then donate the food to families nearby. Only adults may drive the delivery truck. Now answer: which jobs can volunteers do?",
     "teacher": {
      "use": "Community theme detail tracking.",
      "function": "Identify multiple supporting details.",
      "lower": "Pause after each task.",
      "onLevel": "Read once.",
      "challenge": "Connect the tasks to the garden's purpose.",
      "noTech": "Read aloud; students check boxes.",
      "prompt": "Which job is only for adults?"
     }
    },
    {
     "id": "lv5-history-talk-cloze",
     "title": "A Talk About Bridges",
     "skill": "Complete an academic summary",
     "time": "7 min",
     "wida": [
      "complete a summary",
      "process academic content language"
     ],
     "directions": "Listen to the short talk. Then complete the summary with the correct words.",
     "listenFor": [
      "a cause",
      "an effect",
      "a key fact"
     ],
     "vocabulary": [
      [
       "engineer",
       "a person who designs structures",
       "ingeniero: una persona que diseña estructuras"
      ],
      [
       "support",
       "hold up a weight",
       "sostener: aguantar un peso"
      ],
      [
       "arch",
       "a curved shape that is strong",
       "arco: una forma curva que es fuerte"
      ]
     ],
     "frames": [
      "Engineers use ___ to ___.",
      "An arch is strong because ___."
     ],
     "type": "cloze",
     "prompt": "Complete the summary of the talk about bridges.",
     "segments": [
      {
       "text": "Engineers use an "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "arch",
        "options": [
         "arch",
         "wire",
         "wheel"
        ]
       }
      },
      {
       "text": " because its curved shape can "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "support",
        "options": [
         "support",
         "break",
         "melt"
        ]
       }
      },
      {
       "text": " heavy weight without falling."
      }
     ],
     "correct": "Correct. Engineers use an arch because its shape can support heavy weight.",
     "hint": "Listen for the shape that is strong and the word that means hold up weight.",
     "support": "Match the cause, the shape, and its effect to the blanks.",
     "extension": "Name one place you have seen an arch.",
     "adminScript": "Today's talk is about how bridges stay strong. Engineers often use an arch because its curved shape can support heavy weight without falling. The weight pushes down and spreads out along the curve. That is why many old stone bridges still stand today. Now complete the summary.",
     "teacher": {
      "use": "Academic content listening.",
      "function": "Listen for a cause-and-effect fact.",
      "lower": "Show a picture of an arch bridge.",
      "onLevel": "Read once.",
      "challenge": "Students explain how the weight spreads out.",
      "noTech": "Read aloud; students fill a printed summary.",
      "prompt": "Why is the arch shape strong?"
     }
    }
   ]
  },
  "Reading": {
   "A": [
    {
     "id": "rv5-school-garden-1",
     "title": "The School Garden, Part 1",
     "skill": "Locate an explicit detail",
     "time": "5 min",
     "type": "hotText",
     "directions": "Read the part of the story. Then click the sentence that answers the question.",
     "passageTitle": "The School Garden (Part 1)",
     "passage": [
      "Last spring, the sixth-grade class started a garden behind the school.",
      "Mr. Ruiz gave each student a small packet of seeds.",
      "Maya chose tomato seeds because she wanted to grow something for her family.",
      "Every morning before class, she checked the soil and added a little water."
     ],
     "prompt": "Click the sentence that tells why Maya chose tomato seeds.",
     "sentences": [
      {
       "id": "s1",
       "text": "Last spring, the sixth-grade class started a garden behind the school."
      },
      {
       "id": "s2",
       "text": "Mr. Ruiz gave each student a small packet of seeds."
      },
      {
       "id": "s3",
       "text": "Maya chose tomato seeds because she wanted to grow something for her family."
      },
      {
       "id": "s4",
       "text": "Every morning before class, she checked the soil and added a little water."
      }
     ],
     "answers": [
      "s3"
     ],
     "correct": "Correct. The word \"because\" gives Maya's reason: she wanted to grow something for her family.",
     "hint": "Look for the word \"because.\" It signals a reason.",
     "support": "Scan for the key word \"because.\" The reason often comes right after it.",
     "extension": "What did Maya do every morning to care for her seeds?",
     "vocabulary": [
      [
       "packet",
       "a small paper bag that holds seeds",
       "spanish: paquete: una pequeña bolsa de papel con semillas"
      ],
      [
       "soil",
       "the dirt that plants grow in",
       "spanish: tierra: la tierra donde crecen las plantas"
      ],
      [
       "because",
       "a word that gives a reason",
       "spanish: porque: una palabra que da una razón"
      ]
     ],
     "frames": [
      "Maya chose tomato seeds because ___.",
      "I know because I read the word ___."
     ],
     "readFor": [
      "the word because",
      "Maya's reason",
      "what she does each morning"
     ],
     "wida": [
      "Locate explicit detail",
      "Identify a stated reason"
     ],
     "teacher": {
      "use": "Opening reading item; explicit detail.",
      "function": "Locate a stated reason in a short narrative.",
      "lower": "Read the passage aloud and underline \"because\" together.",
      "onLevel": "Students read silently, then click.",
      "challenge": "Students restate the reason in their own words.",
      "noTech": "Print the passage; students underline the answer sentence.",
      "prompt": "Which word told you a reason was coming?"
     }
    },
    {
     "id": "rv5-school-garden-2",
     "title": "The School Garden, Part 2",
     "skill": "Sequence story events",
     "time": "6 min",
     "type": "order",
     "directions": "Read the next part of the story. Then put the events in the order they happened.",
     "passageTitle": "The School Garden (Part 2)",
     "passage": [
      "First, Maya planted the tomato seeds in a small pot.",
      "After two weeks, tiny green shoots pushed through the soil.",
      "When the plants grew taller, the class moved them outside into the garden beds.",
      "By June, the plants had small green tomatoes hanging from the stems."
     ],
     "prompt": "Put the events in the order they happened in the story.",
     "items": [
      {
       "id": "e1",
       "text": "Maya planted the seeds in a small pot."
      },
      {
       "id": "e2",
       "text": "Tiny green shoots pushed through the soil."
      },
      {
       "id": "e3",
       "text": "The class moved the plants into the garden beds."
      },
      {
       "id": "e4",
       "text": "Small green tomatoes hung from the stems."
      }
     ],
     "answer": [
      "e1",
      "e2",
      "e3",
      "e4"
     ],
     "correct": "Correct. The order is: planted seeds, shoots appeared, moved outside, then tomatoes grew.",
     "hint": "Look for time words: first, after two weeks, when, by June.",
     "support": "Time words like first, after, and by June show the order of events.",
     "extension": "What do you think happens to the tomatoes next?",
     "vocabulary": [
      [
       "shoots",
       "the first small green parts of a new plant",
       "spanish: brotes: las primeras partes verdes de una planta nueva"
      ],
      [
       "garden beds",
       "areas of soil where plants grow",
       "spanish: parcelas: áreas de tierra donde crecen las plantas"
      ],
      [
       "stems",
       "the parts that hold up a plant",
       "spanish: tallos: las partes que sostienen una planta"
      ]
     ],
     "frames": [
      "First, ___. After that, ___.",
      "The last event was ___."
     ],
     "readFor": [
      "time words",
      "what happened first",
      "what happened last"
     ],
     "wida": [
      "Sequence events",
      "Use signal words"
     ],
     "teacher": {
      "use": "Sequencing item using narrative time words.",
      "function": "Order events in a short story.",
      "lower": "Use movable strips and sort first, last.",
      "onLevel": "Students order independently.",
      "challenge": "Remove time words and re-order.",
      "noTech": "Number the events 1-4 on paper.",
      "prompt": "Which time word helped the most?"
     }
    },
    {
     "id": "rv5-school-garden-3",
     "title": "The School Garden, Part 3",
     "skill": "Determine central idea",
     "time": "5 min",
     "type": "multipleChoice",
     "directions": "Read the last part of the story. Then choose the best answer.",
     "passageTitle": "The School Garden (Part 3)",
     "passage": [
      "In July, the class held a small market on the school steps.",
      "They sold tomatoes, peppers, and herbs to teachers and families.",
      "With the money, the class bought new tools and more seeds for next year.",
      "Maya smiled. Their hard work had grown into something they could share."
     ],
     "prompt": "What is the main idea of this part of the story?",
     "options": [
      {
       "id": "a",
       "text": "The class turned their hard work into something to share.",
       "visual": "🤝"
      },
      {
       "id": "b",
       "text": "Maya did not like tomatoes anymore.",
       "visual": "🙅"
      },
      {
       "id": "c",
       "text": "The market was open every day in July.",
       "visual": "📅"
      }
     ],
     "answer": "a",
     "correct": "Yes. The market and the smile show the class shared the results of their hard work.",
     "hint": "Look at the last sentence. It often points to the main idea.",
     "support": "The main idea is the big point. Small facts (peppers, July) are details, not the main idea.",
     "extension": "Why is it important that the class bought seeds for next year?",
     "vocabulary": [
      [
       "market",
       "a place where people buy and sell things",
       "spanish: mercado: un lugar donde se compra y se vende"
      ],
      [
       "herbs",
       "small plants used to flavor food",
       "spanish: hierbas: plantas pequeñas que dan sabor a la comida"
      ],
      [
       "share",
       "to give part of something to others",
       "spanish: compartir: dar parte de algo a otros"
      ]
     ],
     "frames": [
      "The main idea is ___.",
      "I know because the story says ___."
     ],
     "readFor": [
      "the last sentence",
      "what the class did with the money",
      "the big point"
     ],
     "wida": [
      "Determine central idea",
      "Separate idea from detail"
     ],
     "teacher": {
      "use": "Closing item; main idea of a narrative.",
      "function": "Identify the central idea over details.",
      "lower": "Cover the detail options and reason about the last line.",
      "onLevel": "Independent.",
      "challenge": "Students write the main idea in one sentence.",
      "noTech": "Read aloud; students vote with thumbs.",
      "prompt": "Which sentence helped you find the main idea?"
     }
    },
    {
     "id": "rv5-vocab-context-recycle",
     "title": "Word Meaning from Context",
     "skill": "Use context clues",
     "time": "5 min",
     "type": "multipleChoice",
     "directions": "Read the short passage. Use the other words to figure out the meaning of the bold word.",
     "passageTitle": "A Cleaner Cafeteria",
     "passage": [
      "Our cafeteria used to throw away a lot of food and paper.",
      "Now students put cans and bottles into special bins to be reused.",
      "This way, less trash goes to the dump, and our school helps the planet."
     ],
     "prompt": "In this passage, what does the word \"reused\" most likely mean?",
     "options": [
      {
       "id": "a",
       "text": "used again instead of thrown away",
       "visual": "♻️"
      },
      {
       "id": "b",
       "text": "burned in a large fire",
       "visual": "🔥"
      },
      {
       "id": "c",
       "text": "buried deep in the ground",
       "visual": "⛏️"
      }
     ],
     "answer": "a",
     "correct": "Correct. The bins help items be used again, so less trash goes to the dump.",
     "hint": "Read the sentence around the word. What happens to the cans and bottles?",
     "support": "Context clues are the nearby words that explain a hard word.",
     "extension": "Name one item your school could reuse.",
     "vocabulary": [
      [
       "reused",
       "used again",
       "spanish: reutilizado: usado otra vez"
      ],
      [
       "bins",
       "containers for collecting things",
       "spanish: contenedores: recipientes para recoger cosas"
      ],
      [
       "dump",
       "a place where trash is left",
       "spanish: basurero: un lugar donde se deja la basura"
      ]
     ],
     "frames": [
      "\"Reused\" means ___.",
      "I know because the passage says ___."
     ],
     "readFor": [
      "nearby words",
      "what happens to the items",
      "the clue about trash"
     ],
     "wida": [
      "Use context clues",
      "Infer word meaning"
     ],
     "teacher": {
      "use": "Vocabulary-in-context warm-up.",
      "function": "Infer meaning from surrounding text.",
      "lower": "Highlight the clue words together.",
      "onLevel": "Independent.",
      "challenge": "Students use \"reused\" in a new sentence.",
      "noTech": "Read aloud; students point to the clue.",
      "prompt": "Which words gave you the clue?"
     }
    },
    {
     "id": "rv5-multiselect-true-details",
     "title": "True Details from the Text",
     "skill": "Identify multiple details",
     "time": "6 min",
     "type": "multiSelect",
     "directions": "Read the passage. Then choose ALL the statements that are true according to the text.",
     "passageTitle": "The Class Library",
     "passage": [
      "Room 12 has a small library in the back corner.",
      "Students may borrow two books at a time for one week.",
      "Comic books and chapter books are on the blue shelf.",
      "There are no movies or games in the class library."
     ],
     "prompt": "Which statements are true according to the passage? Choose all that apply.",
     "options": [
      {
       "id": "a",
       "text": "Students may borrow two books at a time."
      },
      {
       "id": "b",
       "text": "Comic books are on the blue shelf."
      },
      {
       "id": "c",
       "text": "The library has movies to borrow."
      },
      {
       "id": "d",
       "text": "Books can be kept for one week."
      }
     ],
     "answers": [
      "a",
      "b",
      "d"
     ],
     "correct": "Correct. The text says two books, one week, and comics on the blue shelf. It has no movies.",
     "hint": "Check each choice against the text. One choice says the opposite of the passage.",
     "support": "Find the exact line in the passage that proves each true statement.",
     "extension": "How many books could you borrow in two weeks?",
     "vocabulary": [
      [
       "borrow",
       "to take and use, then return",
       "spanish: pedir prestado: tomar y usar, y luego devolver"
      ],
      [
       "shelf",
       "a flat board for holding books",
       "spanish: estante: una tabla plana para guardar libros"
      ],
      [
       "chapter book",
       "a longer book divided into parts",
       "spanish: libro por capítulos: un libro más largo dividido en partes"
      ]
     ],
     "frames": [
      "This statement is true because the text says ___.",
      "This one is false because ___."
     ],
     "readFor": [
      "how many books",
      "how long",
      "what is NOT in the library"
     ],
     "wida": [
      "Identify multiple details",
      "Match claims to text"
     ],
     "teacher": {
      "use": "List-tracking item with a false distractor.",
      "function": "Verify several details against a text.",
      "lower": "Check one statement at a time.",
      "onLevel": "Independent.",
      "challenge": "Students add one more true statement.",
      "noTech": "Read aloud; students check boxes on paper.",
      "prompt": "Which choice said the opposite of the text?"
     }
    },
    {
     "id": "rv5-cloze-bus-routine",
     "title": "Finish the Summary: Morning Routine",
     "skill": "Complete a text summary",
     "time": "6 min",
     "type": "cloze",
     "directions": "Read the passage. Then complete the summary by choosing the best word for each blank.",
     "passageTitle": "Diego's Morning",
     "passage": [
      "Diego wakes up at six o'clock every school day.",
      "First he eats breakfast, and then he walks to the bus stop.",
      "The bus is usually early, so Diego is never late for class."
     ],
     "prompt": "Complete the summary of Diego's morning.",
     "segments": [
      {
       "text": "Diego wakes up early. First he eats breakfast, and "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "then",
        "options": [
         "then",
         "before",
         "never"
        ]
       }
      },
      {
       "text": " he walks to the bus stop. Because the bus is early, Diego is "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "never",
        "options": [
         "never",
         "always",
         "sometimes"
        ]
       }
      },
      {
       "text": " late for class."
      }
     ],
     "correct": "Correct. The order is breakfast then the bus, and Diego is never late.",
     "hint": "Look at the order words and how the passage describes Diego being on time.",
     "support": "\"Then\" shows the next step. \"Never late\" matches \"never\" being late.",
     "extension": "What might happen if the bus were late one day?",
     "vocabulary": [
      [
       "routine",
       "things you do the same way each day",
       "spanish: rutina: cosas que haces igual cada día"
      ],
      [
       "then",
       "a word that shows the next step",
       "spanish: luego: una palabra que muestra el siguiente paso"
      ],
      [
       "never",
       "not at any time",
       "spanish: nunca: en ningún momento"
      ]
     ],
     "frames": [
      "First Diego ___, and then he ___.",
      "Diego is ___ late."
     ],
     "readFor": [
      "order words",
      "what Diego does first",
      "is he ever late"
     ],
     "wida": [
      "Summarize a text",
      "Use sequence words"
     ],
     "teacher": {
      "use": "Summary completion using sequence language.",
      "function": "Fill gaps in a text summary.",
      "lower": "Read the passage twice before choosing.",
      "onLevel": "Independent.",
      "challenge": "Students write the summary without options.",
      "noTech": "Fill the blanks on a printed summary.",
      "prompt": "Which word shows the next step?"
     }
    },
    {
     "id": "rv5-sort-fact-opinion",
     "title": "Fact or Opinion?",
     "skill": "Distinguish fact from opinion",
     "time": "6 min",
     "type": "sort",
     "directions": "Read each sentence about the school play. Choose whether it is a fact or an opinion. Use the buttons; no dragging is needed.",
     "passageTitle": "The School Play",
     "passage": [
      "The sixth-grade play was held in the gym on Friday night.",
      "Many families came to watch, and the seats were full.",
      "Some people thought the music was the best part of the show."
     ],
     "prompt": "Sort each sentence as a Fact or an Opinion.",
     "categories": [
      "Fact",
      "Opinion"
     ],
     "items": [
      {
       "id": "f1",
       "text": "The play was held in the gym on Friday night.",
       "answer": "Fact"
      },
      {
       "id": "f2",
       "text": "The seats were full of families.",
       "answer": "Fact"
      },
      {
       "id": "f3",
       "text": "The music was the best part of the show.",
       "answer": "Opinion"
      },
      {
       "id": "f4",
       "text": "Everyone should join the play next year.",
       "answer": "Opinion"
      }
     ],
     "correct": "Strong work. Facts can be checked; opinions tell what someone feels or believes.",
     "hint": "Opinions often use words like best, should, or beautiful.",
     "support": "A fact can be proven true. An opinion is a feeling or belief.",
     "extension": "Write one fact and one opinion about your school.",
     "vocabulary": [
      [
       "fact",
       "something that can be proven true",
       "spanish: hecho: algo que se puede probar verdadero"
      ],
      [
       "opinion",
       "what a person feels or believes",
       "spanish: opinión: lo que una persona siente o cree"
      ],
      [
       "proven",
       "shown to be true",
       "spanish: comprobado: demostrado como verdadero"
      ]
     ],
     "frames": [
      "This is a fact because ___.",
      "This is an opinion because ___."
     ],
     "readFor": [
      "opinion words like best or should",
      "facts that can be checked"
     ],
     "wida": [
      "Distinguish fact from opinion",
      "Classify sentences"
     ],
     "teacher": {
      "use": "Genre-feature sort for argument reading.",
      "function": "Classify sentences as fact or opinion.",
      "lower": "Sort only the two clearest sentences first.",
      "onLevel": "Independent.",
      "challenge": "Students explain one opinion's clue word.",
      "noTech": "Sort sentence strips on desks.",
      "prompt": "Which clue word signaled an opinion?"
     }
    },
    {
     "id": "rv5-constructed-favorite-character",
     "title": "Explain Your Answer",
     "skill": "Support an answer with text",
     "time": "8 min",
     "type": "constructed",
     "directions": "Read the short passage. Then write one complete sentence that answers the question using the text.",
     "passageTitle": "A Good Teammate",
     "passage": [
      "When Liam dropped the ball, his teammate Sara did not get angry.",
      "She helped him up and said, \"We win and lose together.\"",
      "After the game, the coach said Sara was a true teammate."
     ],
     "prompt": "Prompt: How do you know Sara is a good teammate? Use one detail from the passage.",
     "responseLabel": "Your one-sentence answer",
     "responsePlaceholder": "Sara is a good teammate because ___.",
     "correct": "Response saved. A strong answer uses one detail from the text, such as helping Liam up.",
     "hint": "Use the frame and include one action Sara did.",
     "support": "Model: Sara is a good teammate because she helped Liam up instead of getting angry.",
     "extension": "Add a second detail that supports your answer.",
     "vocabulary": [
      [
       "teammate",
       "a person on your team",
       "spanish: compañero de equipo: una persona en tu equipo"
      ],
      [
       "detail",
       "a small fact from the text",
       "spanish: detalle: un dato pequeño del texto"
      ],
      [
       "support",
       "to give a reason or proof",
       "spanish: apoyar: dar una razón o prueba"
      ]
     ],
     "frames": [
      "Sara is a good teammate because ___.",
      "The passage says ___."
     ],
     "sayFor": [
      "a naming part",
      "a text detail",
      "an end mark"
     ],
     "wida": [
      "Support an answer with evidence",
      "Write a complete sentence"
     ],
     "teacher": {
      "use": "Short text-evidence exit ticket.",
      "function": "Cite one detail to support an answer.",
      "lower": "Students fill in the frame.",
      "onLevel": "Students write without the frame.",
      "challenge": "Students add a second supporting detail.",
      "noTech": "Write the sentence on a graphic organizer.",
      "prompt": "Where is your text detail in the sentence?"
     }
    },
    {
     "id": "rv5-ws-context-clues",
     "title": "Worksheet: Context Clues",
     "type": "worksheet",
     "skill": "Use context clues to find word meaning",
     "time": "15 min",
     "directions": "Read each sentence. Use the other words as clues to choose or write the meaning of the bold word. Then check your work with a partner.",
     "vocabulary": [
      [
       "context",
       "the words around a word that give clues",
       "spanish: contexto: las palabras alrededor que dan pistas"
      ],
      [
       "clue",
       "a hint that helps you understand",
       "spanish: pista: una señal que ayuda a entender"
      ],
      [
       "meaning",
       "what a word tells you",
       "spanish: significado: lo que dice una palabra"
      ]
     ],
     "frames": [
      "I think the word means ___.",
      "My clue is the word ___."
     ],
     "sheet": [
      {
       "heading": "Part A: Choose the meaning",
       "items": [
        "The trail was so STEEP that we had to climb slowly. STEEP means: (a) flat  (b) going up sharply  (c) wet",
        "After the long race, the runner was EXHAUSTED and sat down to rest. EXHAUSTED means: (a) very tired  (b) very happy  (c) very hungry",
        "The teacher gave a BRIEF talk that lasted only two minutes. BRIEF means: (a) loud  (b) short  (c) boring"
       ]
      },
      {
       "heading": "Part B: Write the meaning and your clue",
       "items": [
        "The old bridge was FRAGILE, so the workers fixed it before anyone crossed. FRAGILE means ___. My clue: ___.",
        "We were GRATEFUL to the firefighters who saved our home. GRATEFUL means ___. My clue: ___.",
        "The directions were so VAGUE that nobody knew where to go. VAGUE means ___. My clue: ___."
       ]
      },
      {
       "heading": "Part C: Use a frame",
       "items": [
        "Choose one bold word above. Write: I think the word ___ means ___ because the sentence says ___."
       ]
      }
     ],
     "answerKey": [
      "Part A: 1-b, 2-a, 3-b.",
      "Part B (sample): FRAGILE = easily broken; GRATEFUL = thankful; VAGUE = unclear."
     ],
     "teacher": {
      "use": "Independent or partner vocabulary practice.",
      "function": "Infer word meaning from context.",
      "lower": "Do Part A only; preteach two words.",
      "onLevel": "Complete Parts A and B.",
      "challenge": "Complete all parts and add one new sentence.",
      "noTech": "Print and complete on paper.",
      "prompt": "What clue helped you the most?"
     }
    },
    {
     "id": "rv5-ws-main-idea-details",
     "title": "Worksheet: Main Idea and Details",
     "type": "worksheet",
     "skill": "Identify main idea and supporting details",
     "time": "15 min",
     "directions": "Read the short paragraph at the top of each section. Then find the main idea and list two details that support it.",
     "vocabulary": [
      [
       "main idea",
       "the most important point of a text",
       "spanish: idea principal: el punto más importante de un texto"
      ],
      [
       "detail",
       "a small fact that supports the main idea",
       "spanish: detalle: un dato pequeño que apoya la idea principal"
      ],
      [
       "support",
       "to back up or give proof",
       "spanish: apoyar: respaldar o dar prueba"
      ]
     ],
     "frames": [
      "The main idea is ___.",
      "One detail that supports it is ___."
     ],
     "sheet": [
      {
       "heading": "Paragraph 1: Bats",
       "items": [
        "Read: \"Bats are helpful animals. They eat thousands of insects each night. Some bats also help plants by spreading pollen. Farmers like bats because they protect crops.\"",
        "Main idea: ___",
        "Detail 1: ___",
        "Detail 2: ___"
       ]
      },
      {
       "heading": "Paragraph 2: Sleep",
       "items": [
        "Read: \"Sleep is important for students. A good night's sleep helps your brain remember new lessons. It also gives your body energy for the day. Students who sleep enough often do better in school.\"",
        "Main idea: ___",
        "Detail 1: ___",
        "Detail 2: ___"
       ]
      },
      {
       "heading": "Reflect",
       "items": [
        "Write one sentence using the frame: The main idea of Paragraph 2 is ___ because ___."
       ]
      }
     ],
     "answerKey": [
      "P1 main idea: Bats are helpful animals. Details: eat insects; spread pollen; protect crops.",
      "P2 main idea: Sleep is important for students. Details: helps the brain remember; gives energy; do better in school."
     ],
     "teacher": {
      "use": "Reading-comprehension practice sheet.",
      "function": "Separate the main idea from supporting details.",
      "lower": "Provide the main idea; students find details.",
      "onLevel": "Students find both.",
      "challenge": "Students add a third detail or a title.",
      "noTech": "Print and complete on paper.",
      "prompt": "How do the details connect to the main idea?"
     }
    },
    {
     "id": "rv5-ws-text-structure",
     "title": "Worksheet: Text Structure",
     "type": "worksheet",
     "skill": "Recognize informational text structures",
     "time": "15 min",
     "directions": "Read each short passage. Decide its text structure and circle the signal words that helped you.",
     "vocabulary": [
      [
       "sequence",
       "events in time order",
       "spanish: secuencia: eventos en orden de tiempo"
      ],
      [
       "compare",
       "tell how things are alike or different",
       "spanish: comparar: decir en qué se parecen o diferencian"
      ],
      [
       "cause and effect",
       "a reason and its result",
       "spanish: causa y efecto: una razón y su resultado"
      ]
     ],
     "frames": [
      "The structure is ___.",
      "A signal word is ___."
     ],
     "sheet": [
      {
       "heading": "Passage A",
       "items": [
        "\"First, fill the pot with soil. Next, plant the seed. Then water it. Finally, place it in the sun.\"",
        "Structure (sequence / compare / cause-effect): ___",
        "Signal words I see: ___"
       ]
      },
      {
       "heading": "Passage B",
       "items": [
        "\"Dogs and cats are both popular pets. However, dogs need walks, while cats clean themselves.\"",
        "Structure (sequence / compare / cause-effect): ___",
        "Signal words I see: ___"
       ]
      },
      {
       "heading": "Passage C",
       "items": [
        "\"Because it rained all week, the field flooded, so the game was moved indoors.\"",
        "Structure (sequence / compare / cause-effect): ___",
        "Signal words I see: ___"
       ]
      }
     ],
     "answerKey": [
      "A: sequence (first, next, then, finally).",
      "B: compare/contrast (both, however, while).",
      "C: cause and effect (because, so)."
     ],
     "teacher": {
      "use": "Text-structure identification practice.",
      "function": "Match passages to their organizational structure.",
      "lower": "Give the three choices and a word bank.",
      "onLevel": "Students decide independently.",
      "challenge": "Students write one new passage in a chosen structure.",
      "noTech": "Print and circle signal words.",
      "prompt": "Which signal words gave away the structure?"
     }
    }
   ],
   "B": [
    {
     "id": "rv5-info-volcano-1",
     "title": "How Volcanoes Form, Part 1",
     "skill": "Locate explicit information",
     "time": "5 min",
     "type": "hotText",
     "directions": "Read part of the article. Then click the sentence that answers the question.",
     "passageTitle": "How Volcanoes Form (Part 1)",
     "passage": [
      "Deep inside the Earth, rock is so hot that it melts into a liquid called magma.",
      "Magma is lighter than the solid rock around it, so it slowly rises.",
      "When magma reaches the surface and erupts, we call it lava.",
      "Over time, layers of cooled lava build up into a mountain we call a volcano."
     ],
     "prompt": "Click the sentence that tells what melted rock is called before it erupts.",
     "sentences": [
      {
       "id": "s1",
       "text": "Deep inside the Earth, rock is so hot that it melts into a liquid called magma."
      },
      {
       "id": "s2",
       "text": "Magma is lighter than the solid rock around it, so it slowly rises."
      },
      {
       "id": "s3",
       "text": "When magma reaches the surface and erupts, we call it lava."
      },
      {
       "id": "s4",
       "text": "Over time, layers of cooled lava build up into a mountain we call a volcano."
      }
     ],
     "answers": [
      "s1"
     ],
     "correct": "Correct. Melted rock underground is called magma; it becomes lava only after it erupts.",
     "hint": "Find the sentence that names the liquid that forms underground.",
     "support": "Watch the difference: magma is underground, lava is on the surface.",
     "extension": "What is melted rock called after it reaches the surface?",
     "vocabulary": [
      [
       "magma",
       "melted rock under the ground",
       "spanish: magma: roca derretida bajo la tierra"
      ],
      [
       "erupt",
       "to burst out",
       "spanish: hacer erupción: salir con fuerza"
      ],
      [
       "layers",
       "things stacked on top of each other",
       "spanish: capas: cosas apiladas una sobre otra"
      ]
     ],
     "frames": [
      "Melted rock underground is called ___.",
      "I know because the text says ___."
     ],
     "readFor": [
      "the word magma",
      "underground vs. surface",
      "how a volcano builds up"
     ],
     "wida": [
      "Locate explicit detail",
      "Process science vocabulary"
     ],
     "teacher": {
      "use": "Opening science reading item.",
      "function": "Locate a defined term in informational text.",
      "lower": "Preteach magma and lava with a picture.",
      "onLevel": "Independent.",
      "challenge": "Students contrast magma and lava in one sentence.",
      "noTech": "Underline the answer on a printed article.",
      "prompt": "What is the difference between magma and lava?"
     }
    },
    {
     "id": "rv5-info-volcano-2",
     "title": "How Volcanoes Form, Part 2",
     "skill": "Sequence a process",
     "time": "6 min",
     "type": "order",
     "directions": "Read the next part of the article. Then put the steps of the process in order.",
     "passageTitle": "How Volcanoes Form (Part 2)",
     "passage": [
      "First, heat deep in the Earth melts solid rock into magma.",
      "Next, the lighter magma rises toward the surface through cracks.",
      "Then the magma erupts as lava through an opening called a vent.",
      "Finally, the lava cools and hardens, adding a new layer to the volcano."
     ],
     "prompt": "Put the steps of how a volcano grows in the correct order.",
     "items": [
      {
       "id": "p1",
       "text": "Heat melts solid rock into magma."
      },
      {
       "id": "p2",
       "text": "The lighter magma rises through cracks."
      },
      {
       "id": "p3",
       "text": "Magma erupts as lava through a vent."
      },
      {
       "id": "p4",
       "text": "Lava cools and hardens into a new layer."
      }
     ],
     "answer": [
      "p1",
      "p2",
      "p3",
      "p4"
     ],
     "correct": "Correct. The order is melt, rise, erupt, cool and harden.",
     "hint": "Use the signal words: first, next, then, finally.",
     "support": "Process texts use order words to show each step.",
     "extension": "Which step adds height to the volcano?",
     "vocabulary": [
      [
       "process",
       "a set of steps that lead to a result",
       "spanish: proceso: un conjunto de pasos que llevan a un resultado"
      ],
      [
       "vent",
       "an opening where lava comes out",
       "spanish: chimenea: una abertura por donde sale la lava"
      ],
      [
       "harden",
       "to become solid",
       "spanish: endurecerse: volverse sólido"
      ]
     ],
     "frames": [
      "First ___, and finally ___.",
      "The step that adds height is ___."
     ],
     "readFor": [
      "order words",
      "the first step",
      "the final step"
     ],
     "wida": [
      "Sequence a process",
      "Use signal words"
     ],
     "teacher": {
      "use": "Process-sequencing item in science.",
      "function": "Order the steps of a natural process.",
      "lower": "Sort first and last only.",
      "onLevel": "Independent.",
      "challenge": "Remove signal words and re-order.",
      "noTech": "Number the steps 1-4 on paper.",
      "prompt": "Which order word helped the most?"
     }
    },
    {
     "id": "rv5-info-volcano-3",
     "title": "How Volcanoes Form, Part 3",
     "skill": "Make an inference",
     "time": "6 min",
     "type": "multipleChoice",
     "directions": "Read the last part of the article. Then choose the best answer.",
     "passageTitle": "How Volcanoes Form (Part 3)",
     "passage": [
      "Some volcanoes have not erupted for thousands of years.",
      "Scientists watch these volcanoes closely with special tools.",
      "Even a quiet volcano can wake up, so cities nearby make safety plans.",
      "Knowing how volcanoes work helps people stay safe."
     ],
     "prompt": "What can you infer about scientists who watch quiet volcanoes?",
     "options": [
      {
       "id": "a",
       "text": "They want to warn people before a volcano erupts.",
       "visual": "🚨"
      },
      {
       "id": "b",
       "text": "They believe volcanoes can never erupt again.",
       "visual": "🚫"
      },
      {
       "id": "c",
       "text": "They think safety plans are a waste of time.",
       "visual": "🗑️"
      }
     ],
     "answer": "a",
     "correct": "Yes. They watch closely and cities make safety plans, so they want to warn people in time.",
     "hint": "An inference uses clues from the text plus what you already know.",
     "support": "The text says a quiet volcano can wake up and cities plan for safety. Use that clue.",
     "extension": "What clue helped you make this inference?",
     "vocabulary": [
      [
       "infer",
       "to figure out using clues",
       "spanish: inferir: deducir usando pistas"
      ],
      [
       "erupt",
       "to burst out",
       "spanish: hacer erupción: salir con fuerza"
      ],
      [
       "safety plan",
       "steps to keep people safe",
       "spanish: plan de seguridad: pasos para proteger a las personas"
      ]
     ],
     "frames": [
      "I can infer that ___.",
      "A clue in the text is ___."
     ],
     "readFor": [
      "why scientists watch",
      "why cities plan",
      "a clue you can use"
     ],
     "wida": [
      "Make an inference",
      "Combine clues with prior knowledge"
     ],
     "teacher": {
      "use": "Higher-level inference item.",
      "function": "Infer purpose from textual clues.",
      "lower": "Discuss the clue sentences aloud first.",
      "onLevel": "Independent.",
      "challenge": "Students name two clues for their inference.",
      "noTech": "Highlight clues; discuss the inference.",
      "prompt": "Which clue made the inference strongest?"
     }
    },
    {
     "id": "rv5-cloze-graph-recycle",
     "title": "Finish the Summary: Recycling Data",
     "skill": "Interpret data in text",
     "time": "6 min",
     "type": "cloze",
     "directions": "Read the short report. Then complete the summary by choosing the best word for each blank.",
     "passageTitle": "Recycling at Lincoln Middle School",
     "passage": [
      "In September, students recycled 40 bins of paper.",
      "In October, they recycled 65 bins, the most of any month so far.",
      "In November, the number dropped to 50 bins."
     ],
     "prompt": "Complete the summary of the recycling report.",
     "segments": [
      {
       "text": "Recycling rose from September to October, so October had "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "more",
        "options": [
         "more",
         "less",
         "the same"
        ]
       }
      },
      {
       "text": " bins than September. October was also the "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "highest",
        "options": [
         "highest",
         "lowest",
         "middle"
        ]
       }
      },
      {
       "text": " month of the three."
      }
     ],
     "correct": "Correct. October (65) was more than September (40) and the highest of the three months.",
     "hint": "Compare the numbers: 40, 65, then 50. Which month had the most?",
     "support": "\"More\" compares two months. \"Highest\" means the greatest of all three.",
     "extension": "How many fewer bins were recycled in November than October?",
     "vocabulary": [
      [
       "data",
       "facts and numbers about something",
       "spanish: datos: hechos y números sobre algo"
      ],
      [
       "increase",
       "to go up",
       "spanish: aumentar: subir"
      ],
      [
       "highest",
       "the greatest amount",
       "spanish: el más alto: la mayor cantidad"
      ]
     ],
     "frames": [
      "October had ___ bins than September.",
      "The highest month was ___."
     ],
     "readFor": [
      "the three numbers",
      "which month had the most",
      "compare two months"
     ],
     "wida": [
      "Interpret data in text",
      "Use comparatives and superlatives"
     ],
     "teacher": {
      "use": "Data-in-text item with comparison language.",
      "function": "Compare numerical data described in a report.",
      "lower": "Write the three numbers in a column first.",
      "onLevel": "Independent.",
      "challenge": "Students find the range across all months.",
      "noTech": "Fill a printed summary.",
      "prompt": "How do you know which month was highest?"
     }
    },
    {
     "id": "rv5-multiselect-text-features",
     "title": "Where Would You Look?",
     "skill": "Use text features",
     "time": "6 min",
     "type": "multiSelect",
     "directions": "Read about the parts of a textbook. Then choose ALL the correct answers.",
     "passageTitle": "Parts of a Textbook",
     "passage": [
      "The table of contents at the front lists chapters and page numbers.",
      "The glossary at the back explains the meaning of important words.",
      "The index lists topics in alphabetical order with their page numbers.",
      "Captions under photos tell you what each picture shows."
     ],
     "prompt": "Which text features could help you find the page number of a topic? Choose all that apply.",
     "options": [
      {
       "id": "a",
       "text": "The table of contents"
      },
      {
       "id": "b",
       "text": "The index"
      },
      {
       "id": "c",
       "text": "The glossary"
      },
      {
       "id": "d",
       "text": "A photo caption"
      }
     ],
     "answers": [
      "a",
      "b"
     ],
     "correct": "Correct. Both the table of contents and the index give page numbers. The glossary gives meanings.",
     "hint": "Which features list page numbers? The glossary gives word meanings, not pages of topics.",
     "support": "Match each feature to its job. Page numbers come from the contents and the index.",
     "extension": "Where would you look to find the meaning of a hard word?",
     "vocabulary": [
      [
       "glossary",
       "a list of words and their meanings",
       "spanish: glosario: una lista de palabras y sus significados"
      ],
      [
       "index",
       "an alphabetical list of topics with pages",
       "spanish: índice: una lista alfabética de temas con páginas"
      ],
      [
       "caption",
       "words that explain a picture",
       "spanish: pie de foto: palabras que explican una imagen"
      ]
     ],
     "frames": [
      "I would look in the ___ to find ___.",
      "The ___ does not give page numbers."
     ],
     "readFor": [
      "which features give page numbers",
      "what the glossary does",
      "what a caption does"
     ],
     "wida": [
      "Use text features",
      "Match feature to purpose"
     ],
     "teacher": {
      "use": "Text-features item with two correct answers.",
      "function": "Select features by their function.",
      "lower": "Match each feature to its job aloud first.",
      "onLevel": "Independent.",
      "challenge": "Students name a feature not in the list and its use.",
      "noTech": "Show a real textbook and point to each part.",
      "prompt": "Which feature gives meanings instead of pages?"
     }
    },
    {
     "id": "rv5-sort-cause-effect",
     "title": "Cause and Effect",
     "skill": "Identify cause and effect",
     "time": "6 min",
     "type": "sort",
     "directions": "Read the passage. Then sort each sentence as a Cause or an Effect. Use the buttons; no dragging is needed.",
     "passageTitle": "The Power Went Out",
     "passage": [
      "A strong storm hit the town on Tuesday afternoon.",
      "Heavy wind knocked down a power line near the school.",
      "Because of this, the school lost electricity for two hours.",
      "Teachers used flashlights so students could keep working."
     ],
     "prompt": "Sort each sentence as a Cause or an Effect.",
     "categories": [
      "Cause",
      "Effect"
     ],
     "items": [
      {
       "id": "c1",
       "text": "Heavy wind knocked down a power line.",
       "answer": "Cause"
      },
      {
       "id": "c2",
       "text": "The school lost electricity for two hours.",
       "answer": "Effect"
      },
      {
       "id": "c3",
       "text": "A strong storm hit the town.",
       "answer": "Cause"
      },
      {
       "id": "c4",
       "text": "Teachers used flashlights to keep working.",
       "answer": "Effect"
      }
     ],
     "correct": "Strong work. A cause makes something happen; an effect is the result.",
     "hint": "Words like because and so signal a cause-and-effect link.",
     "support": "Ask: did this make something else happen (cause) or did it result from something (effect)?",
     "extension": "Write one cause and one effect from your own day.",
     "vocabulary": [
      [
       "cause",
       "the reason something happens",
       "spanish: causa: la razón por la que algo sucede"
      ],
      [
       "effect",
       "the result of a cause",
       "spanish: efecto: el resultado de una causa"
      ],
      [
       "electricity",
       "the power that runs lights and machines",
       "spanish: electricidad: la energía que enciende luces y máquinas"
      ]
     ],
     "frames": [
      "This is a cause because it made ___ happen.",
      "This is an effect because it resulted from ___."
     ],
     "readFor": [
      "signal words because and so",
      "what made something happen",
      "what resulted"
     ],
     "wida": [
      "Identify cause and effect",
      "Classify sentences"
     ],
     "teacher": {
      "use": "Cause-effect classification in informational text.",
      "function": "Sort sentences by cause or effect.",
      "lower": "Sort the clearest pair first (wind, lost power).",
      "onLevel": "Independent.",
      "challenge": "Students link each effect to its cause aloud.",
      "noTech": "Sort sentence strips on desks.",
      "prompt": "Which signal word linked a cause to an effect?"
     }
    },
    {
     "id": "rv5-mc-authors-purpose",
     "title": "Author's Purpose",
     "skill": "Determine author's purpose",
     "time": "5 min",
     "type": "multipleChoice",
     "directions": "Read the short passage. Then choose the best answer.",
     "passageTitle": "Drink More Water",
     "passage": [
      "Your body needs water to stay healthy and full of energy.",
      "When you do not drink enough, you may feel tired or get a headache.",
      "So bring a water bottle to school and take sips during the day.",
      "Your brain and body will thank you!"
     ],
     "prompt": "What is the author's main purpose in this passage?",
     "options": [
      {
       "id": "a",
       "text": "To persuade students to drink more water",
       "visual": "💧"
      },
      {
       "id": "b",
       "text": "To tell a funny story about a water bottle",
       "visual": "😂"
      },
      {
       "id": "c",
       "text": "To explain how rain is formed",
       "visual": "🌧️"
      }
     ],
     "answer": "a",
     "correct": "Yes. The author gives reasons and advice to convince students to drink more water.",
     "hint": "Is the author telling a story, explaining a process, or trying to convince you?",
     "support": "Persuade means to convince. Look for advice and reasons the author gives.",
     "extension": "Which sentence sounds the most like advice?",
     "vocabulary": [
      [
       "purpose",
       "the reason an author writes",
       "spanish: propósito: la razón por la que un autor escribe"
      ],
      [
       "persuade",
       "to convince someone",
       "spanish: persuadir: convencer a alguien"
      ],
      [
       "energy",
       "the power to do things",
       "spanish: energía: la fuerza para hacer cosas"
      ]
     ],
     "frames": [
      "The author's purpose is to ___.",
      "I know because the passage ___."
     ],
     "readFor": [
      "advice words",
      "reasons the author gives",
      "is it a story or a fact piece"
     ],
     "wida": [
      "Determine author's purpose",
      "Recognize persuasive text"
     ],
     "teacher": {
      "use": "Author's-purpose item (persuade/inform/entertain).",
      "function": "Identify why an author wrote a text.",
      "lower": "Review the three purposes with examples.",
      "onLevel": "Independent.",
      "challenge": "Students rewrite one line to inform instead of persuade.",
      "noTech": "Read aloud; students vote on the purpose.",
      "prompt": "What words showed the author wanted to convince you?"
     }
    },
    {
     "id": "rv5-constructed-compare-texts",
     "title": "Compare Two Texts",
     "skill": "Compare information across texts",
     "time": "8 min",
     "type": "constructed",
     "directions": "Read both short notes. Then write one complete sentence that compares them using the text.",
     "passageTitle": "Two Field Trip Notes",
     "passage": [
      "Note 1: The science museum trip is on Friday. Bring a bag lunch and wear comfortable shoes.",
      "Note 2: The art museum trip is on Monday. Lunch will be provided, and students should bring a notebook."
     ],
     "prompt": "Prompt: Name one thing that is different about the two field trips. Use details from both notes.",
     "responseLabel": "Your one-sentence comparison",
     "responsePlaceholder": "The trips are different because ___, but ___.",
     "correct": "Response saved. A strong answer names a clear difference, like the day or the lunch plan.",
     "hint": "Look at the day, the lunch, and what to bring for each trip.",
     "support": "Model: The science trip is on Friday with a bag lunch, but the art trip is on Monday with lunch provided.",
     "extension": "Name one thing that is the SAME about both trips.",
     "vocabulary": [
      [
       "compare",
       "to tell how things are alike or different",
       "spanish: comparar: decir en qué se parecen o se diferencian las cosas"
      ],
      [
       "provided",
       "given to you",
       "spanish: proporcionado: que te lo dan"
      ],
      [
       "different",
       "not the same",
       "spanish: diferente: que no es igual"
      ]
     ],
     "frames": [
      "The science trip is ___, but the art trip is ___.",
      "One difference is ___."
     ],
     "sayFor": [
      "a detail from Note 1",
      "a detail from Note 2",
      "a contrast word like but"
     ],
     "wida": [
      "Compare across texts",
      "Write a complete sentence"
     ],
     "teacher": {
      "use": "Cross-text comparison exit ticket.",
      "function": "Contrast details from two texts.",
      "lower": "Fill the frame with one detail from each note.",
      "onLevel": "Write without the frame.",
      "challenge": "Students write one difference AND one similarity.",
      "noTech": "Use a two-column chart on paper.",
      "prompt": "Which contrast word joined your two details?"
     }
    }
   ]
  },
  "Speaking": {
   "A": [
    {
     "id": "sv5-describe-classroom-emoji",
     "title": "Picture Talk: My Classroom",
     "skill": "Describe a picture aloud",
     "time": "7 min",
     "wida": [
      "describing a picture",
      "using academic nouns"
     ],
     "directions": "Look at the picture. Plan your notes, then say two or three sentences aloud about what you see.",
     "sayFor": [
      "a naming part",
      "where things are",
      "a describing word"
     ],
     "vocabulary": [
      [
       "classroom",
       "the room where students learn",
       "salón de clases: el cuarto donde aprenden los estudiantes"
      ],
      [
       "whiteboard",
       "a white wall surface teachers write on",
       "pizarra blanca: una superficie blanca donde escribe el maestro"
      ],
      [
       "bookshelf",
       "a shelf that holds books",
       "estante: un mueble que guarda libros"
      ]
     ],
     "frames": [
      "In the picture I see ___.",
      "The ___ is next to the ___."
     ],
     "type": "constructed",
     "prompt": "Picture: 🏫📚🖊️🪑 A classroom with desks, a whiteboard, and a bookshelf. What do you see? Plan, then say two or three sentences aloud.",
     "adminScript": "Look at the picture of a classroom. Tell me what you see. Try to use full sentences and name where the things are.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "In the picture I see ___. The ___ is next to the ___.",
     "wordBank": [
      "In the picture I see",
      "desks",
      "a whiteboard",
      "a bookshelf",
      "next to",
      "in front of",
      "behind"
     ],
     "correct": "Strong answer (model): In the picture I see a classroom with rows of desks. The whiteboard is at the front, and the bookshelf is next to the door.",
     "hint": "Name two or three things, then tell where each one is.",
     "support": "Model: I see desks. The whiteboard is at the front. Say it in full sentences out loud.",
     "extension": "Add one describing word, like 'a clean whiteboard' or 'a tall bookshelf.'",
     "teacher": {
      "use": "Speaking warm-up; students rehearse describing language before the model test.",
      "function": "Describe a familiar scene using nouns and location words.",
      "lower": "Students point to each item and name it before speaking.",
      "onLevel": "Students say three full sentences with location words.",
      "challenge": "Students add an adjective to each noun.",
      "noTech": "Show a printed picture; students describe it to a partner.",
      "prompt": "Which location word did you use?"
     }
    },
    {
     "id": "sv5-favorite-subject-opinion",
     "title": "Give Your Opinion: Favorite Subject",
     "skill": "State an opinion with a reason aloud",
     "time": "6 min",
     "wida": [
      "giving an opinion",
      "supporting with a reason"
     ],
     "directions": "Choose your favorite school subject. Plan a reason, then say your opinion aloud in full sentences.",
     "sayFor": [
      "an opinion word",
      "the word because",
      "one clear reason"
     ],
     "vocabulary": [
      [
       "opinion",
       "what you think or believe",
       "opinión: lo que tú piensas o crees"
      ],
      [
       "subject",
       "a class you take, like math or science",
       "materia: una clase que tomas, como matemáticas o ciencias"
      ],
      [
       "reason",
       "why you think something",
       "razón: por qué piensas algo"
      ]
     ],
     "frames": [
      "My favorite subject is ___.",
      "I like it because ___."
     ],
     "type": "constructed",
     "prompt": "Prompt: What is your favorite school subject? Plan a reason, then say your opinion aloud.",
     "adminScript": "Tell me your favorite school subject and why you like it. Use the word 'because' to give a reason.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "My favorite subject is ___. I like it because ___.",
     "wordBank": [
      "My favorite subject is",
      "I like it because",
      "math",
      "science",
      "art",
      "reading",
      "history",
      "it is fun",
      "I am good at it"
     ],
     "correct": "Strong answer (model): My favorite subject is science because we do experiments and I get to ask questions about the world.",
     "hint": "Say your opinion first, then add 'because' and one reason.",
     "support": "Model: My favorite subject is art because I like to draw. Say yours out loud.",
     "extension": "Add a second reason with the word 'also.'",
     "teacher": {
      "use": "Opinion-talk station before persuasive writing or speaking tests.",
      "function": "Produce an opinion statement with one supporting reason.",
      "lower": "Students fill the frame blanks before speaking.",
      "onLevel": "Students speak without reading the frame.",
      "challenge": "Students give two reasons and a closing sentence.",
      "noTech": "Partners interview each other and report the answer.",
      "prompt": "Where is your reason in the sentence?"
     }
    },
    {
     "id": "sv5-compare-two-pets",
     "title": "Compare Two Animals",
     "skill": "Compare two things aloud",
     "time": "7 min",
     "wida": [
      "comparing two things",
      "using comparison words"
     ],
     "directions": "Look at the two animals. Plan how they are alike and different, then say your comparison aloud.",
     "sayFor": [
      "a comparison word",
      "one way they are alike",
      "one way they are different"
     ],
     "vocabulary": [
      [
       "compare",
       "tell how things are alike and different",
       "comparar: decir en qué se parecen y en qué se diferencian"
      ],
      [
       "similar",
       "almost the same",
       "similar: casi igual"
      ],
      [
       "different",
       "not the same",
       "diferente: no igual"
      ]
     ],
     "frames": [
      "Both ___ and ___ are ___.",
      "A ___ is ___, but a ___ is ___."
     ],
     "type": "constructed",
     "prompt": "Pictures: 🐕 dog and 🐈 cat. How are they alike? How are they different? Plan, then say your comparison aloud.",
     "adminScript": "Look at the dog and the cat. Tell me one way they are alike and one way they are different. Use full sentences.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "Both a dog and a cat are ___. A dog is ___, but a cat is ___.",
     "wordBank": [
      "Both",
      "are",
      "but",
      "a dog is",
      "a cat is",
      "are pets",
      "have fur",
      "bark",
      "meow",
      "bigger",
      "smaller"
     ],
     "correct": "Strong answer (model): Both a dog and a cat are pets that have fur. A dog barks and likes to run, but a cat meows and likes to be quiet.",
     "hint": "Say one likeness with 'both,' then one difference with 'but.'",
     "support": "Model: Both are pets. A dog barks, but a cat meows. Say it aloud.",
     "extension": "Add a second difference about size or where they live.",
     "teacher": {
      "use": "Compare-contrast speaking practice; pairs well with the model test.",
      "function": "Use comparatives and 'both/but' to compare two things.",
      "lower": "Give students the two facts to compare first.",
      "onLevel": "Students produce one likeness and one difference.",
      "challenge": "Students compare three features and choose which animal they prefer.",
      "noTech": "Use two picture cards and a sentence-frame strip.",
      "prompt": "Which word showed a difference?"
     }
    },
    {
     "id": "sv5-retell-school-day",
     "title": "Retell Your School Day",
     "skill": "Retell events in order aloud",
     "time": "8 min",
     "wida": [
      "retelling in sequence",
      "using order words"
     ],
     "directions": "Think about a school day. Plan three events in order, then retell them aloud using order words.",
     "sayFor": [
      "order words",
      "three events",
      "full sentences"
     ],
     "vocabulary": [
      [
       "retell",
       "tell what happened again in your own words",
       "volver a contar: decir lo que pasó con tus palabras"
      ],
      [
       "first",
       "the event that happens at the start",
       "primero: el evento que pasa al inicio"
      ],
      [
       "finally",
       "the last event",
       "finalmente: el último evento"
      ]
     ],
     "frames": [
      "First, I ___.",
      "Then, I ___.",
      "Finally, I ___."
     ],
     "type": "constructed",
     "prompt": "Prompt: Retell three things you do in a school day, in order. Plan, then say them aloud with order words.",
     "adminScript": "Tell me about your school day. What do you do first, next, and last? Use the words first, then, and finally.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "First, I ___. Then, I ___. Finally, I ___.",
     "wordBank": [
      "First",
      "Then",
      "Next",
      "Finally",
      "I go to class",
      "I eat lunch",
      "I take a test",
      "I ride the bus home"
     ],
     "correct": "Strong answer (model): First, I go to my homeroom class. Then, I eat lunch with my friends. Finally, I ride the bus home.",
     "hint": "Use a different order word to start each sentence.",
     "support": "Model: First, I go to class. Then, I eat lunch. Finally, I go home.",
     "extension": "Add one detail to each event, like who you were with.",
     "teacher": {
      "use": "Sequencing speaking task; builds narrative retell language.",
      "function": "Retell three events in order using signal words.",
      "lower": "Students draw three events before speaking.",
      "onLevel": "Students retell with three different order words.",
      "challenge": "Students retell five events with details.",
      "noTech": "Use a three-box organizer on paper.",
      "prompt": "Which order word told us the last event?"
     }
    },
    {
     "id": "sv5-order-retell-steps",
     "title": "Order the Steps of a Good Retell",
     "skill": "Sequence the parts of an oral retell",
     "time": "6 min",
     "wida": [
      "sequence steps",
      "follow signal words"
     ],
     "directions": "Put the steps of a strong oral retell in the best order. Use the buttons; no dragging is needed.",
     "listenFor": [
      "what to do first",
      "order words",
      "the last step"
     ],
     "vocabulary": [
      [
       "beginning",
       "the first part of a story",
       "comienzo: la primera parte de una historia"
      ],
      [
       "detail",
       "a small fact that supports the main idea",
       "detalle: un dato pequeño que apoya la idea principal"
      ],
      [
       "conclusion",
       "the ending that wraps up your ideas",
       "conclusión: el final que cierra tus ideas"
      ]
     ],
     "frames": [
      "The first step is to ___.",
      "The last step is to ___."
     ],
     "type": "order",
     "prompt": "Put the steps of a strong oral retell in the best order.",
     "items": [
      {
       "id": "i1",
       "text": "Take a breath and say the topic in one sentence."
      },
      {
       "id": "i2",
       "text": "Tell what happened at the beginning."
      },
      {
       "id": "i3",
       "text": "Add details about the middle in order."
      },
      {
       "id": "i4",
       "text": "Finish with a conclusion sentence."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Strong sequencing. A clear retell names the topic, tells the beginning, adds the middle in order, and ends with a conclusion.",
     "hint": "Start with the topic. End with a sentence that wraps everything up.",
     "support": "Order words like first, next, then, and finally signal each step.",
     "extension": "Say each step aloud: 'The first step is to ___.'",
     "teacher": {
      "use": "Pre-speaking organizer; teaches the shape of a strong oral retell.",
      "function": "Sequence the parts of a spoken retell.",
      "lower": "Use movable step strips for two steps first.",
      "onLevel": "Students order all four steps independently.",
      "challenge": "Students add a fifth step about checking their answer.",
      "noTech": "Print steps as strips; students number them.",
      "prompt": "Why is the topic sentence the first step?"
     }
    },
    {
     "id": "sv5-sort-strong-weak-answers",
     "title": "Strong vs. Weak Spoken Answers",
     "skill": "Judge the quality of a spoken answer",
     "time": "6 min",
     "wida": [
      "sorting information",
      "evaluating language quality"
     ],
     "directions": "Decide if each spoken answer is Strong (full sentence with a reason) or Weak (one word or no reason). Use the buttons; no dragging is needed.",
     "listenFor": [
      "full sentences",
      "a reason",
      "details"
     ],
     "vocabulary": [
      [
       "strong answer",
       "a full sentence with details or a reason",
       "respuesta fuerte: una oración completa con detalles o una razón"
      ],
      [
       "weak answer",
       "one word or an answer with no reason",
       "respuesta débil: una palabra o una respuesta sin razón"
      ],
      [
       "evidence",
       "the detail that supports your idea",
       "evidencia: el detalle que apoya tu idea"
      ]
     ],
     "frames": [
      "This answer is ___ because ___.",
      "A strong answer needs ___."
     ],
     "type": "sort",
     "categories": [
      "Strong",
      "Weak"
     ],
     "items": [
      {
       "id": "s1",
       "text": "I like science because we do experiments.",
       "answer": "Strong"
      },
      {
       "id": "s2",
       "text": "Science.",
       "answer": "Weak"
      },
      {
       "id": "s3",
       "text": "The dog is bigger than the cat, but the cat is faster.",
       "answer": "Strong"
      },
      {
       "id": "s4",
       "text": "Good.",
       "answer": "Weak"
      },
      {
       "id": "s5",
       "text": "First I go to class, then I eat lunch.",
       "answer": "Strong"
      },
      {
       "id": "s6",
       "text": "Stuff.",
       "answer": "Weak"
      }
     ],
     "correct": "Strong sorting. Strong answers use full sentences and give a reason or detail; weak answers are one word with no reason.",
     "hint": "If the answer is one word or has no reason, it is weak.",
     "support": "Model: 'Science.' is weak. 'I like science because we do experiments.' is strong.",
     "extension": "Pick one weak answer and say a strong version aloud.",
     "teacher": {
      "use": "Self-assessment station; students learn what graders reward.",
      "function": "Evaluate spoken answers for completeness and reasons.",
      "lower": "Sort only the three clearest examples first.",
      "onLevel": "Students sort all six and explain one choice.",
      "challenge": "Students rewrite each weak answer aloud as a strong one.",
      "noTech": "Cut answers into strips and sort on desks.",
      "prompt": "What turns a weak answer into a strong one?"
     }
    },
    {
     "id": "sv5-describe-lunch-tray",
     "title": "Picture Talk: My Lunch Tray",
     "skill": "Describe items aloud with details",
     "time": "6 min",
     "wida": [
      "describing a picture",
      "listing with details"
     ],
     "directions": "Look at the lunch tray. Plan your notes, then describe what is on it aloud in full sentences.",
     "sayFor": [
      "naming words",
      "the word and",
      "a describing word"
     ],
     "vocabulary": [
      [
       "tray",
       "a flat board that holds your food",
       "bandeja: una tabla plana que sostiene tu comida"
      ],
      [
       "vegetable",
       "a plant food like carrots or beans",
       "verdura: un alimento de planta como zanahorias o frijoles"
      ],
      [
       "healthy",
       "good for your body",
       "saludable: bueno para tu cuerpo"
      ]
     ],
     "frames": [
      "On my tray there is ___ and ___.",
      "The ___ looks ___."
     ],
     "type": "constructed",
     "prompt": "Picture: 🍎🥪🥛🥕 A lunch tray with an apple, a sandwich, milk, and carrots. Describe what is on the tray. Plan, then say it aloud.",
     "adminScript": "Look at the lunch tray. Tell me what foods you see. Use the word 'and' to join your list and add one describing word.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "On my tray there is ___ and ___. The ___ looks ___.",
     "wordBank": [
      "On my tray there is",
      "and",
      "an apple",
      "a sandwich",
      "milk",
      "carrots",
      "fresh",
      "cold",
      "healthy"
     ],
     "correct": "Strong answer (model): On my tray there is a sandwich, an apple, and carrots, and there is a cold glass of milk. The apple looks fresh and healthy.",
     "hint": "List the foods with 'and,' then add one describing word.",
     "support": "Model: On my tray there is an apple and milk. The milk is cold. Say it aloud.",
     "extension": "Tell which food is the healthiest and why.",
     "teacher": {
      "use": "Quick describing warm-up; builds list-and-detail language.",
      "function": "Describe items in a picture using 'and' and adjectives.",
      "lower": "Students name two foods before speaking.",
      "onLevel": "Students list all four foods in full sentences.",
      "challenge": "Students explain which choice is healthiest.",
      "noTech": "Use a printed tray picture; describe to a partner.",
      "prompt": "Which describing word did you add?"
     }
    },
    {
     "id": "sv5-ws-picture-talk",
     "title": "Worksheet — Picture Talk Practice (Speaking)",
     "skill": "Printable practice",
     "time": "Print & do",
     "type": "worksheet",
     "directions": "Plan your spoken answers for each picture. Write notes, then practice saying each answer aloud in full sentences.",
     "wida": [
      "print-based practice",
      "rehearses describing a picture"
     ],
     "sheet": [
      {
       "heading": "Word bank",
       "items": [
        "In the picture I see …",
        "The ___ is next to / in front of / behind the ___.",
        "describing words: clean, tall, new, busy, quiet"
       ]
      },
      {
       "heading": "Plan & say",
       "items": [
        "1. Classroom picture: I see ___. The whiteboard is ___.",
        "2. Lunch tray picture: On my tray there is ___ and ___.",
        "3. Add a describing word to one sentence: The ___ looks ___.",
        "4. Say all your sentences aloud to a partner."
       ]
      }
     ]
    },
    {
     "id": "sv5-ws-compare-contrast",
     "title": "Worksheet — Compare & Contrast Talk (Speaking)",
     "skill": "Printable practice",
     "time": "Print & do",
     "type": "worksheet",
     "directions": "Plan how two things are alike and different, then practice your comparison aloud using the frames.",
     "wida": [
      "print-based practice",
      "rehearses comparison language"
     ],
     "sheet": [
      {
       "heading": "Sentence frames",
       "items": [
        "Both ___ and ___ are ___.",
        "A ___ is ___, but a ___ is ___.",
        "comparison words: bigger, smaller, faster, more, fewer, the most"
       ]
      },
      {
       "heading": "Plan & say",
       "items": [
        "1. Compare a dog and a cat. One likeness: ___. One difference: ___.",
        "2. Compare two bar graphs. Class A's favorite is ___; Class B's favorite is ___.",
        "3. Conclusion sentence: Both classes ___.",
        "4. Say your full comparison aloud."
       ]
      }
     ]
    },
    {
     "id": "sv5-ws-explain-process",
     "title": "Worksheet — Explain a Process (Speaking)",
     "skill": "Printable practice",
     "time": "Print & do",
     "type": "worksheet",
     "directions": "Plan the steps of a process in order, then practice explaining it aloud with order words and the word 'because.'",
     "wida": [
      "print-based practice",
      "rehearses sequence and cause language"
     ],
     "sheet": [
      {
       "heading": "Order & cause words",
       "items": [
        "First … Then … Next … Finally …",
        "because, so, this causes",
        "science words: evaporate, condense, precipitation"
       ]
      },
      {
       "heading": "Plan & say",
       "items": [
        "1. First, the water ___.",
        "2. Then it ___ because ___.",
        "3. Finally, ___.",
        "4. Say the whole process aloud without looking at your notes."
       ]
      }
     ]
    }
   ],
   "B": [
    {
     "id": "sv5-explain-water-cycle",
     "title": "Explain a Process: The Water Cycle",
     "skill": "Explain a process aloud in order",
     "time": "9 min",
     "wida": [
      "explaining a process",
      "using sequence and cause language"
     ],
     "directions": "Look at the water cycle diagram. Plan the steps, then explain the process aloud in order.",
     "sayFor": [
      "order words",
      "cause words like because",
      "science nouns"
     ],
     "vocabulary": [
      [
       "evaporate",
       "when water turns into a gas and rises",
       "evaporarse: cuando el agua se convierte en gas y sube"
      ],
      [
       "condense",
       "when gas cools and becomes drops of water",
       "condensarse: cuando el gas se enfría y se vuelve gotas de agua"
      ],
      [
       "precipitation",
       "rain, snow, or hail that falls from clouds",
       "precipitación: lluvia, nieve o granizo que cae de las nubes"
      ]
     ],
     "frames": [
      "First, the water ___.",
      "Then it ___ because ___.",
      "Finally, ___."
     ],
     "type": "constructed",
     "prompt": "Diagram: ☀️💧☁️🌧️ The water cycle (the sun heats water, it rises, clouds form, rain falls). Explain how the water cycle works. Plan, then say it aloud in order.",
     "adminScript": "Look at the water cycle diagram. Explain how it works, step by step. Use order words and the science words evaporate, condense, and precipitation.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "First, the water ___. Then it ___ because ___. Finally, ___.",
     "wordBank": [
      "First",
      "Then",
      "Next",
      "Finally",
      "because",
      "the sun heats the water",
      "evaporate",
      "rise",
      "condense",
      "form clouds",
      "precipitation",
      "rain falls"
     ],
     "correct": "Strong answer (model): First, the sun heats the water and it evaporates into the air. Then the water vapor rises and condenses because the air is cooler, so clouds form. Finally, precipitation like rain falls back to the ground, and the cycle begins again.",
     "hint": "Use one order word per step and the word 'because' to show cause.",
     "support": "Model: First, the sun heats the water. Then it rises and forms clouds. Finally, rain falls.",
     "extension": "Explain why the cycle never stops.",
     "teacher": {
      "use": "Content-area speaking task; integrates science vocabulary and process language.",
      "function": "Explain a multi-step science process in sequence with cause.",
      "lower": "Students use the diagram and frames with key words filled in.",
      "onLevel": "Students explain all steps using order and cause words.",
      "challenge": "Students explain the cycle without the word bank.",
      "noTech": "Use a printed labeled diagram; explain to a partner.",
      "prompt": "Where did you use the word 'because'?"
     }
    },
    {
     "id": "sv5-opinion-school-uniforms",
     "title": "Persuasive Opinion: School Uniforms",
     "skill": "State and defend an opinion aloud",
     "time": "9 min",
     "wida": [
      "giving and defending an opinion",
      "using persuasive language"
     ],
     "directions": "Decide if students should wear uniforms. Plan two reasons, then say your opinion aloud and defend it.",
     "sayFor": [
      "a clear opinion",
      "two reasons",
      "a closing sentence"
     ],
     "vocabulary": [
      [
       "persuade",
       "to make someone agree with you",
       "persuadir: hacer que alguien esté de acuerdo contigo"
      ],
      [
       "argument",
       "the reasons you give to support your opinion",
       "argumento: las razones que das para apoyar tu opinión"
      ],
      [
       "in addition",
       "a phrase that adds another reason",
       "además: una frase que agrega otra razón"
      ]
     ],
     "frames": [
      "I believe that ___.",
      "First, ___. In addition, ___.",
      "For these reasons, ___."
     ],
     "type": "constructed",
     "prompt": "Prompt: Should students wear school uniforms? Plan two reasons, then say your opinion aloud and defend it.",
     "adminScript": "Tell me your opinion about school uniforms. Should students wear them or not? Give two reasons to persuade your listener, and end with a closing sentence.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "I believe that ___. First, ___. In addition, ___. For these reasons, ___.",
     "wordBank": [
      "I believe that",
      "First",
      "In addition",
      "For these reasons",
      "students should",
      "students should not",
      "save time",
      "feel equal",
      "express themselves",
      "cost money"
     ],
     "correct": "Strong answer (model): I believe that students should wear uniforms. First, uniforms save time because everyone knows what to wear. In addition, uniforms help students feel equal, so no one is judged for their clothes. For these reasons, I think uniforms are a good idea.",
     "hint": "State your opinion clearly, give two reasons, and end with a closing sentence.",
     "support": "Model: I believe students should not wear uniforms because clothes help us express ourselves.",
     "extension": "Say one reason the other side might give, then explain why you disagree.",
     "teacher": {
      "use": "Persuasive speaking task; rehearses opinion-with-evidence structure.",
      "function": "Produce and defend an opinion with two reasons and a closing.",
      "lower": "Students choose one reason from the word bank first.",
      "onLevel": "Students give two reasons and a closing sentence.",
      "challenge": "Students address and rebut the opposing view.",
      "noTech": "Partners debate; each gives two reasons aloud.",
      "prompt": "Which phrase added your second reason?"
     }
    },
    {
     "id": "sv5-compare-graphs",
     "title": "Compare Two Bar Graphs",
     "skill": "Compare data aloud using academic language",
     "time": "9 min",
     "wida": [
      "comparing data",
      "using comparative and superlative language"
     ],
     "directions": "Look at the two bar graphs of favorite sports. Plan what is alike and different, then compare them aloud.",
     "sayFor": [
      "comparison words",
      "data numbers",
      "a conclusion"
     ],
     "vocabulary": [
      [
       "data",
       "facts and numbers you collect",
       "datos: hechos y números que recopilas"
      ],
      [
       "the most",
       "the largest amount",
       "el más: la mayor cantidad"
      ],
      [
       "fewer",
       "a smaller number than another",
       "menos: un número más pequeño que otro"
      ]
     ],
     "frames": [
      "In Class A, the most popular sport is ___.",
      "Class B has ___ than Class A.",
      "Both classes ___."
     ],
     "type": "constructed",
     "prompt": "Graphs: 📊 Class A (soccer 12, basketball 8, tennis 4) and 📊 Class B (soccer 6, basketball 10, tennis 9). Compare the two graphs. Plan, then say your comparison aloud.",
     "adminScript": "Look at the two bar graphs about favorite sports. Tell me one way the classes are alike and one way they are different. Use comparison words and the numbers from the graphs.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "In Class A, the most popular sport is ___. Class B has ___ than Class A. Both classes ___.",
     "wordBank": [
      "In Class A",
      "In Class B",
      "the most popular",
      "the fewest",
      "more",
      "fewer",
      "than",
      "both classes",
      "soccer",
      "basketball",
      "tennis"
     ],
     "correct": "Strong answer (model): In Class A, the most popular sport is soccer with 12 votes. In Class B, basketball is the most popular with 10 votes, so Class B has fewer soccer fans than Class A. Both classes like all three sports, but they do not agree on the favorite.",
     "hint": "Name the most popular sport in each class, then compare the numbers with 'more' or 'fewer.'",
     "support": "Model: In Class A, soccer is the most popular. Class B likes basketball more. Both classes play three sports.",
     "extension": "Tell which sport you would add to both graphs and why.",
     "teacher": {
      "use": "Data-talk speaking task; connects math content to comparison language.",
      "function": "Compare two data sets using comparatives and superlatives.",
      "lower": "Give students the two top sports before speaking.",
      "onLevel": "Students compare using numbers and comparison words.",
      "challenge": "Students draw a conclusion about both classes.",
      "noTech": "Use two printed bar graphs; compare with a partner.",
      "prompt": "Which word showed a difference in the numbers?"
     }
    },
    {
     "id": "sv5-retell-story-problem",
     "title": "Retell and Explain a Word Problem",
     "skill": "Restate a problem and explain a solution aloud",
     "time": "9 min",
     "wida": [
      "restating a problem",
      "explaining reasoning aloud"
     ],
     "directions": "Read the word problem. Plan how to restate it and explain your steps, then say your answer aloud.",
     "sayFor": [
      "the question in your own words",
      "order words",
      "the answer with units"
     ],
     "vocabulary": [
      [
       "restate",
       "say something again in your own words",
       "reformular: decir algo otra vez con tus palabras"
      ],
      [
       "operation",
       "adding, subtracting, multiplying, or dividing",
       "operación: sumar, restar, multiplicar o dividir"
      ],
      [
       "reasonable",
       "an answer that makes sense",
       "razonable: una respuesta que tiene sentido"
      ]
     ],
     "frames": [
      "The problem asks me to ___.",
      "First, I ___. Then, I ___.",
      "The answer is ___ because ___."
     ],
     "type": "constructed",
     "prompt": "Word problem: A class buys 6 boxes of markers. Each box has 8 markers. How many markers in all? Restate the problem, then explain how you solve it. Plan, then say it aloud.",
     "adminScript": "Read the word problem about markers. First, say what the problem is asking in your own words. Then explain step by step how you find the answer. End by saying the answer with the correct unit.",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "The problem asks me to ___. First, I ___. Then, I ___. The answer is ___ because ___.",
     "wordBank": [
      "The problem asks me to",
      "First",
      "Then",
      "multiply",
      "6 boxes",
      "8 markers",
      "groups of",
      "the answer is",
      "48 markers",
      "because"
     ],
     "correct": "Strong answer (model): The problem asks me to find how many markers there are in all. First, I see there are 6 boxes with 8 markers in each box. Then I multiply 6 times 8. The answer is 48 markers because 6 groups of 8 make 48.",
     "hint": "Restate the question first, then explain the operation you used.",
     "support": "Model: The problem asks for the total markers. I multiply 6 times 8. The answer is 48 markers.",
     "extension": "Explain how you know your answer is reasonable.",
     "teacher": {
      "use": "Math-talk speaking task; rehearses restating and explaining reasoning.",
      "function": "Restate a problem and explain a solution path aloud.",
      "lower": "Students restate the question only, then say the operation.",
      "onLevel": "Students restate and explain all steps with the unit.",
      "challenge": "Students explain why the answer is reasonable.",
      "noTech": "Students explain the steps to a partner using the frames.",
      "prompt": "What operation did you choose, and why?"
     }
    },
    {
     "id": "sv5-order-presentation-parts",
     "title": "Order the Parts of a Class Presentation",
     "skill": "Sequence the parts of an oral presentation",
     "time": "6 min",
     "wida": [
      "sequence steps",
      "organize an oral text"
     ],
     "directions": "Put the parts of a strong class presentation in the best order. Use the buttons; no dragging is needed.",
     "listenFor": [
      "the greeting",
      "the main points",
      "the closing"
     ],
     "vocabulary": [
      [
       "introduction",
       "the opening that tells your topic",
       "introducción: la apertura que dice tu tema"
      ],
      [
       "main point",
       "an important idea you explain",
       "punto principal: una idea importante que explicas"
      ],
      [
       "closing",
       "the ending that thanks the audience",
       "cierre: el final que agradece al público"
      ]
     ],
     "frames": [
      "The presentation should start with ___.",
      "It should end with ___."
     ],
     "type": "order",
     "prompt": "Put the parts of a strong class presentation in the best order.",
     "items": [
      {
       "id": "p1",
       "text": "Greet the audience and say your topic."
      },
      {
       "id": "p2",
       "text": "Explain your first main point with a detail."
      },
      {
       "id": "p3",
       "text": "Explain your second main point with a detail."
      },
      {
       "id": "p4",
       "text": "Give a closing and thank the audience."
      }
     ],
     "answer": [
      "p1",
      "p2",
      "p3",
      "p4"
     ],
     "correct": "Strong sequencing. A clear presentation greets the audience, gives main points with details, and ends with a closing.",
     "hint": "Start with a greeting and topic. End by thanking the audience.",
     "support": "Signal words like first and finally help order an oral presentation.",
     "extension": "Say the greeting aloud: 'Hello, today my topic is ___.'",
     "teacher": {
      "use": "Pre-presentation organizer; teaches oral text structure.",
      "function": "Sequence the parts of a spoken presentation.",
      "lower": "Order the greeting and closing first.",
      "onLevel": "Students order all four parts independently.",
      "challenge": "Students add a third main point and reorder.",
      "noTech": "Print parts as strips; students number them.",
      "prompt": "Why does the greeting come first?"
     }
    },
    {
     "id": "sv5-sort-formal-informal",
     "title": "Sort: Formal vs. Casual School Talk",
     "skill": "Choose the right register for speaking",
     "time": "7 min",
     "wida": [
      "sorting information",
      "matching language to audience"
     ],
     "directions": "Decide if each sentence is Formal (for a teacher or presentation) or Casual (for a friend). Use the buttons; no dragging is needed.",
     "listenFor": [
      "polite words",
      "slang",
      "who is listening"
     ],
     "vocabulary": [
      [
       "formal",
       "polite language for school or adults",
       "formal: lenguaje cortés para la escuela o los adultos"
      ],
      [
       "casual",
       "relaxed language for friends",
       "informal: lenguaje relajado para los amigos"
      ],
      [
       "audience",
       "the people who listen to you",
       "público: las personas que te escuchan"
      ]
     ],
     "frames": [
      "This sentence is ___ because ___.",
      "I would say this to ___."
     ],
     "type": "sort",
     "categories": [
      "Formal",
      "Casual"
     ],
     "items": [
      {
       "id": "f1",
       "text": "May I please present my project now?",
       "answer": "Formal"
      },
      {
       "id": "f2",
       "text": "Hey, check this out!",
       "answer": "Casual"
      },
      {
       "id": "f3",
       "text": "Thank you for listening to my report.",
       "answer": "Formal"
      },
      {
       "id": "f4",
       "text": "That test was super easy, no big deal.",
       "answer": "Casual"
      },
      {
       "id": "f5",
       "text": "In conclusion, the data shows a clear pattern.",
       "answer": "Formal"
      },
      {
       "id": "f6",
       "text": "Yeah, whatever works for you.",
       "answer": "Casual"
      }
     ],
     "correct": "Strong sorting. Formal sentences use polite, academic words for teachers or presentations; casual sentences use relaxed words for friends.",
     "hint": "If you would say it to a teacher or in a presentation, it is formal.",
     "support": "Model: 'May I please present?' is formal. 'Hey, check this out!' is casual.",
     "extension": "Pick one casual sentence and say a formal version aloud.",
     "teacher": {
      "use": "Register-awareness station before formal speaking tasks.",
      "function": "Match spoken language to the audience and setting.",
      "lower": "Sort the three clearest examples first.",
      "onLevel": "Students sort all six and explain one choice.",
      "challenge": "Students turn each casual line into a formal one aloud.",
      "noTech": "Cut sentences into strips and sort on desks.",
      "prompt": "How does your audience change the way you speak?"
     }
    },
    {
     "id": "sv5-describe-science-experiment",
     "title": "Picture Talk: A Science Experiment",
     "skill": "Describe and explain a picture aloud",
     "time": "8 min",
     "wida": [
      "describing a picture",
      "explaining what is happening"
     ],
     "directions": "Look at the experiment picture. Plan what you see and what is happening, then describe it aloud.",
     "sayFor": [
      "naming words",
      "an action word",
      "the word because"
     ],
     "vocabulary": [
      [
       "experiment",
       "a test to learn something new",
       "experimento: una prueba para aprender algo nuevo"
      ],
      [
       "observe",
       "to watch carefully",
       "observar: mirar con cuidado"
      ],
      [
       "measure",
       "to find the size or amount",
       "medir: encontrar el tamaño o la cantidad"
      ]
     ],
     "frames": [
      "In the picture, the student is ___.",
      "She uses the ___ to ___ because ___."
     ],
     "type": "constructed",
     "prompt": "Picture: 🧪🔬🥽📏 A student in goggles uses a beaker, a microscope, and a ruler in a lab. Describe what you see and what is happening. Plan, then say it aloud.",
     "adminScript": "Look at the science experiment picture. Tell me what you see and what the student is doing. Use an action word and explain why with the word 'because.'",
     "responseLabel": "Planning notes (then say your answer aloud)",
     "responsePlaceholder": "In the picture, the student is ___. She uses the ___ to ___ because ___.",
     "wordBank": [
      "In the picture",
      "the student is",
      "goggles",
      "a beaker",
      "a microscope",
      "a ruler",
      "observe",
      "measure",
      "mix",
      "to stay safe",
      "because"
     ],
     "correct": "Strong answer (model): In the picture, the student is doing an experiment in the lab. She wears goggles to stay safe, and she uses the microscope to observe a sample and the ruler to measure it because she needs accurate data.",
     "hint": "Name what you see, say the action, then explain why with 'because.'",
     "support": "Model: The student wears goggles. She uses a microscope to observe. Say it aloud.",
     "extension": "Predict what the student will do next and say it aloud.",
     "teacher": {
      "use": "Content-rich picture-talk; integrates lab vocabulary with explanation.",
      "function": "Describe a picture and explain actions with cause language.",
      "lower": "Students name the tools before speaking.",
      "onLevel": "Students describe and explain with 'because.'",
      "challenge": "Students predict the next step and justify it.",
      "noTech": "Use a printed lab picture; describe to a partner.",
      "prompt": "Why does the student wear goggles?"
     }
    }
   ]
  },
  "Writing": {
   "A": [
    {
     "id": "wv5-a-sentence-school-rule",
     "title": "One Sentence About a School Rule",
     "skill": "Write one complete opinion sentence",
     "time": "8 min",
     "wida": [
      "writing one complete sentence",
      "using a frame to give an opinion"
     ],
     "directions": "Read the prompt. Write one complete sentence that gives your opinion. Use the frame and end with a period. Try to write at least 12 words.",
     "sayFor": [
      "a naming part",
      "an opinion word",
      "a reason with because"
     ],
     "vocabulary": [
      [
       "opinion",
       "what you think or feel",
       "opinión: lo que piensas o sientes"
      ],
      [
       "rule",
       "something you must follow",
       "regla: algo que debes seguir"
      ],
      [
       "because",
       "the word that gives a reason",
       "porque: la palabra que da una razón"
      ]
     ],
     "frames": [
      "I think the rule about ___ is ___ because ___."
     ],
     "wordBank": [
      "important",
      "fair",
      "helpful",
      "because",
      "I think",
      "rule"
     ],
     "type": "constructed",
     "prompt": "Prompt: Choose one school rule. Write one complete sentence that tells your opinion of the rule and gives a reason.",
     "responseLabel": "Your one-sentence opinion",
     "responsePlaceholder": "I think the rule about ___ is ___ because ___.",
     "correct": "Strong response: I think the rule about phones is helpful because it lets students focus on learning.",
     "hint": "Use the frame. Put your reason after the word because and end with a period.",
     "support": "Model: I think the rule about hallways is fair because it keeps everyone safe.",
     "extension": "Add one more describing word to make your sentence stronger.",
     "teacher": {
      "use": "Short opinion-writing warm-up before ACCESS practice.",
      "function": "Write one complete opinion sentence with a reason.",
      "lower": "Students fill in the frame blanks first.",
      "onLevel": "Students write the sentence without looking at the frame.",
      "challenge": "Students add a second sentence with another reason.",
      "noTech": "Write the sentence on a graphic organizer.",
      "prompt": "Where is your reason in the sentence?"
     }
    },
    {
     "id": "wv5-a-cloze-because",
     "title": "Finish the Reason Sentence",
     "skill": "Choose the best word to complete a sentence",
     "time": "7 min",
     "wida": [
      "completing an academic sentence",
      "choosing the best word"
     ],
     "directions": "Read the sentence. Choose the best word for each blank so the sentence makes sense.",
     "sayFor": [
      "a linking word",
      "a reason",
      "a clear opinion"
     ],
     "vocabulary": [
      [
       "reason",
       "why you think something",
       "razón: por qué piensas algo"
      ],
      [
       "library",
       "the room with books",
       "biblioteca: el salón con libros"
      ],
      [
       "quiet",
       "not loud",
       "silencioso: que no hace ruido"
      ]
     ],
     "frames": [
      "I like ___ because it is ___."
     ],
     "wordBank": [
      "because",
      "quiet",
      "loud",
      "fun"
     ],
     "type": "cloze",
     "prompt": "Complete the sentence about a favorite school place.",
     "segments": [
      {
       "text": "I like to read in the library "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "because",
        "options": [
         "because",
         "before",
         "behind"
        ]
       }
      },
      {
       "text": " it is "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "quiet",
        "options": [
         "quiet",
         "loud",
         "fast"
        ]
       }
      },
      {
       "text": " and I can think clearly."
      }
     ],
     "correct": "Correct. The word because gives the reason, and quiet describes the library.",
     "hint": "Which word tells a reason? Which word describes a calm, low-sound room?",
     "support": "Because signals a reason. A library is usually a quiet place to read.",
     "extension": "Write your own sentence using because and one describing word.",
     "teacher": {
      "use": "Bridge activity into independent sentence writing.",
      "function": "Use reason and describing words in a complete sentence.",
      "lower": "Read each option aloud before students choose.",
      "onLevel": "Students complete independently.",
      "challenge": "Students rewrite the sentence about a different place.",
      "noTech": "Print and circle the best word.",
      "prompt": "How does the word because help the reader?"
     }
    },
    {
     "id": "wv5-a-order-morning",
     "title": "Build a Paragraph: My School Morning",
     "skill": "Order sentences to build a paragraph",
     "time": "8 min",
     "wida": [
      "ordering sentences into a paragraph",
      "using sequence words"
     ],
     "directions": "Put the sentences in order to make a paragraph about a school morning. Use the buttons to move each sentence.",
     "sayFor": [
      "a topic sentence",
      "sequence words",
      "a closing sentence"
     ],
     "vocabulary": [
      [
       "first",
       "the beginning step",
       "primero: el paso del comienzo"
      ],
      [
       "then",
       "the next step",
       "luego: el siguiente paso"
      ],
      [
       "finally",
       "the last step",
       "finalmente: el último paso"
      ]
     ],
     "frames": [
      "First I ___. Then I ___. Finally I ___."
     ],
     "wordBank": [
      "first",
      "then",
      "next",
      "finally"
     ],
     "type": "order",
     "prompt": "Put the sentences in order to build a clear paragraph about a school morning.",
     "items": [
      {
       "id": "i1",
       "text": "Every school morning follows the same simple routine."
      },
      {
       "id": "i2",
       "text": "First, I pack my backpack and check my homework."
      },
      {
       "id": "i3",
       "text": "Then, I eat breakfast and walk to the bus stop."
      },
      {
       "id": "i4",
       "text": "Finally, I arrive at school and get ready to learn."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Correct. The topic sentence comes first, then the steps in order, and the closing sentence last.",
     "hint": "Find the sentence that names the topic. Then follow the order words first, then, finally.",
     "support": "A paragraph starts with a topic sentence and uses sequence words to keep order.",
     "extension": "Add one more sentence using the word next.",
     "teacher": {
      "use": "Paragraph-structure mini-lesson.",
      "function": "Sequence sentences into a coherent paragraph.",
      "lower": "Use printed sentence strips to move first.",
      "onLevel": "Students order on screen.",
      "challenge": "Students rewrite the paragraph about an afternoon routine.",
      "noTech": "Cut sentences into strips and arrange on the desk.",
      "prompt": "Which sentence tells the reader what the paragraph is about?"
     }
    },
    {
     "id": "wv5-a-sort-paragraph-parts",
     "title": "Sort the Paragraph Parts",
     "skill": "Identify topic, detail, and closing sentences",
     "time": "7 min",
     "wida": [
      "classifying sentence functions",
      "understanding paragraph structure"
     ],
     "directions": "Read each sentence. Choose whether it is a Topic, a Detail, or a Closing sentence. Use the buttons; no dragging is needed.",
     "sayFor": [
      "a main idea",
      "a supporting fact",
      "a wrap-up sentence"
     ],
     "vocabulary": [
      [
       "topic",
       "the main idea",
       "tema: la idea principal"
      ],
      [
       "detail",
       "a small supporting fact",
       "detalle: un dato pequeño que apoya"
      ],
      [
       "closing",
       "the last sentence that wraps up",
       "cierre: la última oración que concluye"
      ]
     ],
     "frames": [
      "This is a ___ sentence because it ___."
     ],
     "wordBank": [
      "topic",
      "detail",
      "closing",
      "main idea"
     ],
     "type": "sort",
     "categories": [
      "Topic",
      "Detail",
      "Closing"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Recess is the best part of my school day.",
       "answer": "Topic"
      },
      {
       "id": "s2",
       "text": "I play soccer with my friends on the field.",
       "answer": "Detail"
      },
      {
       "id": "s3",
       "text": "We also talk and laugh near the benches.",
       "answer": "Detail"
      },
      {
       "id": "s4",
       "text": "That is why recess helps me feel happy and ready to learn.",
       "answer": "Closing"
      }
     ],
     "correct": "Strong sorting. The topic names the main idea, details support it, and the closing wraps it up.",
     "hint": "The topic comes first and names the big idea. The closing often starts with that is why.",
     "support": "A topic sentence gives the main idea; details add facts; a closing finishes the paragraph.",
     "extension": "Write one new detail sentence for this paragraph.",
     "teacher": {
      "use": "Structure-awareness station before writing a full paragraph.",
      "function": "Classify sentences by their job in a paragraph.",
      "lower": "Sort only the topic and closing first.",
      "onLevel": "Students sort all four independently.",
      "challenge": "Students add their own detail and label it.",
      "noTech": "Sort sentence strips into three columns on a desk.",
      "prompt": "How do you know which sentence is the closing?"
     }
    },
    {
     "id": "wv5-a-constructed-thank-you",
     "title": "Write a Short Thank-You Note",
     "skill": "Write a short note with a greeting and reason",
     "time": "9 min",
     "wida": [
      "writing a short note",
      "using polite academic language"
     ],
     "directions": "Write a short thank-you note to a teacher. Include a greeting, one reason, and a closing. Try to write at least 20 words.",
     "sayFor": [
      "a greeting",
      "a reason",
      "a closing"
     ],
     "vocabulary": [
      [
       "greeting",
       "the hello at the start",
       "saludo: el hola al comienzo"
      ],
      [
       "thank",
       "to show you are grateful",
       "agradecer: mostrar que estás agradecido"
      ],
      [
       "closing",
       "the goodbye at the end",
       "despedida: el adiós al final"
      ]
     ],
     "frames": [
      "Dear ___,",
      "Thank you for ___ because ___.",
      "Sincerely, ___"
     ],
     "wordBank": [
      "Dear",
      "Thank you",
      "because",
      "Sincerely",
      "helped"
     ],
     "type": "constructed",
     "prompt": "Prompt: Write a short thank-you note to a teacher. Tell what they did and why it helped you.",
     "responseLabel": "Your thank-you note",
     "responsePlaceholder": "Dear ___, Thank you for ___ because ___. Sincerely, ___",
     "correct": "Strong response: Dear Ms. Lee, Thank you for helping me with fractions because now I understand them better. Sincerely, Ana.",
     "hint": "Start with Dear, give one reason with because, and end with Sincerely.",
     "support": "Model: Dear Mr. Diaz, Thank you for the extra practice because it made the test easier. Sincerely, Sam.",
     "extension": "Add one more sentence telling how you feel now.",
     "teacher": {
      "use": "Introduce note format and polite register.",
      "function": "Write a short note with greeting, reason, and closing.",
      "lower": "Students fill the three frame lines.",
      "onLevel": "Students write the note with the frame nearby.",
      "challenge": "Students add a second reason sentence.",
      "noTech": "Write the note on note-card paper.",
      "prompt": "Which line tells the reason?"
     }
    },
    {
     "id": "wv5-a-cloze-narrative",
     "title": "Finish the Story Sentence",
     "skill": "Choose words that fit a narrative sentence",
     "time": "7 min",
     "wida": [
      "completing a narrative sentence",
      "using time and feeling words"
     ],
     "directions": "Read the story sentence. Choose the best word for each blank.",
     "sayFor": [
      "a time word",
      "a feeling word",
      "a clear action"
     ],
     "vocabulary": [
      [
       "nervous",
       "worried or scared",
       "nervioso: preocupado o con miedo"
      ],
      [
       "finally",
       "at last",
       "finalmente: por fin"
      ],
      [
       "smiled",
       "made a happy face",
       "sonrió: puso cara feliz"
      ]
     ],
     "frames": [
      "At first I felt ___, but ___ I ___."
     ],
     "wordBank": [
      "nervous",
      "finally",
      "smiled"
     ],
     "type": "cloze",
     "prompt": "Complete the sentence from a short school story.",
     "segments": [
      {
       "text": "On the first day of school I felt "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "nervous",
        "options": [
         "nervous",
         "hungry",
         "tall"
        ]
       }
      },
      {
       "text": ", but "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "finally",
        "options": [
         "finally",
         "slowly",
         "never"
        ]
       }
      },
      {
       "text": " I made a friend and "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "smiled",
        "options": [
         "smiled",
         "ran",
         "ate"
        ]
       }
      },
      {
       "text": "."
      }
     ],
     "correct": "Correct. Nervous tells the feeling, finally tells the time change, and smiled shows the happy ending.",
     "hint": "Which word names a worried feeling? Which word means at last?",
     "support": "Stories often show a feeling at the start that changes by the end.",
     "extension": "Write one more sentence telling what happened next.",
     "teacher": {
      "use": "Model narrative feeling-change before writing.",
      "function": "Use feeling and time words in a narrative sentence.",
      "lower": "Read options aloud and act out the feelings.",
      "onLevel": "Students complete independently.",
      "challenge": "Students write a two-sentence mini story.",
      "noTech": "Print and circle the best words.",
      "prompt": "How did the feeling change in the sentence?"
     }
    },
    {
     "id": "wv5-a-sort-fact-opinion",
     "title": "Sort: Fact or Opinion",
     "skill": "Tell facts from opinions before writing",
     "time": "7 min",
     "wida": [
      "distinguishing fact from opinion",
      "preparing to write an opinion"
     ],
     "directions": "Read each sentence. Decide if it is a Fact (it can be checked) or an Opinion (what someone thinks). Use the buttons.",
     "sayFor": [
      "words that can be proven",
      "feeling or thinking words",
      "the difference between the two"
     ],
     "vocabulary": [
      [
       "fact",
       "something true that can be checked",
       "hecho: algo verdadero que se puede comprobar"
      ],
      [
       "opinion",
       "what someone thinks or feels",
       "opinión: lo que alguien piensa o siente"
      ],
      [
       "proof",
       "something that shows it is true",
       "prueba: algo que muestra que es verdad"
      ]
     ],
     "frames": [
      "This is a ___ because ___."
     ],
     "wordBank": [
      "fact",
      "opinion",
      "I think",
      "best"
     ],
     "type": "sort",
     "categories": [
      "Fact",
      "Opinion"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Our school day starts at 8:00 in the morning.",
       "answer": "Fact"
      },
      {
       "id": "s2",
       "text": "The cafeteria pizza is the best food at school.",
       "answer": "Opinion"
      },
      {
       "id": "s3",
       "text": "The library has more than one thousand books.",
       "answer": "Fact"
      },
      {
       "id": "s4",
       "text": "I think gym class should be longer every day.",
       "answer": "Opinion"
      }
     ],
     "correct": "Strong sorting. Facts can be checked or counted; opinions tell what someone thinks or likes.",
     "hint": "Words like best, should, and I think often signal an opinion.",
     "support": "A fact can be proven. An opinion shows a feeling or a judgment.",
     "extension": "Write one fact and one opinion about your classroom.",
     "teacher": {
      "use": "Pre-writing sort before an opinion paragraph.",
      "function": "Classify statements as fact or opinion.",
      "lower": "Sort two clear examples first.",
      "onLevel": "Students sort all four independently.",
      "challenge": "Students turn one fact into an opinion sentence.",
      "noTech": "Sort sentence strips into two columns.",
      "prompt": "Which clue word told you it was an opinion?"
     }
    },
    {
     "id": "wv5-ws-persuasive-letter",
     "title": "Worksheet: Plan a Persuasive Letter",
     "skill": "Printable practice",
     "time": "20-25 min",
     "type": "worksheet",
     "directions": "Use this worksheet to plan and write a persuasive letter to a school leader. Complete each part. Use the word bank and frames to help you.",
     "wida": [
      "print-based practice"
     ],
     "sheet": [
      {
       "heading": "Word bank",
       "items": [
        "I believe",
        "because",
        "First",
        "Second",
        "respectfully",
        "request"
       ]
      },
      {
       "heading": "Step 1: Choose Your Topic and Claim",
       "items": [
        "Pick one school change you want. Write your claim in one clear sentence.",
        "My claim: I believe that ___.",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 2: List Two Reasons",
       "items": [
        "Write two reasons that support your claim. Each reason should use the word because.",
        "Reason 1: ___ because ___. Reason 2: ___ because ___.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 3: Write the Full Letter",
       "items": [
        "Use your claim and reasons to write the complete letter. Include a greeting, two reasons, a polite request, and a closing.",
        "Write at least 45 words.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Check your work",
       "items": [
        "☐ I started with a greeting.",
        "☐ I stated a clear claim.",
        "☐ I gave two reasons using because.",
        "☐ I ended with a polite request and closing."
       ]
      }
     ]
    },
    {
     "id": "wv5-ws-informational-paragraph",
     "title": "Worksheet: Build an Informational Paragraph",
     "skill": "Printable practice",
     "time": "20-25 min",
     "type": "worksheet",
     "directions": "Use this worksheet to plan and write an informational paragraph that explains a process. Complete each part in order.",
     "wida": [
      "print-based practice"
     ],
     "sheet": [
      {
       "heading": "Word bank",
       "items": [
        "First",
        "Next",
        "Then",
        "Finally",
        "topic sentence",
        "closing"
       ]
      },
      {
       "heading": "Step 1: Write a Topic Sentence",
       "items": [
        "Name the process you will explain in one sentence.",
        "Topic sentence: ___ happens in a few clear steps.",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 2: List the Steps in Order",
       "items": [
        "Write three steps using First, Next, and Then.",
        "First, ___. Next, ___. Then, ___.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 3: Write the Full Paragraph",
       "items": [
        "Combine your topic sentence, steps, and a closing into one paragraph.",
        "Write at least 50 words.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Check your work",
       "items": [
        "☐ I wrote a clear topic sentence.",
        "☐ I used sequence words for each step.",
        "☐ My steps are in the correct order.",
        "☐ I ended with a closing sentence."
       ]
      }
     ]
    },
    {
     "id": "wv5-ws-narrative-paragraph",
     "title": "Worksheet: Write a Short Narrative",
     "skill": "Printable practice",
     "time": "20-25 min",
     "type": "worksheet",
     "directions": "Use this worksheet to plan and write a short narrative with a beginning, middle, and end. Complete each part.",
     "wida": [
      "print-based practice"
     ],
     "sheet": [
      {
       "heading": "Word bank",
       "items": [
        "One day",
        "problem",
        "decided",
        "finally",
        "felt",
        "because"
       ]
      },
      {
       "heading": "Step 1: Set the Scene",
       "items": [
        "Tell where and when your story happens.",
        "One day, ___.",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 2: Name the Problem and Solution",
       "items": [
        "Write the problem and how you solved it.",
        "The problem was that ___. To solve it, I ___.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Step 3: Write the Full Narrative",
       "items": [
        "Combine the beginning, middle, and end into one short story with a feeling at the end.",
        "Write at least 50 words.",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________",
        "______________________________"
       ]
      },
      {
       "heading": "Check your work",
       "items": [
        "☐ I set the scene with where and when.",
        "☐ I named a clear problem.",
        "☐ I showed how the problem was solved.",
        "☐ I ended with a feeling and a reason."
       ]
      }
     ]
    }
   ],
   "B": [
    {
     "id": "wv5-b-constructed-persuasive-letter",
     "title": "Persuasive Letter: Longer Lunch",
     "skill": "Write a short persuasive paragraph with reasons",
     "time": "12 min",
     "wida": [
      "writing a persuasive paragraph",
      "supporting a claim with reasons"
     ],
     "directions": "Write a short persuasive letter to the principal. State your opinion, give two reasons, and end with a polite request. Try to write at least 45 words.",
     "sayFor": [
      "a clear claim",
      "two reasons with because",
      "a polite closing"
     ],
     "vocabulary": [
      [
       "persuade",
       "to make someone agree with you",
       "persuadir: hacer que alguien esté de acuerdo"
      ],
      [
       "claim",
       "the opinion you want to prove",
       "afirmación: la opinión que quieres demostrar"
      ],
      [
       "request",
       "asking for something politely",
       "petición: pedir algo con cortesía"
      ]
     ],
     "frames": [
      "Dear Principal ___,",
      "I believe that ___.",
      "First, ___ because ___. Second, ___ because ___.",
      "For these reasons, I respectfully ask that ___."
     ],
     "wordBank": [
      "I believe",
      "because",
      "First",
      "Second",
      "respectfully",
      "request"
     ],
     "type": "constructed",
     "prompt": "Prompt: Write a persuasive letter to your principal arguing for a longer lunch period. Give two clear reasons.",
     "responseLabel": "Your persuasive letter",
     "responsePlaceholder": "Dear Principal ___, I believe that ___ . First, ___ because ___ . Second, ___ because ___ . For these reasons, I respectfully ask that ___ .",
     "correct": "Strong response: Dear Principal Ortiz, I believe lunch should be longer. First, students need time to eat fully because rushing is unhealthy. Second, a longer break helps us focus in afternoon classes because our minds rest. For these reasons, I respectfully ask that you add ten minutes to lunch.",
     "hint": "State your claim, then use First and Second with because to give two reasons.",
     "support": "Model: I believe recess should be longer. First, exercise helps us learn because movement wakes up the brain. Second, fresh air reduces stress because students relax.",
     "extension": "Add a sentence that answers what someone who disagrees might say.",
     "teacher": {
      "use": "Core persuasive-writing task for ACCESS practice.",
      "function": "Write a claim supported by two reasons.",
      "lower": "Students complete the four frame lines.",
      "onLevel": "Students write with the frame as a checklist.",
      "challenge": "Students add a counterargument sentence.",
      "noTech": "Draft the letter on lined paper.",
      "prompt": "Which reason is your strongest, and why?"
     }
    },
    {
     "id": "wv5-b-constructed-informational",
     "title": "Informational Paragraph: How a Plant Grows",
     "skill": "Write an informational paragraph from a word bank",
     "time": "12 min",
     "wida": [
      "writing an informational paragraph",
      "using sequence and science vocabulary"
     ],
     "directions": "Write an informational paragraph explaining how a plant grows. Use a topic sentence, three steps in order, and a closing. Try to write at least 50 words.",
     "sayFor": [
      "a topic sentence",
      "sequence words",
      "science vocabulary"
     ],
     "vocabulary": [
      [
       "seed",
       "the part a plant grows from",
       "semilla: la parte de donde crece la planta"
      ],
      [
       "sprout",
       "to begin to grow",
       "brotar: comenzar a crecer"
      ],
      [
       "sunlight",
       "light from the sun",
       "luz solar: la luz del sol"
      ]
     ],
     "frames": [
      "A plant grows in several clear steps.",
      "First, ___. Next, ___. Then, ___.",
      "In the end, ___."
     ],
     "wordBank": [
      "seed",
      "soil",
      "water",
      "sunlight",
      "sprout",
      "First",
      "Next",
      "Then"
     ],
     "type": "constructed",
     "prompt": "Prompt: Explain how a plant grows from a seed. Write the steps in order using science words.",
     "responseLabel": "Your informational paragraph",
     "responsePlaceholder": "A plant grows in several clear steps. First, ___ . Next, ___ . Then, ___ . In the end, ___ .",
     "correct": "Strong response: A plant grows in several clear steps. First, a seed is planted in soil and given water. Next, the seed sprouts and a small root grows down. Then, with sunlight the stem and leaves grow up toward the light. In the end, the plant is fully grown and may make new seeds.",
     "hint": "Begin with a topic sentence, then explain the steps with First, Next, and Then.",
     "support": "Model: First, the seed gets water. Next, it sprouts. Then, sunlight helps the leaves grow.",
     "extension": "Add one sentence telling why sunlight is important.",
     "teacher": {
      "use": "Informational writing practice tied to science content.",
      "function": "Sequence an informational process in a paragraph.",
      "lower": "Students complete the frame with the word bank.",
      "onLevel": "Students write with the frame as a guide.",
      "challenge": "Students add a sentence about what a plant needs to stay alive.",
      "noTech": "Draft on a sequence graphic organizer.",
      "prompt": "Which sequence words kept your steps clear?"
     }
    },
    {
     "id": "wv5-b-constructed-narrative",
     "title": "Narrative: A Time I Solved a Problem",
     "skill": "Write a short narrative with a beginning, middle, and end",
     "time": "12 min",
     "wida": [
      "writing a short narrative",
      "using time order and feeling words"
     ],
     "directions": "Write a short narrative about a time you solved a problem at school. Include a beginning, a middle, and an end. Try to write at least 50 words.",
     "sayFor": [
      "a setting",
      "a problem",
      "how it was solved"
     ],
     "vocabulary": [
      [
       "narrative",
       "a story about events",
       "narración: una historia sobre sucesos"
      ],
      [
       "problem",
       "something that is hard or wrong",
       "problema: algo difícil o incorrecto"
      ],
      [
       "solution",
       "the way a problem is fixed",
       "solución: la manera de arreglar un problema"
      ]
     ],
     "frames": [
      "One day at school, ___.",
      "The problem was that ___.",
      "To solve it, I ___.",
      "In the end, I felt ___ because ___."
     ],
     "wordBank": [
      "One day",
      "problem",
      "decided",
      "finally",
      "felt",
      "because"
     ],
     "type": "constructed",
     "prompt": "Prompt: Write a short story about a time you solved a problem at school. Tell what happened and how you felt.",
     "responseLabel": "Your short narrative",
     "responsePlaceholder": "One day at school, ___ . The problem was that ___ . To solve it, I ___ . In the end, I felt ___ because ___ .",
     "correct": "Strong response: One day at school, I forgot my homework at home. The problem was that it was due that morning. To solve it, I asked my teacher if I could email it during lunch. In the end, I felt relieved because I learned to pack my backpack the night before.",
     "hint": "Set the scene, name the problem, show how you solved it, and tell how you felt.",
     "support": "Model: One day I could not find my locker. The problem was that I would be late. To solve it, I asked a teacher. In the end, I felt calm.",
     "extension": "Add one sentence of dialogue using quotation marks.",
     "teacher": {
      "use": "Narrative writing practice with clear structure.",
      "function": "Write a narrative with a problem and solution.",
      "lower": "Students complete the four frame lines.",
      "onLevel": "Students write with the frame nearby.",
      "challenge": "Students add dialogue and a sensory detail.",
      "noTech": "Draft on a beginning-middle-end organizer.",
      "prompt": "Where in your story does the problem get solved?"
     }
    },
    {
     "id": "wv5-b-cloze-transitions",
     "title": "Complete the Transitions",
     "skill": "Choose precise transition words",
     "time": "8 min",
     "wida": [
      "completing a cohesive paragraph",
      "selecting transition words"
     ],
     "directions": "Read the paragraph. Choose the best transition word for each blank so the ideas connect smoothly.",
     "sayFor": [
      "addition words",
      "contrast words",
      "conclusion words"
     ],
     "vocabulary": [
      [
       "transition",
       "a word that connects ideas",
       "transición: una palabra que conecta ideas"
      ],
      [
       "however",
       "a word that shows a difference",
       "sin embargo: una palabra que muestra diferencia"
      ],
      [
       "therefore",
       "a word that shows a result",
       "por lo tanto: una palabra que muestra un resultado"
      ]
     ],
     "frames": [
      "First, ___. However, ___. Therefore, ___."
     ],
     "wordBank": [
      "However",
      "Therefore",
      "In addition"
     ],
     "type": "cloze",
     "prompt": "Complete the paragraph about studying with the best transition words.",
     "segments": [
      {
       "text": "Studying every night helps students remember more. "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "In addition",
        "options": [
         "In addition",
         "However",
         "Finally"
        ]
       }
      },
      {
       "text": ", short breaks keep the brain fresh. "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "However",
        "options": [
         "However",
         "Therefore",
         "Also"
        ]
       }
      },
      {
       "text": ", studying too long can cause stress. "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "Therefore",
        "options": [
         "Therefore",
         "Because",
         "Meanwhile"
        ]
       }
      },
      {
       "text": ", a balanced study plan works best."
      }
     ],
     "correct": "Correct. In addition adds an idea, However shows a contrast, and Therefore shows a result.",
     "hint": "Which word adds an idea? Which word shows a problem or difference? Which shows a result?",
     "support": "Transitions guide the reader: addition (in addition), contrast (however), result (therefore).",
     "extension": "Write one sentence using the transition meanwhile.",
     "teacher": {
      "use": "Cohesion practice before revising a paragraph.",
      "function": "Select transitions that match the logical relationship.",
      "lower": "Discuss the meaning of each transition first.",
      "onLevel": "Students complete independently.",
      "challenge": "Students replace one transition with a synonym.",
      "noTech": "Print and circle the best transitions.",
      "prompt": "How does however change the meaning of the next idea?"
     }
    },
    {
     "id": "wv5-b-order-persuasive",
     "title": "Order a Persuasive Paragraph",
     "skill": "Order sentences into a persuasive paragraph",
     "time": "9 min",
     "wida": [
      "ordering a persuasive paragraph",
      "recognizing claim, reasons, and conclusion"
     ],
     "directions": "Put the sentences in order to build a persuasive paragraph about recycling at school. Use the buttons to move each sentence.",
     "sayFor": [
      "a claim",
      "supporting reasons",
      "a conclusion"
     ],
     "vocabulary": [
      [
       "claim",
       "the opinion you argue for",
       "afirmación: la opinión que defiendes"
      ],
      [
       "evidence",
       "facts that support your claim",
       "evidencia: hechos que apoyan tu afirmación"
      ],
      [
       "conclusion",
       "the ending that sums up",
       "conclusión: el final que resume"
      ]
     ],
     "frames": [
      "Our school should ___. First, ___. Second, ___. Therefore, ___."
     ],
     "wordBank": [
      "should",
      "First",
      "Second",
      "Therefore"
     ],
     "type": "order",
     "prompt": "Put the sentences in order to build a clear persuasive paragraph.",
     "items": [
      {
       "id": "i1",
       "text": "Our school should start a recycling program in every classroom."
      },
      {
       "id": "i2",
       "text": "First, recycling reduces the amount of trash that goes to landfills."
      },
      {
       "id": "i3",
       "text": "Second, it teaches students to care for the environment they share."
      },
      {
       "id": "i4",
       "text": "Therefore, adding recycling bins is a smart and responsible choice."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Correct. The claim comes first, two reasons follow, and the conclusion ends the paragraph.",
     "hint": "Find the claim sentence first. Then follow First, Second, and Therefore.",
     "support": "A persuasive paragraph states a claim, gives reasons, and ends with a conclusion.",
     "extension": "Write one more reason that could go between the two existing reasons.",
     "teacher": {
      "use": "Argument-structure practice before independent persuasive writing.",
      "function": "Order claim, reasons, and conclusion.",
      "lower": "Identify the claim and conclusion first.",
      "onLevel": "Students order on screen.",
      "challenge": "Students rewrite the paragraph for a different topic.",
      "noTech": "Arrange sentence strips into a paragraph.",
      "prompt": "Which sentence is the claim, and how do you know?"
     }
    },
    {
     "id": "wv5-b-sort-claim-evidence",
     "title": "Sort: Claim, Evidence, or Conclusion",
     "skill": "Identify the parts of an argument",
     "time": "8 min",
     "wida": [
      "classifying argument parts",
      "analyzing persuasive structure"
     ],
     "directions": "Read each sentence. Decide if it is a Claim, Evidence, or Conclusion in an argument about phones in school. Use the buttons.",
     "sayFor": [
      "an opinion statement",
      "a supporting fact",
      "a summary sentence"
     ],
     "vocabulary": [
      [
       "claim",
       "the main opinion of an argument",
       "afirmación: la opinión principal de un argumento"
      ],
      [
       "evidence",
       "a fact or example that supports",
       "evidencia: un hecho o ejemplo que apoya"
      ],
      [
       "conclusion",
       "the sentence that wraps up the argument",
       "conclusión: la oración que cierra el argumento"
      ]
     ],
     "frames": [
      "This sentence is the ___ because it ___."
     ],
     "wordBank": [
      "claim",
      "evidence",
      "conclusion",
      "for example"
     ],
     "type": "sort",
     "categories": [
      "Claim",
      "Evidence",
      "Conclusion"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Students should be allowed to use phones for learning.",
       "answer": "Claim"
      },
      {
       "id": "s2",
       "text": "For example, phones can be used to look up vocabulary words.",
       "answer": "Evidence"
      },
      {
       "id": "s3",
       "text": "A class survey showed that most students use apps to study.",
       "answer": "Evidence"
      },
      {
       "id": "s4",
       "text": "For these reasons, phones can be a helpful learning tool.",
       "answer": "Conclusion"
      }
     ],
     "correct": "Strong sorting. The claim states the opinion, evidence gives facts and examples, and the conclusion sums up.",
     "hint": "Evidence often starts with for example or names a fact. The conclusion restates the claim.",
     "support": "An argument has a claim (opinion), evidence (support), and a conclusion (wrap-up).",
     "extension": "Write one new piece of evidence for the claim.",
     "teacher": {
      "use": "Argument-analysis station before writing an opinion essay.",
      "function": "Classify sentences as claim, evidence, or conclusion.",
      "lower": "Sort the claim and conclusion first.",
      "onLevel": "Students sort all four independently.",
      "challenge": "Students add a counterclaim sentence and label it.",
      "noTech": "Sort sentence strips into three columns.",
      "prompt": "How is evidence different from a claim?"
     }
    },
    {
     "id": "wv5-b-constructed-opinion-response",
     "title": "Opinion Response: Best Way to Learn",
     "skill": "Write an opinion response with a counterclaim",
     "time": "13 min",
     "wida": [
      "writing an opinion response",
      "addressing a counterclaim"
     ],
     "directions": "Write an opinion response about the best way to learn a new subject. Give your opinion, two reasons, and respond to someone who disagrees. Try to write at least 55 words.",
     "sayFor": [
      "a clear opinion",
      "two supporting reasons",
      "a response to a different view"
     ],
     "vocabulary": [
      [
       "counterclaim",
       "an idea that disagrees with yours",
       "contraargumento: una idea que no está de acuerdo con la tuya"
      ],
      [
       "support",
       "reasons or facts that back an idea",
       "apoyo: razones o hechos que respaldan una idea"
      ],
      [
       "although",
       "a word that introduces a different view",
       "aunque: una palabra que introduce una idea diferente"
      ]
     ],
     "frames": [
      "In my opinion, the best way to learn is ___.",
      "One reason is ___. Another reason is ___.",
      "Although some people think ___, I believe ___ because ___."
     ],
     "wordBank": [
      "In my opinion",
      "One reason",
      "Another reason",
      "Although",
      "because"
     ],
     "type": "constructed",
     "prompt": "Prompt: What is the best way to learn a new subject: practice, teamwork, or reading? Write your opinion, give two reasons, and respond to a different view.",
     "responseLabel": "Your opinion response",
     "responsePlaceholder": "In my opinion, the best way to learn is ___ . One reason is ___ . Another reason is ___ . Although some people think ___ , I believe ___ because ___ .",
     "correct": "Strong response: In my opinion, the best way to learn is daily practice. One reason is that repeating skills builds memory. Another reason is that mistakes during practice show what to fix. Although some people think reading alone is enough, I believe practice is stronger because it lets you use what you read.",
     "hint": "State your opinion, give two reasons, then use Although to answer a different view.",
     "support": "Model: In my opinion, teamwork helps most. One reason is that friends explain ideas clearly. Although some prefer working alone, I believe teamwork is better because we learn from each other.",
     "extension": "Add a final sentence that restates your opinion in new words.",
     "teacher": {
      "use": "Advanced opinion task that practices counterclaim language.",
      "function": "Write an opinion with reasons and a counterclaim.",
      "lower": "Students complete the three frame lines.",
      "onLevel": "Students write with the frame as a checklist.",
      "challenge": "Students add a concluding sentence and a transition.",
      "noTech": "Draft on an opinion graphic organizer.",
      "prompt": "How does the word although help you answer the other side?"
     }
    }
   ]
  }
 }
};
