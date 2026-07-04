// access-data-v11.js — Publisher scope & sequence layer (category strands + Level A/B differentiation)
// Additive: defines named skill CATEGORIES within each level, rich A-vs-B level descriptors,
// and enrichment activities so every category has >=3 tasks. Merged by app.js mergeV11().
// Generated from per-domain curriculum specs; safe to regenerate.
window.ACCESS_LAB_V11 = {
  "appendActivities": {
    "Listening": {
      "B": [
        {
          "id": "lst-v11-b-cause-effect-storm",
          "title": "Why Did Recess Move Inside?",
          "skill": "Identifying cause and effect in a short announcement",
          "time": "7 min",
          "wida": [
            "Developing: identify a stated cause and effect",
            "Expanding: connect a reason to a result across sentences"
          ],
          "directions": "Listen to the morning announcement. The teacher will read it twice. Then choose the answer that tells WHY the change happened.",
          "listenFor": [
            "cause words like because, since, due to",
            "the result or change that happened",
            "weather and safety words"
          ],
          "vocabulary": [
            [
              "cause",
              "the reason something happens",
              "causa: la razon por la que algo ocurre"
            ],
            [
              "effect",
              "what happens as a result",
              "efecto: lo que sucede como resultado"
            ],
            [
              "because",
              "a word that gives the reason",
              "porque: una palabra que da la razon"
            ],
            [
              "lightning",
              "a bright flash of electricity in a storm",
              "relampago: un destello brillante en una tormenta"
            ],
            [
              "indoor",
              "happening inside a building",
              "bajo techo: que ocurre dentro de un edificio"
            ]
          ],
          "frames": [
            "Recess moved inside because ___.",
            "The cause is ___ and the effect is ___."
          ],
          "type": "multipleChoice",
          "adminScript": "Good morning, students. Here is a change to today's schedule. Recess will be held indoors today because there is lightning in the area, and it is not safe to be outside during a storm. Please report to the gym instead of the field. (Read at a steady pace, then repeat once.) Now answer: Why did recess move inside?",
          "prompt": "Listen to the announcement. Why did recess move inside today?",
          "options": [
            {
              "id": "a",
              "text": "Because there is lightning and a storm is not safe.",
              "visual": "lightning"
            },
            {
              "id": "b",
              "text": "Because the field was being cleaned.",
              "visual": "broom"
            },
            {
              "id": "c",
              "text": "Because the students asked to stay inside.",
              "visual": "hand up"
            }
          ],
          "answer": "a",
          "correct": "Yes. The cause is the lightning and storm; the effect is that recess moved indoors. The word 'because' told you the reason.",
          "hint": "Listen for the word 'because.' The words right after it give the reason.",
          "support": "Model: I hear 'because there is lightning.' That is the cause. Moving inside is the effect.",
          "extension": "Say it in one sentence: Recess moved inside because ___.",
          "teacher": {
            "use": "Use to introduce cause-and-effect listening before the ACCESS practice set.",
            "function": "Identify a cause-and-effect relationship signaled by 'because.'",
            "lower": "Pause after the word 'because' and ask students to repeat the reason aloud.",
            "onLevel": "Ask students to name both the cause and the effect before choosing.",
            "challenge": "Have students write a new announcement that uses 'because' to give a reason.",
            "noTech": "Read the script aloud twice and have students underline the cause on a printed copy.",
            "prompt": "What word in the announcement told you the reason?"
          }
        },
        {
          "id": "lst-v11-b-evidence-explain",
          "title": "Pick the Evidence: The Class Pet Vote",
          "skill": "Selecting the evidence that supports a conclusion you heard",
          "time": "8 min",
          "wida": [
            "Developing: locate stated evidence in a talk",
            "Expanding: match evidence to a conclusion or claim"
          ],
          "directions": "Listen to the student speech twice. Then click the TWO sentences from the speech that give the BEST evidence for the speaker's idea: the class should get a fish.",
          "listenFor": [
            "the speaker's main claim or opinion",
            "reasons and facts that support the claim",
            "evidence words like for example, this shows, because"
          ],
          "vocabulary": [
            [
              "evidence",
              "facts or details that prove an idea",
              "evidencia: hechos o detalles que prueban una idea"
            ],
            [
              "claim",
              "the idea a speaker is trying to prove",
              "afirmacion: la idea que un orador trata de probar"
            ],
            [
              "support",
              "to help show that something is true",
              "apoyar: ayudar a mostrar que algo es cierto"
            ],
            [
              "responsible",
              "able to take care of something well",
              "responsable: capaz de cuidar algo bien"
            ],
            [
              "afford",
              "to have enough money for something",
              "costear: tener suficiente dinero para algo"
            ]
          ],
          "frames": [
            "The speaker's claim is ___.",
            "One piece of evidence is ___ because it shows ___."
          ],
          "type": "hotText",
          "prompt": "Listen to Maria's speech. Click the TWO sentences that give the BEST evidence that the class should get a fish.",
          "adminScript": "Listen to Maria's speech to the class. (Read at a steady pace, then repeat once.) I think our class should get a fish for our class pet. A fish is quiet, so it will not bother us while we work. We can also afford a fish because the bowl and food cost very little money. Some people want a hamster, but a hamster needs a big cage. A fish is the responsible choice for our classroom. Now click the TWO sentences that give the best evidence that the class should get a fish.",
          "passageTitle": "The Class Pet Vote",
          "passage": [
            "I think our class should get a fish for our class pet.",
            "A fish is quiet, so it will not bother us while we work.",
            "We can also afford a fish because the bowl and food cost very little money.",
            "Some people want a hamster, but a hamster needs a big cage."
          ],
          "sentences": [
            {
              "id": "s1",
              "text": "I think our class should get a fish for our class pet."
            },
            {
              "id": "s2",
              "text": "A fish is quiet, so it will not bother us while we work."
            },
            {
              "id": "s3",
              "text": "We can also afford a fish because the bowl and food cost very little money."
            },
            {
              "id": "s4",
              "text": "Some people want a hamster, but a hamster needs a big cage."
            }
          ],
          "answers": [
            "s2",
            "s3"
          ],
          "correct": "Yes! Sentences about being quiet and being affordable are the evidence that supports getting a fish. Sentence 1 is the claim, and sentence 4 is about the hamster.",
          "hint": "The claim is the speaker's idea. Evidence is the reasons that prove it. Look for sentences that tell WHY a fish is a good choice.",
          "support": "Model: The claim is 'we should get a fish.' Then I look for reasons that prove it, like 'a fish is quiet.'",
          "extension": "Say or write: One piece of evidence is ___ because it shows ___.",
          "teacher": {
            "use": "Use to bridge listening to the Speaking and Writing claim-evidence tasks.",
            "function": "Match supporting evidence to a spoken claim.",
            "lower": "Replay the speech and have students give a thumbs-up when they hear a reason.",
            "onLevel": "Ask students to restate the claim before selecting the evidence.",
            "challenge": "Have students add one more piece of evidence the speaker could have used.",
            "noTech": "Print the four sentences and have students box the claim and underline the evidence.",
            "prompt": "How do you know those sentences are evidence and not just details?"
          }
        }
      ]
    },
    "Speaking": {
      "A": [
        {
          "id": "spk-v11-a-compare-two-classrooms",
          "title": "Picture Talk: Compare Two Classrooms",
          "skill": "Compare two pictures aloud with simple comparison words",
          "time": "8-10 min",
          "wida": [
            "Entering: Names what is the same and different in two familiar pictures using single words.",
            "Emerging: Compares two pictures aloud in short sentences using basic comparison words."
          ],
          "directions": "Look at the two classroom pictures. Say two sentences out loud: one telling what is the SAME and one telling what is DIFFERENT. Use the word bank and a frame.",
          "listenFor": [
            "a complete sentence",
            "a comparison word (same / different / more)",
            "one classroom noun"
          ],
          "vocabulary": [
            [
              "same",
              "not different; alike",
              "igual: que no es diferente"
            ],
            [
              "different",
              "not the same",
              "diferente: que no es igual"
            ],
            [
              "both",
              "the two together",
              "ambos: los dos juntos"
            ]
          ],
          "frames": [
            "Both classrooms have ___.",
            "This classroom has ___, but that one has ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Look at the two classroom pictures. Say one sentence about what is the same and one sentence about what is different.",
          "model": "Both classrooms have desks. This classroom has a window, but that one has a smart board.",
          "selfCheck": [
            "I said the word both, same, or different.",
            "I named one thing I see.",
            "I said a complete sentence."
          ],
          "hint": "Start with Both classrooms have ___ for the SAME sentence.",
          "support": "Point to each picture as you talk. Repeat the model sentence first, then say your own.",
          "extension": "Add a third sentence that tells which classroom you like and why.",
          "teacher": {
            "use": "Warm-up before partner picture-comparison talk.",
            "function": "Produce a short oral comparison of two visuals.",
            "lower": "Students chorally repeat the model, then fill the frame with one word.",
            "onLevel": "Students say both sentences using the frames independently.",
            "challenge": "Students compare without the frame and add a reason.",
            "noTech": "Use two printed picture cards side by side.",
            "prompt": "Which word tells your listener the things are not the same?"
          }
        },
        {
          "id": "spk-v11-a-introduce-a-friend",
          "title": "Introduce a New Friend",
          "skill": "Use everyday social language to introduce a person aloud",
          "time": "8-10 min",
          "wida": [
            "Entering: Uses memorized social phrases to greet and name a person.",
            "Emerging: Produces a short spoken introduction with a name and one detail."
          ],
          "directions": "Pretend you are introducing a new friend to the class. Say three short sentences out loud: a greeting, the friend's name, and one detail about them. Use the frames.",
          "listenFor": [
            "a greeting",
            "the friend's name",
            "one detail"
          ],
          "vocabulary": [
            [
              "introduce",
              "tell people who someone is",
              "presentar: decir quién es alguien"
            ],
            [
              "meet",
              "see and talk to someone new",
              "conocer: ver y hablar con alguien nuevo"
            ],
            [
              "friendly",
              "kind and warm",
              "amistoso: amable y cálido"
            ]
          ],
          "frames": [
            "Everyone, this is ___.",
            "He / She likes ___.",
            "Please say hello to ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Introduce a new friend to the class. Say a greeting, your friend's name, and one thing they like.",
          "model": "Everyone, this is Sara. She likes drawing and soccer. Please say hello to Sara.",
          "selfCheck": [
            "I greeted the class.",
            "I said my friend's name.",
            "I told one detail about my friend."
          ],
          "hint": "Begin with Everyone, this is ___.",
          "support": "Practice with a partner first. Use the friend card to remember one detail.",
          "extension": "Add a polite question to your friend, such as What do you like to do after school?",
          "teacher": {
            "use": "Build social-language confidence at the start of a unit.",
            "function": "Deliver a brief, polite spoken introduction.",
            "lower": "Provide a name card and one picture detail to read from.",
            "onLevel": "Students introduce a partner using all three frames.",
            "challenge": "Students introduce two friends and add a connecting sentence.",
            "noTech": "Use real partners and oral rehearsal only.",
            "prompt": "What polite words did you use to greet the class?"
          }
        }
      ],
      "B": [
        {
          "id": "spk-v11-b-academic-discussion-respond",
          "title": "Join the Discussion: Build on a Classmate's Idea",
          "skill": "Respond to and extend a peer's idea using academic discussion language",
          "time": "10-12 min",
          "wida": [
            "Developing: Responds to a classmate's idea with a connected sentence and a discussion phrase.",
            "Expanding: Builds on a peer's idea with an extended response that adds reasoning or a new example."
          ],
          "directions": "A classmate just shared an idea. Respond out loud in two or three connected sentences. First show you listened, then add your own reasoning. Use the academic discussion frames.",
          "listenFor": [
            "a discussion phrase (I agree / building on that / another reason)",
            "a connection to the classmate's idea",
            "your own reasoning or example"
          ],
          "vocabulary": [
            [
              "build on",
              "add to someone's idea",
              "ampliar: agregar a la idea de alguien"
            ],
            [
              "evidence",
              "facts that support an idea",
              "evidencia: hechos que apoyan una idea"
            ],
            [
              "perspective",
              "the way a person sees something",
              "perspectiva: la forma en que alguien ve algo"
            ]
          ],
          "frames": [
            "I agree with ___ because ___.",
            "Building on that idea, I would add ___.",
            "Another reason is ___, for example ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: A classmate says, \"Our school should have longer lunch breaks.\" Respond aloud. Show you listened, then add your own reasoning with an example.",
          "model": "I agree with Marcus because a longer lunch gives students time to rest. Building on that idea, I would add that students would also have time to eat a full meal, for example a sandwich and a fruit instead of just a snack.",
          "selfCheck": [
            "I used a discussion phrase to respond.",
            "I connected to my classmate's idea.",
            "I added my own reason or example.",
            "I spoke in connected sentences."
          ],
          "hint": "Start by agreeing or disagreeing, then use Building on that idea, I would add ___.",
          "support": "Underline the classmate's key word and repeat it in your first sentence.",
          "extension": "Politely add one respectful counterpoint using However, we should also think about ___.",
          "teacher": {
            "use": "Structured academic conversation routine (turn-and-talk or Socratic circle).",
            "function": "Extend a peer's contribution with reasoning in academic register.",
            "lower": "Students complete one frame with teacher prompting.",
            "onLevel": "Students use two frames and add one example independently.",
            "challenge": "Students respond, extend, and add a respectful counterpoint with evidence.",
            "noTech": "Run as a live partner discussion with frame cards on desks.",
            "prompt": "How did your words show your classmate that you were listening?"
          }
        },
        {
          "id": "spk-v11-b-present-recommendation",
          "title": "Mini-Presentation: Present and Justify a Recommendation",
          "skill": "Deliver a short organized presentation that recommends and justifies a choice",
          "time": "10-12 min",
          "wida": [
            "Developing: Presents a recommendation aloud with an opening, one reason, and a closing.",
            "Expanding: Delivers an organized extended presentation with multiple reasons, transitions, and a clear conclusion."
          ],
          "directions": "Give a short presentation (30-45 seconds). Recommend ONE choice and justify it. Organize your talk with an opening, two reasons with transitions, and a closing. Use the presentation frames.",
          "listenFor": [
            "a clear recommendation",
            "two reasons with academic transitions",
            "a closing sentence"
          ],
          "vocabulary": [
            [
              "recommend",
              "tell others the best choice",
              "recomendar: decir la mejor opción"
            ],
            [
              "justify",
              "give reasons that prove your point",
              "justificar: dar razones que prueban tu punto"
            ],
            [
              "in conclusion",
              "a phrase that signals the ending",
              "en conclusión: una frase que indica el final"
            ]
          ],
          "frames": [
            "I recommend ___ because ___.",
            "First, ___. In addition, ___.",
            "In conclusion, ___ is the best choice because ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Your class can take ONE field trip: the science museum or the aquarium. Present a recommendation. Open, give two reasons with transitions, and close.",
          "model": "I recommend the science museum because it connects to our current unit. First, the museum has a hands-on energy exhibit that matches what we are studying. In addition, it offers a workshop where we can run our own experiments. In conclusion, the science museum is the best choice because it lets us learn by doing.",
          "selfCheck": [
            "I opened with a clear recommendation.",
            "I gave two reasons.",
            "I used transition words like First and In addition.",
            "I ended with a conclusion sentence."
          ],
          "hint": "Plan your two reasons before you speak, then connect them with First and In addition.",
          "support": "Use a three-box planner (Open / Reasons / Close) and rehearse once with a partner.",
          "extension": "Add a sentence that answers a likely objection: Some might say ___, but ___.",
          "teacher": {
            "use": "Summative speaking task mirroring the ACCESS extended-response presentation.",
            "function": "Organize and deliver a justified spoken recommendation.",
            "lower": "Students use the planner and read partly from frame cards.",
            "onLevel": "Students present using transitions with brief planning notes.",
            "challenge": "Students present without notes and address a counterargument.",
            "noTech": "Present live to a partner or small group using a paper planner.",
            "prompt": "Which transition word told your audience you were adding a second reason?"
          }
        }
      ]
    },
    "Reading": {
      "B": [
        {
          "id": "rdg-v11-b-vocab-coral",
          "title": "Word Meaning: Coral Reefs",
          "skill": "Use context clues to determine word meaning",
          "type": "cloze",
          "time": "10 min",
          "wida": [
            "Use context clues",
            "Apply science vocabulary"
          ],
          "directions": "Read the passage. Then complete the summary by choosing the best academic word for each blank.",
          "vocabulary": [
            [
              "habitat",
              "the place where a living thing makes its home",
              "hábitat: el lugar donde vive un ser vivo"
            ],
            [
              "fragile",
              "easily broken or damaged",
              "frágil: que se rompe o daña con facilidad"
            ],
            [
              "thrive",
              "to grow strong and do well",
              "prosperar: crecer fuerte y desarrollarse bien"
            ]
          ],
          "frames": [
            "A coral reef is a ___ for many animals.",
            "Reefs are ___ and must be protected."
          ],
          "readFor": [
            "clues around the missing word",
            "what the sentence is about",
            "science vocabulary"
          ],
          "prompt": "Read the passage.\n\nCoral Reefs\n\nCoral reefs grow in warm, shallow ocean water. A single reef can be home to thousands of fish, crabs, and sea turtles. Because so many animals live there, a reef is one of the busiest habitats in the sea. But reefs are also easily harmed. Warmer water and pollution can damage the coral in just a few weeks. When the water stays clean and warm, the coral grows well and the whole reef stays healthy.\n\nNow complete the summary.",
          "segments": [
            {
              "text": "A coral reef is a busy "
            },
            {
              "blank": {
                "id": "b1",
                "answer": "habitat",
                "options": [
                  "habitat",
                  "machine",
                  "season"
                ]
              }
            },
            {
              "text": " where many animals live. Because pollution can harm coral quickly, reefs are very "
            },
            {
              "blank": {
                "id": "b2",
                "answer": "fragile",
                "options": [
                  "fragile",
                  "heavy",
                  "loud"
                ]
              }
            },
            {
              "text": ". When the water is clean and warm, the coral can "
            },
            {
              "blank": {
                "id": "b3",
                "answer": "thrive",
                "options": [
                  "thrive",
                  "freeze",
                  "sink"
                ]
              }
            },
            {
              "text": " and the reef stays healthy."
            }
          ],
          "answer": [
            "habitat",
            "fragile",
            "thrive"
          ],
          "correct": "Excellent. You used clues in the passage to match each academic word to its meaning.",
          "hint": "Reread the sentence around each blank. What is happening to the reef there?",
          "support": "Model: The passage says many animals 'live there,' so the reef is a habitat. It can be 'harmed in a few weeks,' so it is fragile.",
          "extension": "Use the word 'thrive' in a new sentence about a plant or animal.",
          "teacher": {
            "use": "Science reading station on ecosystems.",
            "function": "Determine word meaning from surrounding text.",
            "lower": "Pre-teach the three words with picture cards before reading.",
            "onLevel": "Students read independently and complete the cloze.",
            "challenge": "Students replace each answer with a synonym from the passage.",
            "noTech": "Print the passage; students circle the context clue for each word.",
            "prompt": "Which words near the blank told you the answer?"
          }
        },
        {
          "id": "rdg-v11-b-ws-inference",
          "title": "Worksheet: Making Inferences",
          "skill": "Combine text clues with prior knowledge to infer",
          "type": "worksheet",
          "time": "12 min",
          "wida": [
            "Make an inference",
            "Support an inference with evidence"
          ],
          "directions": "Read each short passage. Write what you can infer and underline the clue that helped you.",
          "vocabulary": [
            [
              "infer",
              "figure out something the text does not say directly",
              "inferir: descubrir algo que el texto no dice directamente"
            ],
            [
              "clue",
              "a detail that helps you understand",
              "pista: un detalle que ayuda a entender"
            ],
            [
              "evidence",
              "proof from the text",
              "evidencia: prueba que viene del texto"
            ]
          ],
          "frames": [
            "I can infer that ___ because the text says ___."
          ],
          "prompt": "Worksheet: Read each passage, then write your inference and the clue.\n\n1. Maria put on her boots, grabbed an umbrella, and looked at the gray sky. — What is the weather like? What clue tells you?\n\n2. The shelf was empty and a sign read 'Sold Out.' — Were the items popular? What clue tells you?\n\n3. The team carried a trophy and everyone was cheering. — Did the team win? What clue tells you?",
          "correct": "Use the answer key to check that each inference is supported by a clue from the passage.",
          "hint": "An inference is not stated. Look for clues, then add what you already know.",
          "support": "Model item 1: Boots, an umbrella, and a gray sky are clues. I infer it is going to rain.",
          "extension": "Write one more passage with a hidden meaning and trade with a partner.",
          "teacher": {
            "use": "Independent reading practice or homework.",
            "function": "Make and support inferences from short texts.",
            "lower": "Provide a word bank of possible inferences to choose from.",
            "onLevel": "Students write inferences in complete sentences.",
            "challenge": "Students explain why a wrong inference is not supported.",
            "noTech": "Standard printable worksheet with an answer key.",
            "prompt": "Which clue did you underline and why?"
          }
        },
        {
          "id": "rdg-v11-b-ws-cause-effect",
          "title": "Worksheet: Cause and Effect",
          "skill": "Identify cause-and-effect relationships in informational text",
          "type": "worksheet",
          "time": "12 min",
          "wida": [
            "Identify cause and effect",
            "Use signal words"
          ],
          "directions": "Read the passage. Then match each cause to its effect and circle the signal words.",
          "vocabulary": [
            [
              "cause",
              "the reason something happens",
              "causa: la razón por la que algo sucede"
            ],
            [
              "effect",
              "what happens as a result",
              "efecto: lo que sucede como resultado"
            ],
            [
              "because",
              "a word that signals a cause",
              "porque: una palabra que señala una causa"
            ]
          ],
          "frames": [
            "___ happened because ___.",
            "As a result of ___, ___."
          ],
          "prompt": "Worksheet: Read the passage, then match each cause to its effect.\n\nWhy Leaves Change Color\n\nIn the fall, days become shorter and the air turns cold. Because there is less sunlight, trees stop making the green coloring in their leaves. As a result, other colors like red and orange begin to show. Soon the leaves dry out, so they fall to the ground.\n\nCauses: (1) Days get shorter and colder  (2) Trees stop making green coloring  (3) Leaves dry out\nEffects: (a) Red and orange colors show  (b) Trees stop making green coloring  (c) Leaves fall to the ground",
          "correct": "Use the answer key: 1→b, 2→a, 3→c. Circle 'because,' 'as a result,' and 'so.'",
          "hint": "Look for signal words like 'because,' 'so,' and 'as a result' to connect causes and effects.",
          "support": "Model: 'Because there is less sunlight' is the cause; 'trees stop making green coloring' is the effect.",
          "extension": "Write one new cause-and-effect sentence about the weather.",
          "teacher": {
            "use": "Informational text practice or homework.",
            "function": "Identify cause-and-effect links using signal words.",
            "lower": "Highlight the signal words in the passage first, together.",
            "onLevel": "Students complete the matching independently.",
            "challenge": "Students rewrite one pair using a different signal word.",
            "noTech": "Standard printable worksheet with an answer key.",
            "prompt": "Which signal word helped you most?"
          }
        },
        {
          "id": "rdg-v11-b-ws-text-features",
          "title": "Worksheet: Text Features and Structure",
          "skill": "Identify text features and informational text structures",
          "type": "worksheet",
          "time": "12 min",
          "wida": [
            "Use text features",
            "Identify text structure"
          ],
          "directions": "Read the passage and study the features. Then answer where you would look for each kind of information.",
          "vocabulary": [
            [
              "heading",
              "a title that names a section",
              "encabezado: un título que nombra una sección"
            ],
            [
              "caption",
              "words that explain a picture",
              "leyenda: palabras que explican una imagen"
            ],
            [
              "glossary",
              "a list that defines key words",
              "glosario: una lista que define palabras clave"
            ]
          ],
          "frames": [
            "I would look in the ___ to find ___.",
            "The ___ tells me ___."
          ],
          "prompt": "Worksheet: Use the text features to answer.\n\nA science book about weather has these features: a Table of Contents, headings such as 'How Clouds Form,' a labeled diagram with captions, bold key words, and a glossary at the back.\n\n1. Where would you look to find the page where a chapter begins?\n2. Where would you find the meaning of a bold key word?\n3. What feature explains the picture of a cloud?\n4. How does a heading help a reader?",
          "correct": "Use the answer key: 1) Table of Contents 2) Glossary 3) Caption 4) It names what the section is about.",
          "hint": "Match the kind of information you need to the feature that holds it.",
          "support": "Model: A glossary defines words, so look there for the meaning of a bold word.",
          "extension": "List one more text feature you have seen and tell what it does.",
          "teacher": {
            "use": "Nonfiction text-feature practice or homework.",
            "function": "Connect text features and structure to their purpose.",
            "lower": "Provide a labeled example page to match against.",
            "onLevel": "Students answer in complete sentences.",
            "challenge": "Students explain which structure (sequence, cause/effect, compare) the chapter uses.",
            "noTech": "Standard printable worksheet with an answer key.",
            "prompt": "Which feature would you use first and why?"
          }
        }
      ]
    },
    "Writing": {
      "B": [
        {
          "id": "wrt-v11-b-describe-character",
          "title": "Describe a Person Who Matters",
          "skill": "Writing a descriptive paragraph about a person with precise adjectives",
          "time": "12 min",
          "wida": [
            "Developing: Write a descriptive paragraph using precise adjectives and concrete details.",
            "Expanding: Develop the description with varied sentences and a comparison or figurative phrase."
          ],
          "directions": "Read the prompt. Write a paragraph (4-6 sentences) that describes a person who matters to you. Use the frames if you need them, then add details of your own.",
          "sayFor": [
            "what the person looks like or does",
            "two precise describing words",
            "why this person matters",
            "complete sentences with end marks"
          ],
          "vocabulary": [
            [
              "describe",
              "tell what someone is like",
              "describir: decir cómo es alguien"
            ],
            [
              "precise",
              "exact and clear, not vague",
              "preciso: exacto y claro, no vago"
            ],
            [
              "character trait",
              "a word that tells how a person acts",
              "rasgo de carácter: una palabra que dice cómo actúa una persona"
            ],
            [
              "admire",
              "to think someone is good or special",
              "admirar: pensar que alguien es bueno o especial"
            ]
          ],
          "frames": [
            "A person who matters to me is ___.",
            "This person is ___ and ___.",
            "For example, ___.",
            "I admire this person because ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Think of a person who matters to you. Write a paragraph that describes this person. Tell what they are like, give one example, and explain why you admire them.",
          "responseLabel": "Your descriptive paragraph",
          "responsePlaceholder": "A person who matters to me is ___. This person is ___ and ___. For example, ___. I admire this person because ___.",
          "correct": "Response saved. A strong answer is a paragraph with at least two precise describing words, one example, and a reason this person matters.",
          "hint": "Replace vague words like nice or good with precise ones like patient, generous, or hardworking.",
          "support": "Model: A person who matters to me is my aunt Rosa. She is patient and generous. For example, she helps me with my homework every night without getting frustrated. I admire her because she always makes time for my family even when she is tired.",
          "extension": "Add one sentence that compares this person to something, such as 'She is as calm as a quiet lake.'",
          "teacher": {
            "use": "Descriptive paragraph writing after a brainstorm or visual.",
            "function": "Write a cohesive descriptive paragraph with precise adjectives.",
            "lower": "Students complete the four frames before adding their own sentence.",
            "onLevel": "Students write the paragraph using frames only as needed.",
            "challenge": "Students add a figurative comparison and vary sentence beginnings.",
            "noTech": "Use a describing-words web on paper before writing.",
            "prompt": "Which words in your paragraph are precise, and which could be more exact?"
          }
        },
        {
          "id": "wrt-v11-b-describe-event",
          "title": "Describe a Place During an Event",
          "skill": "Writing a sensory descriptive paragraph about a place in action",
          "time": "12 min",
          "wida": [
            "Developing: Write a descriptive paragraph using sensory details (sight, sound, smell).",
            "Expanding: Develop description with varied sentences and vivid, precise word choices."
          ],
          "directions": "Read the prompt. Write a paragraph (4-6 sentences) that describes a place during a busy moment. Use sensory words so the reader can picture it. Use the frames to start if you need them.",
          "sayFor": [
            "what you see",
            "what you hear",
            "what you smell or feel",
            "a sentence that names the place and the moment"
          ],
          "vocabulary": [
            [
              "sensory detail",
              "words about what you see, hear, smell, taste, or touch",
              "detalle sensorial: palabras sobre lo que ves, oyes, hueles, pruebas o tocas"
            ],
            [
              "vivid",
              "very clear and full of detail",
              "vívido: muy claro y lleno de detalles"
            ],
            [
              "bustling",
              "busy and full of movement",
              "bullicioso: ocupado y lleno de movimiento"
            ],
            [
              "atmosphere",
              "the feeling of a place",
              "ambiente: la sensación de un lugar"
            ]
          ],
          "frames": [
            "The ___ was bustling during ___.",
            "I could see ___.",
            "I could hear ___.",
            "The air smelled like ___, and I felt ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Choose a place during a busy event (a cafeteria at lunch, a gym during a game, a market on a weekend). Write a paragraph that describes it using at least three senses.",
          "responseLabel": "Your sensory descriptive paragraph",
          "responsePlaceholder": "The ___ was bustling during ___. I could see ___. I could hear ___. The air smelled like ___, and I felt ___.",
          "correct": "Response saved. A strong answer is a paragraph that uses at least three senses and vivid, precise words.",
          "hint": "Use one detail for sight, one for sound, and one for smell or touch.",
          "support": "Model: The cafeteria was bustling during lunch. I could see hundreds of students laughing at long blue tables. I could hear trays clattering and voices echoing off the walls. The air smelled like warm pizza and fresh oranges, and I felt the energy of the crowd all around me.",
          "extension": "Add a sentence that uses a comparison, such as 'The room buzzed like a beehive.'",
          "teacher": {
            "use": "Sensory descriptive paragraph after a five-senses brainstorm.",
            "function": "Write a vivid descriptive paragraph using multiple senses.",
            "lower": "Students fill in each sense frame with a word-bank choice first.",
            "onLevel": "Students write the paragraph and include at least three senses.",
            "challenge": "Students add figurative language and vary sentence length.",
            "noTech": "Use a five-senses chart on paper before writing.",
            "prompt": "Which senses did you include, and which one could you add?"
          }
        },
        {
          "id": "wrt-v11-b-narrative-new-place",
          "title": "Narrative: My First Day Somewhere New",
          "skill": "Writing a short narrative paragraph with a beginning, middle, and end",
          "time": "13 min",
          "wida": [
            "Developing: Write a short narrative with time-order words and feeling words.",
            "Expanding: Develop the narrative with descriptive detail and a clear ending that shows a change."
          ],
          "directions": "Read the prompt. Write a short story (5-6 sentences) about your first day somewhere new. Tell what happened in order. Use the frames to begin if you need them.",
          "sayFor": [
            "where and when the story starts",
            "what happened in the middle",
            "how you felt",
            "how the story ended"
          ],
          "vocabulary": [
            [
              "narrative",
              "a story that tells what happened",
              "narrativa: una historia que cuenta lo que pasó"
            ],
            [
              "sequence",
              "the order that things happen",
              "secuencia: el orden en que pasan las cosas"
            ],
            [
              "nervous",
              "worried or uneasy",
              "nervioso: preocupado o inquieto"
            ],
            [
              "finally",
              "a word that shows the last event",
              "finalmente: una palabra que muestra el último evento"
            ]
          ],
          "frames": [
            "On my first day at ___, I felt ___.",
            "First, ___.",
            "Then, ___.",
            "Finally, ___, and I felt ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Write about your first day somewhere new (a new school, city, team, or class). Tell the story in time order and show how your feelings changed from the beginning to the end.",
          "responseLabel": "Your narrative paragraph",
          "responsePlaceholder": "On my first day at ___, I felt ___. First, ___. Then, ___. Finally, ___, and I felt ___.",
          "correct": "Response saved. A strong answer is a story in time order with a beginning, middle, and end and at least two feeling words.",
          "hint": "Use first, then, and finally so the reader can follow the order of events.",
          "support": "Model: On my first day at my new school, I felt nervous and quiet. First, I could not find my classroom and walked down the wrong hallway. Then, a girl named Lina showed me the way and sat with me at lunch. Finally, I laughed with my new friends, and I felt happy and welcome.",
          "extension": "Add one descriptive sentence that tells what you saw or heard during the story.",
          "teacher": {
            "use": "Personal narrative writing after a story-mapping warm-up.",
            "function": "Write a sequenced narrative paragraph with a clear beginning, middle, and end.",
            "lower": "Students complete the time-order frames before adding detail.",
            "onLevel": "Students write the narrative using frames only as needed.",
            "challenge": "Students add descriptive detail and show a change in feeling.",
            "noTech": "Use a beginning-middle-end story map on paper first.",
            "prompt": "Where does your story show how your feelings changed?"
          }
        },
        {
          "id": "wrt-v11-b-narrative-helped-someone",
          "title": "Narrative: A Time I Helped Someone",
          "skill": "Writing a short narrative paragraph that shows a problem and a solution",
          "time": "13 min",
          "wida": [
            "Developing: Write a short narrative with a problem and how it was solved using time-order words.",
            "Expanding: Develop the narrative with dialogue or descriptive detail and a reflective ending."
          ],
          "directions": "Read the prompt. Write a short story (5-6 sentences) about a time you helped someone. Tell the problem, what you did, and how it ended. Use the frames if you need them.",
          "sayFor": [
            "who needed help and what the problem was",
            "what you did to help",
            "how the other person felt",
            "how the story ended"
          ],
          "vocabulary": [
            [
              "problem",
              "something that needs to be fixed",
              "problema: algo que necesita arreglarse"
            ],
            [
              "solution",
              "the way a problem is solved",
              "solución: la forma en que se resuelve un problema"
            ],
            [
              "grateful",
              "thankful for help",
              "agradecido: que da las gracias por la ayuda"
            ],
            [
              "realize",
              "to understand something for the first time",
              "darse cuenta: entender algo por primera vez"
            ]
          ],
          "frames": [
            "One day, ___ needed help because ___.",
            "First, I ___.",
            "Then, ___.",
            "In the end, ___, and I realized ___."
          ],
          "type": "constructed",
          "prompt": "Prompt: Write about a time you helped someone. Tell what the problem was, what you did to help, and what happened in the end. Show how you or the other person felt.",
          "responseLabel": "Your narrative paragraph",
          "responsePlaceholder": "One day, ___ needed help because ___. First, I ___. Then, ___. In the end, ___, and I realized ___.",
          "correct": "Response saved. A strong answer is a story with a clear problem, what you did, and an ending that shows a feeling or lesson.",
          "hint": "Make sure your story has a problem at the start and a solution at the end.",
          "support": "Model: One day, my little brother needed help because he could not finish his math homework and started to cry. First, I sat next to him and read the problem out loud. Then, we drew pictures to solve it together step by step. In the end, he finished his homework with a big smile, and I realized that being patient helps more than rushing.",
          "extension": "Add one line of dialogue that someone said during the story.",
          "teacher": {
            "use": "Problem-solution narrative after a brainstorm of helping moments.",
            "function": "Write a narrative paragraph with a problem, a solution, and reflection.",
            "lower": "Students complete the problem-solution frames before adding detail.",
            "onLevel": "Students write the narrative using frames only as needed.",
            "challenge": "Students add dialogue and a reflective ending sentence.",
            "noTech": "Use a problem-solution two-column chart on paper first.",
            "prompt": "Where is the problem and where is the solution in your story?"
          }
        }
      ]
    }
  },
  "levels": {
    "Listening": {
      "A": {
        "band": "WIDA Level 1-2 (Entering-Emerging)",
        "headline": "Listen for important words and follow what you hear.",
        "summary": "Level A builds the foundation of academic listening for newcomer and early-emerging students. Learners practice catching key words in short, slow teacher talk and matching what they hear to pictures, actions, and simple choices. Every task pairs spoken language with strong visual and vocabulary support so meaning is never carried by words alone.",
        "distinguishes": "Compared with Level B, Level A uses very short scripts (1-3 sentences) read at a slow, clear pace with frequent repetition, heavy picture/icon support, and answer choices that are pictured or one phrase long. Students identify single stated facts rather than connecting ideas or inferring, and sentence frames are provided for every spoken response.",
        "canDo": [
          "I can follow a one- or two-step oral direction in class.",
          "I can match a spoken word to the right picture or action.",
          "I can identify spoken numbers, places, and everyday school words.",
          "I can pick out one key detail (who, what, where, when) from short talk.",
          "I can put 3-4 spoken steps in the right order using signal words.",
          "I can complete a short spoken summary by choosing the missing word."
        ],
        "focusAreas": [
          "Following classroom directions",
          "Key words and numbers in speech",
          "Matching language to visuals",
          "Sequencing short oral steps",
          "Everyday and beginning academic vocabulary"
        ],
        "categories": [
          {
            "id": "following-directions-routines",
            "title": "Following Directions & Classroom Routines",
            "desc": "Listen to a teacher direction and choose the action or item that matches what you heard.",
            "skillFocus": "Process simple imperative and routine classroom language and act on it.",
            "activityIds": [
              "classroom-directions",
              "v3-l-a-1",
              "lv5-class-supplies-mc",
              "lv5-lunch-line-mc",
              "lv5-pe-coach-mc",
              "v10-l-a-map-directions"
            ]
          },
          {
            "id": "sequencing-steps-processes",
            "title": "Sequencing Steps & Processes",
            "desc": "Listen to a set of steps and put them in the order the speaker explains them.",
            "skillFocus": "Order short spoken procedures using first/next/then/finally signal words.",
            "activityIds": [
              "lv5-fire-drill-order",
              "v7-list-a-labsteps",
              "v10-l-a-water-cycle"
            ]
          },
          {
            "id": "key-details-numbers",
            "title": "Key Details & Numbers in Speech",
            "desc": "Listen for the who, what, where, when, and numbers in short school talk.",
            "skillFocus": "Identify single stated details and spoken quantities and distinguish similar sounds.",
            "activityIds": [
              "details-detective",
              "exit-ticket",
              "v3-l-a-2",
              "lv5-weather-detail-mc",
              "lv5-bring-tomorrow-ms",
              "v7-list-a-weather",
              "v10-l-a-lunch-count"
            ]
          },
          {
            "id": "main-idea-academic-vocab",
            "title": "Main Idea & Academic Vocabulary",
            "desc": "Listen for the big idea and the meaning of school and content words.",
            "skillFocus": "Interpret beginning academic language and complete a short spoken summary.",
            "activityIds": [
              "main-idea-match",
              "academic-listening",
              "lv5-morning-routine-cloze",
              "v7-list-a-plantparts",
              "lv5-ws-science-listening"
            ]
          },
          {
            "id": "sorting-classifying",
            "title": "Sorting & Classifying What You Hear",
            "desc": "Listen to phrases and sort each one into the right school place or situation.",
            "skillFocus": "Classify familiar spoken language by setting, topic, or purpose.",
            "activityIds": [
              "school-scenario-sort",
              "lv5-school-places-sort",
              "v7-list-a-cafeteria"
            ]
          },
          {
            "id": "listening-strategies-print",
            "title": "Listening Strategies (Print Practice)",
            "desc": "Use clue words and note-taking strategies on a printable that mirrors the WIDA test.",
            "skillFocus": "Apply listening strategies and self-monitor comprehension off-screen.",
            "activityIds": [
              "ws-listening-leon",
              "lv5-ws-listening-clues",
              "lv5-ws-school-announcements"
            ]
          }
        ]
      },
      "B": {
        "band": "WIDA Level 3-4 (Developing-Expanding, 2.6-4.5)",
        "headline": "Listen for reasons, main ideas, and academic details in school talk.",
        "summary": "Level B moves students from catching key words to understanding connected academic discourse. Learners follow multi-step explanations, track several supporting details across a passage, distinguish main idea from detail, and use clues to infer speakers, causes, and effects. Tasks use content-area talk from math, science, social studies, and technology and ask students to explain their thinking with evidence.",
        "distinguishes": "Compared with Level A, Level B uses longer connected passages (4-8 sentences) read at near-natural pace with less repetition and lighter visual support. Students integrate information across a passage, infer unstated meaning, and justify answers, instead of identifying a single stated fact. Response types expand to multi-select, hot-text, and constructed responses where students produce their own academic language.",
        "canDo": [
          "I can follow a multi-step oral explanation or set of directions.",
          "I can identify several supporting details in connected speech.",
          "I can tell the main idea apart from the details that support it.",
          "I can infer a speaker, opinion, cause, or effect from clues.",
          "I can sequence the steps of a spoken academic process.",
          "I can explain my listening answer with evidence in a complete sentence."
        ],
        "focusAreas": [
          "Main idea and inference",
          "Multiple supporting details",
          "Sequencing academic processes",
          "Academic and content-area language",
          "Cause, effect, and evidence"
        ],
        "categories": [
          {
            "id": "main-idea-inference",
            "title": "Main Idea & Inference",
            "desc": "Listen to a passage and decide the big idea or what a speaker means but does not say.",
            "skillFocus": "Distinguish main idea from detail and infer speaker, role, or opinion from clues.",
            "activityIds": [
              "main-idea-match-b",
              "v7-list-b-ecosystem",
              "lv5-class-debate-mc",
              "lv5-careers-sort"
            ]
          },
          {
            "id": "supporting-details-connected-speech",
            "title": "Supporting Details in Connected Speech",
            "desc": "Listen to a talk and pick out the several details that matter.",
            "skillFocus": "Track multiple supporting details and distinguish stated from unstated information.",
            "activityIds": [
              "details-detective-b",
              "v3-l-b-1",
              "lv5-recycling-ms",
              "lv5-food-program-ms",
              "v7-list-b-branches",
              "v10-l-b-recycling-podcast"
            ]
          },
          {
            "id": "sequencing-procedural",
            "title": "Sequencing & Procedural Listening",
            "desc": "Listen to a process or set of rules and put the steps in order.",
            "skillFocus": "Sequence multi-step spoken processes using academic sequence and signal language.",
            "activityIds": [
              "classroom-directions-b",
              "v3-l-b-2",
              "lv5-experiment-order",
              "v7-list-b-watercycle",
              "v10-l-b-debate-rules"
            ]
          },
          {
            "id": "academic-content-talk",
            "title": "Academic Language & Content Talk",
            "desc": "Listen to math, science, and content talk and show you understand the academic language.",
            "skillFocus": "Interpret academic and quantitative oral language and complete academic summaries.",
            "activityIds": [
              "academic-listening-b",
              "lv5-water-cycle-mc",
              "lv5-tech-tutorial-cloze",
              "lv5-history-talk-cloze",
              "v7-list-b-mathtalk",
              "v10-l-b-weather-report"
            ]
          },
          {
            "id": "cause-effect-evidence",
            "title": "Cause, Effect & Evidence",
            "desc": "Listen for why something happens and explain your answer with evidence.",
            "skillFocus": "Identify cause-and-effect relationships in speech and justify answers with evidence.",
            "activityIds": [
              "exit-ticket-b",
              "school-scenario-sort-b",
              "lst-v11-b-cause-effect-storm",
              "lst-v11-b-evidence-explain"
            ]
          }
        ]
      }
    },
    "Speaking": {
      "A": {
        "band": "WIDA Level A — Entering–Emerging (proficiency ~1.0–2.5)",
        "headline": "Say one clear sentence: short, framed spoken responses about familiar topics.",
        "summary": "Level A speakers produce short, complete spoken sentences about familiar school and personal topics, leaning heavily on sentence frames, word banks, and visual supports. Tasks center on naming, describing what they see, stating a simple opinion with a reason, and retelling in order. Success means one clear idea spoken in a complete sentence, often rehearsed before delivery.",
        "distinguishes": "Level A responses are 1–2 short sentences built directly from a provided frame, using everyday and high-frequency academic words and concrete, picture-supported prompts. Speakers rely on frames and choral rehearsal and are not yet expected to connect multiple ideas, add transitions, or justify with evidence — that independence and extended, cohesive discourse is the Level B step up.",
        "canDo": [
          "I can name objects and people in a familiar picture using words and short phrases.",
          "I can say one complete sentence using a sentence frame.",
          "I can state a preference or opinion and give one reason with because.",
          "I can retell two or three steps in order using sequence words.",
          "I can use polite social phrases to greet, introduce, and ask for help.",
          "I can compare two familiar pictures using same and different."
        ],
        "focusAreas": [
          "Complete-sentence production with frames",
          "Describing visuals with everyday and concrete academic vocabulary",
          "Opinion + one reason (because)",
          "Sequencing and short oral retell",
          "Polite social and instructional language"
        ],
        "categories": [
          {
            "id": "spk-a-social-everyday",
            "title": "Everyday & Social Language",
            "desc": "Greet, introduce, request help, and choose the right polite tone for school situations.",
            "skillFocus": "Social and instructional spoken language; polite register; high-frequency phrases.",
            "activityIds": [
              "speak-ask-for-help",
              "v3-s-a-2",
              "v7-spk-a-order-introduce-yourself",
              "v7-spk-a-sort-polite-casual",
              "spk-v11-a-introduce-a-friend"
            ]
          },
          {
            "id": "spk-a-describing",
            "title": "Describing & Picture Talk",
            "desc": "Describe pictures, scenes, and objects aloud with concrete nouns and basic detail.",
            "skillFocus": "Oral description of visuals using everyday and content nouns plus location words.",
            "activityIds": [
              "speak-describe-picture",
              "v3-s-a-1",
              "sv5-describe-classroom-emoji",
              "sv5-describe-lunch-tray",
              "sv5-ws-picture-talk",
              "v7-spk-a-describe-classroom-picture",
              "v10-s-a-describe-science"
            ]
          },
          {
            "id": "spk-a-opinions",
            "title": "Stating Opinions & Reasons",
            "desc": "State a preference or opinion aloud and support it with one clear reason.",
            "skillFocus": "Producing a short claim plus a reason; recognizing strong vs. weak spoken answers.",
            "activityIds": [
              "speak-one-sentence",
              "speak-answer-question",
              "speak-state-preference",
              "sv5-favorite-subject-opinion",
              "sv5-sort-strong-weak-answers",
              "v7-spk-a-strongest-opinion-response"
            ]
          },
          {
            "id": "spk-a-sequencing-retell",
            "title": "Sequencing, Retelling & Explaining",
            "desc": "Retell events and steps in order using sequence words and simple explanation.",
            "skillFocus": "Ordering ideas aloud; using time/sequence transitions; short oral retell.",
            "activityIds": [
              "speak-retell-sequence",
              "sv5-retell-school-day",
              "sv5-order-retell-steps",
              "sv5-ws-explain-process",
              "v10-s-a-retell-day",
              "ws-speaking-newworld"
            ]
          },
          {
            "id": "spk-a-comparing",
            "title": "Comparing & Contrasting",
            "desc": "Compare two familiar things or pictures aloud using same, different, and basic comparison words.",
            "skillFocus": "Oral comparison of two items using comparison vocabulary and frames.",
            "activityIds": [
              "sv5-compare-two-pets",
              "sv5-ws-compare-contrast",
              "v10-s-a-compare-shapes",
              "spk-v11-a-compare-two-classrooms"
            ]
          }
        ]
      },
      "B": {
        "band": "WIDA Level B — Developing–Expanding (proficiency ~2.6–4.5)",
        "headline": "Connect, justify, and present: extended spoken responses with academic language.",
        "summary": "Level B speakers produce connected, multi-sentence spoken responses that compare, justify, explain processes, and present information. They use academic transitions, content vocabulary, and discussion moves to support opinions with evidence and respond to peers. Frames now scaffold cohesion and organization rather than single sentences, and independence and extended discourse are the expectation.",
        "distinguishes": "Compared with Level A, Level B responses are extended and cohesive (multiple connected sentences) and require justification with evidence, academic transitions, and content vocabulary. Speakers compare and contrast, explain multi-step processes, build on classmates' ideas, and deliver short organized presentations — using frames to manage organization and register rather than to produce a single sentence.",
        "canDo": [
          "I can state an opinion and justify it with two reasons and evidence.",
          "I can compare and contrast two topics in connected sentences with academic transitions.",
          "I can explain a multi-step process aloud in the correct order.",
          "I can summarize information and ask a clarifying question.",
          "I can build on a classmate's idea and agree or disagree respectfully.",
          "I can deliver a short organized presentation with an opening, reasons, and a conclusion."
        ],
        "focusAreas": [
          "Justifying opinions with evidence and reasons",
          "Comparing and contrasting with academic transitions",
          "Explaining multi-step processes and reasoning aloud",
          "Academic discussion moves (agree, clarify, build on)",
          "Organizing and delivering a short presentation"
        ],
        "categories": [
          {
            "id": "spk-b-social-everyday",
            "title": "Everyday & Academic Register",
            "desc": "Match speaking register to audience, ask clarifying questions, and explain school situations.",
            "skillFocus": "Choosing formal vs. informal register; clarifying questions; explaining a situation aloud.",
            "activityIds": [
              "speak-ask-clarifying",
              "sv5-sort-formal-informal",
              "v7-spk-b-explain-school-situation-cloze"
            ]
          },
          {
            "id": "spk-b-describing",
            "title": "Describing & Interpreting Visuals",
            "desc": "Describe and interpret pictures, experiments, and data aloud in connected sentences.",
            "skillFocus": "Extended oral description and interpretation of visuals and data with content vocabulary.",
            "activityIds": [
              "sv5-describe-science-experiment",
              "v10-s-b-describe-data",
              "sv5-compare-graphs"
            ]
          },
          {
            "id": "spk-b-opinions",
            "title": "Justifying Opinions & Recommending",
            "desc": "State, defend, and recommend with evidence; agree or disagree respectfully.",
            "skillFocus": "Producing justified opinions and recommendations; selecting strong evidence; respectful argument.",
            "activityIds": [
              "speak-justify-opinion",
              "speak-agree-disagree",
              "v3-s-b-2",
              "sv5-opinion-school-uniforms",
              "v7-spk-b-opinion-strongest-evidence",
              "v10-s-b-opinion-reasons",
              "v10-s-b-recommend"
            ]
          },
          {
            "id": "spk-b-process-explaining",
            "title": "Explaining Processes & Reasoning",
            "desc": "Explain how to do something and walk through multi-step processes and problem solutions aloud.",
            "skillFocus": "Sequenced procedural and explanatory language; reasoning aloud with cause/result.",
            "activityIds": [
              "speak-explain-process",
              "v3-s-b-1",
              "sv5-explain-water-cycle",
              "sv5-retell-story-problem",
              "v7-spk-b-retell-process-order"
            ]
          },
          {
            "id": "spk-b-discussion-presenting",
            "title": "Comparing, Discussing & Presenting",
            "desc": "Compare topics, summarize, organize, and present information in academic discussion.",
            "skillFocus": "Extended comparison; summarizing; organizing and delivering oral presentations; discussion moves.",
            "activityIds": [
              "speak-compare-choices",
              "speak-summarize-orally",
              "sv5-order-presentation-parts",
              "v7-spk-b-compare-two-cities",
              "spk-v11-b-academic-discussion-respond",
              "spk-v11-b-present-recommendation"
            ]
          }
        ]
      }
    },
    "Reading": {
      "A": {
        "band": "WIDA Levels 1-2 (Entering-Emerging)",
        "headline": "Read short, illustrated texts to find the topic, key details, and main idea.",
        "summary": "Level A readers work with brief, high-support texts of one short paragraph, often paired with pictures, captions, or a simple chart. Tasks focus on locating explicit details, naming the main idea, and using picture and word clues to understand new vocabulary. Sentence frames, models, and word banks scaffold every item.",
        "distinguishes": "Texts are 1 short paragraph (about 3-5 simple sentences) with familiar, concrete topics and present-tense, single-clause sentences. Heavy support is built in: picture cues, word banks, sentence frames, and teacher models. Students answer literal 'right there' questions and order short sequences with explicit signal words; they are not yet expected to infer or compare across texts independently.",
        "canDo": [
          "I can find the main idea of a short text.",
          "I can locate a detail that the text states directly.",
          "I can use pictures and nearby words to understand a new word.",
          "I can put 3-4 steps in order using first, next, and last.",
          "I can read a simple chart to find information.",
          "I can tell a fact from an opinion in a short sentence."
        ],
        "focusAreas": [
          "explicit key details",
          "main idea vs. detail",
          "context clues with picture support",
          "sequencing with signal words",
          "reading simple charts"
        ],
        "categories": [
          {
            "id": "key-details-main-idea",
            "title": "Key Details & Main Idea",
            "desc": "Read a short, illustrated school text and pull out the topic, the main idea, and the small facts that support it.",
            "skillFocus": "Locate explicit details, name the main idea, and tell a main idea apart from a single detail.",
            "activityIds": [
              "read-main-idea",
              "read-supporting-detail",
              "read-compare-two-details",
              "v3-r-a-1",
              "rv5-school-garden-1",
              "rv5-school-garden-3",
              "rv5-multiselect-true-details",
              "v7-read-a-class-pet",
              "v10-r-a-main-idea"
            ]
          },
          {
            "id": "vocabulary-in-context",
            "title": "Vocabulary in Context",
            "desc": "Use nearby words and pictures to figure out the meaning of an unfamiliar academic word.",
            "skillFocus": "Apply context clues to choose the correct meaning of everyday and science vocabulary.",
            "activityIds": [
              "read-vocab-in-context",
              "rv5-vocab-context-recycle",
              "v7-read-a-morning-cloze",
              "v10-r-a-vocab-context"
            ]
          },
          {
            "id": "text-structure-sequence",
            "title": "Text Structure & Sequence",
            "desc": "Follow the order of steps and events and find information in simple charts using signal words.",
            "skillFocus": "Sequence steps with first/next/last and locate information in a chart or short summary.",
            "activityIds": [
              "read-sequence-order",
              "v3-r-a-2",
              "rv5-school-garden-2",
              "rv5-cloze-bus-routine",
              "v10-r-a-chart-read"
            ]
          },
          {
            "id": "inference-evidence-purpose",
            "title": "Inference, Evidence & Author's Purpose",
            "desc": "Point to the sentence that proves an answer, sort facts from opinions, and tell why an author wrote a text.",
            "skillFocus": "Cite a supporting sentence, distinguish fact from opinion, and identify a simple author purpose.",
            "activityIds": [
              "read-author-purpose",
              "rv5-sort-fact-opinion",
              "rv5-constructed-favorite-character",
              "v7-read-a-water-cycle-evidence",
              "v7-read-a-recess-sort"
            ]
          },
          {
            "id": "reading-practice-print",
            "title": "Reading Practice & Print Resources",
            "desc": "Printable practice pages that mirror the WIDA practice test for offline and homework use.",
            "skillFocus": "Reinforce main idea, details, context clues, and text structure with no-tech print practice.",
            "activityIds": [
              "ws-reading-garden",
              "rv5-ws-context-clues",
              "rv5-ws-main-idea-details",
              "rv5-ws-text-structure"
            ]
          }
        ]
      },
      "B": {
        "band": "WIDA Levels 3-4 (Developing-Expanding, 2.6-4.5)",
        "headline": "Read informational passages to infer meaning, cite evidence, and analyze how texts are built.",
        "summary": "Level B readers work with longer, multi-sentence informational passages across science and social studies, including some compound and complex sentences. Tasks shift from literal recall to inference, selecting the strongest evidence, tracing cause and effect, and recognizing text structure and author's purpose. Support is lighter and students increasingly compare ideas across two texts and explain their thinking in writing.",
        "distinguishes": "Texts are longer (a full short paragraph to several sentences, sometimes two short passages) with abstract or academic topics and compound/complex sentences. Support is reduced to optional hints and frames rather than constant models. Students infer beyond the literal text, choose the best of several pieces of evidence, identify organizational structure, and write short evidence-based responses with growing independence.",
        "canDo": [
          "I can make an inference using clues from the text.",
          "I can choose the sentence that best supports an answer.",
          "I can identify cause and effect in an informational text.",
          "I can determine the author's purpose and central idea.",
          "I can recognize how a text is organized and use text features.",
          "I can compare ideas across two short texts and explain with evidence."
        ],
        "focusAreas": [
          "inference from textual clues",
          "citing the strongest evidence",
          "cause and effect",
          "text structure and features",
          "author's purpose",
          "comparing across texts"
        ],
        "categories": [
          {
            "id": "key-details-main-idea",
            "title": "Key Details & Main Idea",
            "desc": "Read a longer informational passage and identify the central idea plus the multiple details that support it.",
            "skillFocus": "Summarize a passage, determine the central idea, and select several supporting details.",
            "activityIds": [
              "read-summarize",
              "v3-r-b-1",
              "rv5-info-volcano-1",
              "v7-read-b-revolution-multiselect"
            ]
          },
          {
            "id": "vocabulary-in-context",
            "title": "Vocabulary in Context",
            "desc": "Use surrounding text and data to determine the meaning of precise academic and science vocabulary.",
            "skillFocus": "Apply context clues, differentiate related terms, and interpret vocabulary tied to data.",
            "activityIds": [
              "v3-r-b-2",
              "rv5-cloze-graph-recycle",
              "rdg-v11-b-vocab-coral"
            ]
          },
          {
            "id": "text-structure-sequence",
            "title": "Text Structure & Sequence",
            "desc": "Recognize how a text is organized, sequence the steps of a process, and use text features to navigate.",
            "skillFocus": "Identify text structure, sequence an explanatory process, and match text features to purpose.",
            "activityIds": [
              "read-text-structure",
              "rv5-info-volcano-2",
              "rv5-multiselect-text-features",
              "v7-read-b-volcano-order",
              "v10-r-b-sequence-events"
            ]
          },
          {
            "id": "inference-cause-effect",
            "title": "Inference & Cause–Effect",
            "desc": "Read closely to draw conclusions the text does not state directly and trace why events happen.",
            "skillFocus": "Making inferences, identifying cause and effect, and reasoning about the author’s purpose.",
            "activityIds": [
              "read-infer-meaning",
              "read-cause-effect",
              "rv5-info-volcano-3",
              "rv5-sort-cause-effect",
              "read-table-evidence",
              "rv5-mc-authors-purpose"
            ]
          },
          {
            "id": "citing-evidence-compare-texts",
            "title": "Citing Evidence & Comparing Texts",
            "desc": "Find and quote the strongest text evidence, and connect ideas across more than one passage.",
            "skillFocus": "Selecting and citing supporting evidence, and comparing information across two texts.",
            "activityIds": [
              "read-best-evidence",
              "v7-read-b-monarch-evidence",
              "v7-read-b-rosa-parks-constructed",
              "v10-r-b-evidence-hot",
              "rv5-constructed-compare-texts",
              "v10-r-b-compare-texts"
            ]
          },
          {
            "id": "reading-practice-print",
            "title": "Reading Practice & Print Resources",
            "desc": "Printable practice pages that mirror the WIDA practice test for offline and homework use.",
            "skillFocus": "Reinforce inference, cause/effect, and text features with no-tech print practice and answer keys.",
            "activityIds": [
              "rdg-v11-b-ws-inference",
              "rdg-v11-b-ws-cause-effect",
              "rdg-v11-b-ws-text-features"
            ]
          }
        ]
      }
    },
    "Writing": {
      "A": {
        "band": "WIDA Level A / Entering-Emerging (1.0-2.5)",
        "headline": "Build correct sentences and short, scaffolded paragraphs with frames and word banks",
        "summary": "Level A writers move from single words to one complete, correct sentence and then to a few connected sentences. Every task supplies a sentence frame, a labeled word bank, and a model so students can succeed before writing independently. The focus is producing accurate, purposeful sentences across descriptive, informational, opinion, and narrative purposes.",
        "distinguishes": "Level A output is at the sentence to short-paragraph level (typically 1-4 sentences, roughly 10-40 words). Heavy scaffolding is always present: cloze blanks, sentence frames, picture/word banks, and ordering or sorting tasks that build paragraph awareness before composition. Students rely on a provided model and finish frames before attempting independence. Vocabulary is everyday plus a few academic anchor words.",
        "canDo": [
          "I can write one complete sentence with a capital letter and an end mark.",
          "I can use a sentence frame and a word bank to describe a picture or place.",
          "I can finish a reason sentence using the word because.",
          "I can put short sentences in time order to make a small paragraph.",
          "I can sort sentences into topic, detail, and closing parts.",
          "I can write a short opinion sentence with one reason."
        ],
        "focusAreas": [
          "complete-sentence accuracy and end punctuation",
          "sentence frames and labeled word banks",
          "time-order and sequence words",
          "paragraph parts (topic, detail, closing)",
          "one-reason opinions with because"
        ],
        "categories": [
          {
            "id": "wrt-a-word-sentence",
            "title": "Word & Sentence Construction",
            "desc": "Building one accurate, complete sentence: choosing strong words, adding a detail, finishing frames, and applying capitalization and end punctuation.",
            "skillFocus": "Produce a complete, correctly punctuated sentence using frames and academic word choices.",
            "activityIds": [
              "write-complete-frame",
              "write-best-sentence",
              "write-add-detail",
              "wv5-a-cloze-because",
              "v7-writ-a-sort-strong-weak-detail"
            ]
          },
          {
            "id": "wrt-a-descriptive",
            "title": "Descriptive Writing",
            "desc": "Describing a picture, place, or object in one to three sentences using position words, present-tense verbs, and descriptive details.",
            "skillFocus": "Write descriptive sentences and captions using frames and concrete vocabulary.",
            "activityIds": [
              "write-describe-one-sentence",
              "v3-w-a-1",
              "v10-w-a-describe-frames",
              "v10-w-a-caption"
            ]
          },
          {
            "id": "wrt-a-informational",
            "title": "Informational & Explanatory Writing",
            "desc": "Explaining, sequencing a process, and recognizing paragraph structure: topic, supporting detail, and closing sentences, including evidence and claim language.",
            "skillFocus": "Write short explanatory sentences and organize ideas into a simple informational paragraph.",
            "activityIds": [
              "write-evidence-sentence",
              "write-find-claim",
              "wv5-a-order-morning",
              "wv5-a-sort-paragraph-parts",
              "v7-writ-a-cloze-sequence-sandwich",
              "ws-writing-classes",
              "wv5-ws-informational-paragraph"
            ]
          },
          {
            "id": "wrt-a-opinion-argument",
            "title": "Opinion & Argument Writing",
            "desc": "Stating a personal opinion with one reason, telling fact from opinion, and planning a persuasive message using because.",
            "skillFocus": "Write one clear opinion sentence with a reason and prepare to persuade.",
            "activityIds": [
              "wv5-a-sentence-school-rule",
              "wv5-a-sort-fact-opinion",
              "v7-writ-a-opinion-favorite-meal",
              "v10-w-a-opinion-short",
              "wv5-ws-persuasive-letter"
            ]
          },
          {
            "id": "wrt-a-narrative",
            "title": "Narrative Writing",
            "desc": "Telling a short personal story or note in time order using sequence words, feeling words, and a friendly purpose such as a thank-you.",
            "skillFocus": "Write short narrative sentences in sequence with time and feeling words.",
            "activityIds": [
              "v3-w-a-2",
              "wv5-a-constructed-thank-you",
              "wv5-a-cloze-narrative",
              "v7-writ-a-order-morning-routine",
              "wv5-ws-narrative-paragraph"
            ]
          }
        ]
      },
      "B": {
        "band": "WIDA Level B / Developing-Expanding (2.6-4.5)",
        "headline": "Compose cohesive paragraphs with claims, evidence, and academic transitions",
        "summary": "Level B writers compose multi-sentence paragraphs that organize a claim, evidence, and a conclusion. Frames and models are still available but used as a starting point toward independence; students revise for precision and connect ideas with academic transitions. The focus is developing coherent descriptive, informational, opinion/argument, and narrative paragraphs for a purpose and audience.",
        "distinguishes": "Level B output is at the full-paragraph level (typically 4-7 sentences, roughly 50-120 words) rather than single sentences. Scaffolds shift from fill-in cloze toward optional frames, revision prompts, and self-checks; students write independently and then refine. Tasks add audience awareness, counterclaims, comparison/contrast, sensory and figurative language, and cohesive transitions. Vocabulary includes precise academic and content-area terms.",
        "canDo": [
          "I can write a paragraph with a claim, evidence, and a concluding sentence.",
          "I can use academic transitions to connect my ideas (for example, however, as a result).",
          "I can revise a weak sentence into a stronger, more precise one.",
          "I can compare two choices in writing using contrast transitions.",
          "I can address the other side of an argument with a counterclaim.",
          "I can write a descriptive or narrative paragraph with sensory details and time order."
        ],
        "focusAreas": [
          "claim, evidence, and conclusion structure",
          "academic and cohesive transitions",
          "revision for clarity and precision",
          "audience and purpose (persuasion, comparison)",
          "sensory detail and narrative development"
        ],
        "categories": [
          {
            "id": "wrt-b-word-sentence",
            "title": "Word & Sentence Construction",
            "desc": "Refining sentences for precision and cohesion: revising weak sentences, choosing exact transitions, and completing cohesive paragraphs.",
            "skillFocus": "Revise sentences and select precise transitions for clarity and flow.",
            "activityIds": [
              "write-revise-stronger",
              "write-transition-words",
              "wv5-b-cloze-transitions"
            ]
          },
          {
            "id": "wrt-b-descriptive",
            "title": "Descriptive Writing",
            "desc": "Developing a descriptive paragraph with sensory details, precise adjectives, varied sentences, and figurative language.",
            "skillFocus": "Write a cohesive descriptive paragraph using sensory detail and varied structure.",
            "activityIds": [
              "v7-writ-b-constructed-describe-place",
              "wrt-v11-b-describe-character",
              "wrt-v11-b-describe-event"
            ]
          },
          {
            "id": "wrt-b-informational",
            "title": "Informational & Explanatory Writing",
            "desc": "Explaining and comparing with evidence: describing data, summarizing text, organizing explanatory paragraphs, and comparing two choices with transitions.",
            "skillFocus": "Write coherent explanatory and comparison paragraphs supported by evidence.",
            "activityIds": [
              "v3-w-b-1",
              "v3-w-b-2",
              "wv5-b-constructed-informational",
              "v7-writ-b-order-explanation-paragraph",
              "v7-writ-b-sort-paragraph-parts",
              "v10-w-b-explain-evidence",
              "v10-w-b-compare-write",
              "write-compare-evidence"
            ]
          },
          {
            "id": "wrt-b-opinion-argument",
            "title": "Opinion & Argument Writing",
            "desc": "Constructing arguments with claims, reasons, evidence, counterclaims, and conclusions for a specific audience.",
            "skillFocus": "Write a persuasive or argument paragraph with a claim, evidence, and a counterclaim.",
            "activityIds": [
              "write-two-sentence-evidence",
              "write-opinion-three-sentences",
              "write-counterclaim",
              "wv5-b-constructed-persuasive-letter",
              "wv5-b-order-persuasive",
              "wv5-b-sort-claim-evidence",
              "wv5-b-constructed-opinion-response",
              "v7-writ-b-constructed-argument-recess",
              "v10-w-b-persuade"
            ]
          },
          {
            "id": "wrt-b-narrative",
            "title": "Narrative Writing",
            "desc": "Writing a short narrative paragraph with a beginning, middle, and end, using time order, feeling words, and descriptive detail.",
            "skillFocus": "Write a developed narrative paragraph with sequence and sensory detail.",
            "activityIds": [
              "wv5-b-constructed-narrative",
              "wrt-v11-b-narrative-new-place",
              "wrt-v11-b-narrative-helped-someone"
            ]
          }
        ]
      }
    }
  }
};
