export default {
  "version": 1,
  "unit_id": "g3-ela-u1",
  "source": "authored",
  "lessons": [
    {
      "id": "g3-ela-u1-l01",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 1,
      "source": "authored",
      "title": "Name and Describe Sea Creatures with Precise Words",
      "core_lesson_ref": {
        "label": "Language session 1: describing creatures",
        "source": "language_pathway"
      },
      "content_objective": "Students will name five sea creatures (blue crab, sea star, octopus, seahorse, jellyfish) and describe the body parts of each one with precise describing words for size, color, and feel.",
      "language_objective": {
        "klu": "Inform",
        "function": "name a sea creature and describe its body with precise describing words",
        "forms": [
          "a small, spotted sea star (describing words before the noun)",
          "has / have + body part",
          "and"
        ],
        "by_level": {
          "l1_2": "I can point to a creature, say its name, and use one describing word from the word bank: 'The crab is big.'",
          "l3_4": "I can describe a creature with two describing words in English order, like 'a small, spotted sea star,' and say what body parts it has.",
          "l5_6": "I can write a description of a creature so exact that a partner can draw it unseen, choosing precise words like 'spiny' over general words like 'nice.'"
        }
      },
      "standards": [
        "L.3.1.a",
        "L.3.5.c",
        "SL.3.4",
        "RF.3.3"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Inform.Expressive",
        "pld_targets": [
          "sentence",
          "word"
        ]
      },
      "vocab": [
        {
          "term": "creature",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "describe",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "shell",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "claw",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "tentacle",
          "tier": 3,
          "new_or_review": "new"
        }
      ],
      "mentor_sentence": {
        "text": "The blue crab has two strong claws, and its hard shell protects its soft body.",
        "chunks": [
          {
            "text": "The blue crab",
            "role": "The creature (who the sentence is about)",
            "tone": "concept",
            "ask": "Which creature is this sentence about?"
          },
          {
            "text": "has two strong claws,",
            "role": "A body part with a precise describing word",
            "tone": "precision",
            "ask": "Which describing word tells what kind of claws the crab has?"
          },
          {
            "text": "and",
            "role": "Joins two facts about the crab",
            "tone": "connector",
            "ask": "Which small word joins the two facts?"
          },
          {
            "text": "its hard shell protects its soft body.",
            "role": "What the shell does, with two more describing words",
            "tone": "evidence",
            "ask": "Which two describing words tell how the shell and the body feel?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Creature Word Flip",
            "mission": "Flip each card, say the word it asks for, and check yourself before you move to the next one.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "A card a student misses goes back in the pile as 'not yet', so no one is put on the spot.",
            "materials": [
              "Printed word cards or the digital deck"
            ],
            "support": {
              "l1_2": "Look at the picture on the card and say the word with your partner.",
              "l3_4": "Answer in a full sentence, then flip the card to check.",
              "l5_6": "Answer without looking, then add one more describing word of your own."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "What is a creature?",
                  "answer": "Any living animal, big or small.",
                  "icon": "🦀"
                },
                {
                  "prompt": "Which word names the hard outside cover on a crab, a turtle, or an oyster?",
                  "answer": "A shell.",
                  "icon": "🐚"
                },
                {
                  "prompt": "What do we call a word that describes a noun, like 'tiny' or 'red'?",
                  "answer": "An adjective, or a describing word.",
                  "icon": "✏️"
                },
                {
                  "prompt": "Name one creature that lives in the Chesapeake Bay.",
                  "answer": "A blue crab, an oyster, or a striped bass.",
                  "icon": "🌊"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "Which Creature Is It?",
            "mission": "Listen to each description and tap the creature that has exactly those body parts and describing words.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each description twice at a natural pace; the second time, slow down on the describing words.",
            "support": {
              "l1_2": "Listen once, tap, then listen again while you read the words.",
              "l3_4": "Tap first, then repeat the describing words you heard to a partner.",
              "l5_6": "Tap first, then say which describing word helped you choose and which one ruled out another creature."
            },
            "payload": {
              "items": [
                {
                  "say": "I see a small octopus. It has eight long, soft arms.",
                  "options": [
                    {
                      "label": "octopus",
                      "icon": "🐙"
                    },
                    {
                      "label": "jellyfish",
                      "icon": "🪼"
                    },
                    {
                      "label": "sea turtle",
                      "icon": "🐢"
                    }
                  ],
                  "answer": 0,
                  "why": "Eight long, soft arms belong to an octopus. A turtle has flippers, and a jellyfish has stinging tentacles."
                },
                {
                  "say": "This creature has a hard, round shell and four wide flippers.",
                  "options": [
                    {
                      "label": "blue crab",
                      "icon": "🦀"
                    },
                    {
                      "label": "sea turtle",
                      "icon": "🐢"
                    },
                    {
                      "label": "seahorse"
                    }
                  ],
                  "answer": 1,
                  "why": "A hard shell with flippers fits a sea turtle. A crab has claws instead of flippers, and a seahorse has no shell."
                },
                {
                  "say": "It is a tiny creature with a curly tail and a long, thin snout.",
                  "options": [
                    {
                      "label": "octopus",
                      "icon": "🐙"
                    },
                    {
                      "label": "sea star"
                    },
                    {
                      "label": "seahorse"
                    }
                  ],
                  "answer": 2,
                  "why": "A curly tail and a long, thin snout describe a seahorse. A sea star has no tail."
                },
                {
                  "say": "The soft, clear creature drifts in the water and has long, stinging tentacles.",
                  "options": [
                    {
                      "label": "jellyfish",
                      "icon": "🪼"
                    },
                    {
                      "label": "blue crab",
                      "icon": "🦀"
                    },
                    {
                      "label": "sea star"
                    }
                  ],
                  "answer": 0,
                  "why": "Clear, soft, and stinging tentacles describe a jellyfish. A blue crab has a hard shell, so it does not fit."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Crab Sentence X-Ray",
            "mission": "Take the crab sentence apart to find the chunk that names the creature and the chunks that hold the describing words.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Have students tap the describing words and notice each one stands right before the noun it describes.",
            "support": {
              "l1_2": "Tap each color and listen to the chunk, then point to the creature's name.",
              "l3_4": "Rebuild the sentence and name the job of each chunk.",
              "l5_6": "Rebuild it, then write a new sentence about a different creature with the same four chunks."
            },
            "payload": {
              "text": "The blue crab has two strong claws, and its hard shell protects its soft body.",
              "chunks": [
                {
                  "text": "The blue crab",
                  "role": "The creature (who the sentence is about)",
                  "tone": "concept"
                },
                {
                  "text": "has two strong claws,",
                  "role": "A body part with a precise describing word",
                  "tone": "precision"
                },
                {
                  "text": "and",
                  "role": "Joins two facts about the crab",
                  "tone": "connector"
                },
                {
                  "text": "its hard shell protects its soft body.",
                  "role": "What the shell does, with two more describing words",
                  "tone": "evidence"
                }
              ],
              "ask": "Where does the describing word 'strong' stand: before the word 'claws' or after it?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "clue_game",
            "domain": "Game",
            "title": "Mystery Creature",
            "mission": "Open one clue at a time, then name the creature that matches every describing word you read.",
            "grouping": "Small Group",
            "minutes": 8,
            "tip": "Fewer clues used earns more points; let each group read its clue aloud and say which describing word helped.",
            "materials": [
              "Clue cards or the digital game"
            ],
            "support": {
              "l1_2": "Look at the creature pictures and use the clue words to point to your guess.",
              "l3_4": "Guess before you open the third clue, and say the describing word that convinced you.",
              "l5_6": "After your guess, write a fourth clue that uses two precise describing words."
            },
            "payload": {
              "cards": [
                {
                  "term": "blue crab",
                  "clues": [
                    "I live in the muddy Chesapeake Bay and I walk sideways.",
                    "I have two strong claws, and the male's are bright blue.",
                    "My hard shell is greenish-brown on top."
                  ]
                },
                {
                  "term": "octopus",
                  "clues": [
                    "I have eight long, soft arms with round suckers.",
                    "I have no bones, so I can squeeze through a tiny crack.",
                    "I squirt dark ink when I am scared."
                  ]
                },
                {
                  "term": "sea star",
                  "clues": [
                    "I usually have five short, bumpy arms and no head.",
                    "My rough, spiny skin can be orange, purple, or red.",
                    "I hold on tight to wet rocks in a tide pool."
                  ]
                },
                {
                  "term": "seahorse",
                  "clues": [
                    "I am a tiny creature with a long, thin snout.",
                    "My curly tail grabs sea grass so I do not drift away.",
                    "The male carries the eggs in a pouch."
                  ]
                },
                {
                  "term": "jellyfish",
                  "clues": [
                    "My soft, clear body looks like a floating bell.",
                    "My long tentacles can give a painful sting.",
                    "I have no bones, no brain, and no heart."
                  ]
                }
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Describe It, Record It",
            "mission": "Choose one creature, describe its body so your partner could draw it, then record yourself and listen back.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask the partner to draw while listening and compare the drawing to the creature.",
            "klu": "Inform",
            "support": {
              "l1_2": "Use the frame and the word bank; say one creature and one body part.",
              "l3_4": "Say two body parts and use two describing words for the creature.",
              "l5_6": "Say three body parts with a precise describing word for each, and join two facts with 'and'."
            },
            "payload": {
              "prompt": "Choose a creature. Describe its body so your partner can draw it without seeing it.",
              "frame": "I see a ___ ___ ___. It has ___ ___ that are ___, and its ___ is ___.",
              "model": "I see a small, orange sea star. It has five short arms that are bumpy, and its skin is rough.",
              "checklist": [
                "I named the creature.",
                "I put my describing words before the creature's name.",
                "I told at least two body parts and how they look or feel."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Vocabulary",
            "title": "Creature Description Exit Check",
            "mission": "Show that you can choose precise describing words and put them in the right place in a sentence about a sea creature.",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Use the 'with help / by myself / and I can teach it' self-rating to decide who joins your small group tomorrow.",
            "support": {
              "l1_2": "Listen to each question, tap an answer, and rate yourself with a picture.",
              "l3_4": "Read each question, choose an answer, and read why it is right.",
              "l5_6": "Answer, correct any mistake, and rate yourself."
            },
            "payload": {
              "can_do": "I can describe a sea creature with precise words in the right order.",
              "items": [
                {
                  "q": "Which sentence describes the crab in the right order?",
                  "options": [
                    "The crab has a shell hard.",
                    "The crab has a hard shell.",
                    "The crab hard has a shell."
                  ],
                  "answer": 1,
                  "why": "The describing word 'hard' goes right before 'shell,' because English puts describing words first."
                },
                {
                  "q": "Which sentence uses 'is' and 'has' correctly?",
                  "options": [
                    "A sea star orange. It have five arms.",
                    "A sea star is orange. It have five arms.",
                    "A sea star is orange. It has five arms."
                  ],
                  "answer": 2,
                  "why": "You need 'is' before 'orange,' and one sea star 'has' five arms. The other sentences leave out 'is' or use 'have.'"
                },
                {
                  "q": "Which words describe a seahorse most exactly?",
                  "options": [
                    "tiny, curly-tailed",
                    "nice, good",
                    "big, long-armed"
                  ],
                  "answer": 0,
                  "why": "A seahorse is tiny and has a curly tail. 'Nice' is too general, and 'big, long-armed' fits an octopus better."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say Creatures",
          "mission": "Point to each creature picture, say its English name, then say the short sentence that goes with it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the name only, one creature at a time.",
            "l3_4": "Say the name and the whole sentence.",
            "l5_6": "Say the sentence, then change the describing word to make it about another creature."
          },
          "payload": {
            "items": [
              {
                "term": "blue crab",
                "icon": "🦀",
                "cue": "A crab with two big claws and a hard shell, walking sideways on sand.",
                "say": "The crab is blue. It has two claws.",
                "es": "cangrejo azul"
              },
              {
                "term": "sea star",
                "icon": "⭐",
                "cue": "An orange sea star with five bumpy arms, stuck to a wet rock.",
                "say": "This sea star is orange. It has five arms.",
                "es": "estrella de mar"
              },
              {
                "term": "octopus",
                "icon": "🐙",
                "cue": "A soft purple octopus with eight long arms curling around a rock.",
                "say": "The octopus is soft. It has eight arms.",
                "es": "pulpo"
              },
              {
                "term": "jellyfish",
                "icon": "🪼",
                "cue": "A clear jellyfish shaped like a bell, with long thin tentacles hanging down.",
                "say": "The jellyfish is clear. It has long tentacles.",
                "es": "medusa"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "Move Like a Creature",
          "mission": "Listen to each command and show the creature's body part or size with your hands and body.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model every action once, then give the command without modeling and watch for the correct response.",
          "support": {
            "l1_2": "Copy the action with a partner as you listen.",
            "l3_4": "Do the action on your own after you hear the command.",
            "l5_6": "Give the commands to a partner and check the response."
          },
          "payload": {
            "items": [
              {
                "command": "Make your hands into two strong claws.",
                "icon": "🦀"
              },
              {
                "command": "Wave your arms slowly like a soft jellyfish.",
                "icon": "🪼"
              },
              {
                "command": "Hold up five fingers to show the arms of a sea star.",
                "icon": "🖐️"
              },
              {
                "command": "Curl your arm like the tail of a seahorse.",
                "icon": "🌀"
              },
              {
                "command": "Show a small circle with your hands, then a large circle.",
                "icon": "⭕"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Creature Words in Two Languages",
          "mission": "Say each creature word in English and in your home language, then tell a partner how the two words are alike.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add the word in any home language; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner and point to the picture.",
            "l3_4": "Say both words and one way they are alike or different.",
            "l5_6": "Say both words and use each one in a sentence in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "creature",
                "es": "criatura",
                "note": "True cognate. In Spanish, 'criatura' can also mean a baby, but in English 'creature' means any animal."
              },
              {
                "term": "shell",
                "es": "caparazón / concha",
                "note": "Spanish has two words: 'caparazón' for the hard back of a crab or turtle and 'concha' for a seashell or an oyster. English uses 'shell' for all of them."
              },
              {
                "term": "large",
                "es": "grande",
                "note": "False friend: English 'large' means 'grande,' not 'largo.' The Spanish word 'largo' means 'long' in English."
              }
            ]
          }
        },
        {
          "kind": "cognate_detective",
          "domain": "Vocabulary",
          "title": "Cognate Detectives",
          "mission": "Sort each creature word and its Spanish partner into true cognate, false friend, or no look-alike, and watch out for the word 'large.'",
          "grouping": "Small Group",
          "minutes": 4,
          "tip": "Celebrate every guess; the 'why' explains each answer, so students learn the pattern and not only the label.",
          "support": {
            "l1_2": "Say each English word and its Spanish word, then point to a bin.",
            "l3_4": "Sort the pairs and read the reason for each answer.",
            "l5_6": "Sort the pairs, then find one more cognate in this lesson's words."
          },
          "payload": {
            "items": [
              {
                "term": "creature",
                "es": "criatura",
                "status": "true",
                "why": "The spelling and meaning match. Watch the ending: -ure becomes -ura."
              },
              {
                "term": "describe",
                "es": "describir",
                "status": "true",
                "why": "The two words share the same Latin parts, so the meaning is the same."
              },
              {
                "term": "tentacle",
                "es": "tentáculo",
                "status": "true",
                "why": "Same meaning and nearly the same spelling. Add an accent in Spanish."
              },
              {
                "term": "large",
                "es": "largo",
                "status": "false_friend",
                "why": "They look alike, but 'large' means 'grande' and 'largo' means 'long.'"
              },
              {
                "term": "claw",
                "es": "pinza",
                "status": "none",
                "why": "A crab's claw is a 'pinza' in Spanish, and the two words do not look alike."
              },
              {
                "term": "soft",
                "es": "suave",
                "status": "none",
                "why": "'Suave' means soft or smooth, but the words do not look alike. Remember the sound of 'soft' by touching something soft."
              }
            ]
          }
        }
      ],
      "extension": null,
      "exit_check": {
        "kind": "exit_check",
        "domain": "Vocabulary",
        "title": "Creature Description Exit Check",
        "mission": "Show that you can choose precise describing words and put them in the right place in a sentence about a sea creature.",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Use the 'with help / by myself / and I can teach it' self-rating to decide who joins your small group tomorrow.",
        "support": {
          "l1_2": "Listen to each question, tap an answer, and rate yourself with a picture.",
          "l3_4": "Read each question, choose an answer, and read why it is right.",
          "l5_6": "Answer, correct any mistake, and rate yourself."
        },
        "payload": {
          "can_do": "I can describe a sea creature with precise words in the right order.",
          "items": [
            {
              "q": "Which sentence describes the crab in the right order?",
              "options": [
                "The crab has a shell hard.",
                "The crab has a hard shell.",
                "The crab hard has a shell."
              ],
              "answer": 1,
              "why": "The describing word 'hard' goes right before 'shell,' because English puts describing words first."
            },
            {
              "q": "Which sentence uses 'is' and 'has' correctly?",
              "options": [
                "A sea star orange. It have five arms.",
                "A sea star is orange. It have five arms.",
                "A sea star is orange. It has five arms."
              ],
              "answer": 2,
              "why": "You need 'is' before 'orange,' and one sea star 'has' five arms. The other sentences leave out 'is' or use 'have.'"
            },
            {
              "q": "Which words describe a seahorse most exactly?",
              "options": [
                "tiny, curly-tailed",
                "nice, good",
                "big, long-armed"
              ],
              "answer": 0,
              "why": "A seahorse is tiny and has a curly tail. 'Nice' is too general, and 'big, long-armed' fits an octopus better."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Photos or picture cards of the five creatures",
          "Sticky notes or small whiteboards",
          "A device with sound for each pair"
        ],
        "listen_for": [
          "Students put the describing word before the creature's name ('a small crab,' not 'a crab small').",
          "Students use 'has' with one creature and 'have' with more than one ('two claws').",
          "Students choose a precise word such as 'spiny' or 'clear' instead of 'nice' or 'big'."
        ],
        "watchouts": [
          "Spanish, French, and Haitian Creole put describing words after the noun, so you may hear 'the crab blue.' Hold up one finger for the describing word and one for the noun, and have students swap them.",
          "Arabic and Haitian Creole speakers may leave out 'is' ('The octopus soft'), and Spanish speakers may add -s to describing words ('reds claws'). Tap 'is' on the board before every describing word and show that English describing words never take -s.",
          "'Large' looks like Spanish 'largo,' which means 'long.' Have students show 'large' with big hands and 'long' with a stretched arm."
        ],
        "differentiation": {
          "l1_2": "Give a word bank (small, big, soft, hard, red, blue) and the frame 'The ___ is ___.' Accept a point plus one word.",
          "l3_4": "Expect two describing words in order and one body part with 'has.' Ask 'What does it look like?' to push past one-word answers.",
          "l5_6": "Expect a precise description of three body parts. Ask students to replace any vague word and explain why the new word is better.",
          "newcomer": "Use Point and Say, Move Like a Creature, and the Home Language Bridge; accept pointing, drawing, and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    },
    {
      "id": "g3-ela-u1-l02",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 2,
      "source": "authored",
      "title": "Ask and Answer: Where Does It Live?",
      "core_lesson_ref": {
        "label": "Language session 2: asking about habitats",
        "source": "language_pathway"
      },
      "content_objective": "Students will explain that a habitat is the place where an animal finds food and shelter, and will match five animals to their habitats: tide pool, oyster reef, bay grass, open ocean, and coral reef.",
      "language_objective": {
        "klu": "Inform",
        "function": "ask where an animal lives and answer with a complete sentence that names the place",
        "forms": [
          "Where does the ___ live?",
          "It lives in / on / near ___.",
          "-s on 'lives' after 'it'"
        ],
        "by_level": {
          "l1_2": "I can ask 'Where does it live?' and answer 'It lives in ___' while pointing to a habitat picture card.",
          "l3_4": "I can ask three different questions about an animal's home and answer each in a complete sentence with 'in,' 'on,' or 'near.'",
          "l5_6": "I can ask 'where' and 'what' questions about a habitat and explain what an animal finds there, using details from what I heard."
        }
      },
      "standards": [
        "SL.3.1.c",
        "RI.3.1",
        "L.3.1.f",
        "RF.3.3"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Inform.Interpretive",
        "pld_targets": [
          "sentence",
          "word"
        ]
      },
      "vocab": [
        {
          "term": "habitat",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "tide pool",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "reef",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "shelter",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "creature",
          "tier": 2,
          "new_or_review": "review"
        }
      ],
      "mentor_sentence": {
        "text": "Where does a hermit crab live? It lives in a tide pool on the rocky shore.",
        "chunks": [
          {
            "text": "Where does a hermit crab live?",
            "role": "A where-question: question word, 'does,' then the animal",
            "tone": "concept",
            "ask": "Which small helper word comes before the animal in the question?"
          },
          {
            "text": "It lives",
            "role": "The answer starts with 'It' and a verb with -s",
            "tone": "precision",
            "ask": "What happens to the word 'live' after the word 'It'?"
          },
          {
            "text": "in a tide pool",
            "role": "The exact home",
            "tone": "evidence",
            "ask": "Which words name the exact home of the hermit crab?"
          },
          {
            "text": "on the rocky shore.",
            "role": "The bigger place around the home",
            "tone": "precision",
            "ask": "Which words tell the bigger place where the tide pool sits?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Creature Words Again",
            "mission": "Flip each card to remember what you learned about describing creatures, and say the answer before you check.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "Ask one partner to read the card and the other to answer, then switch so each student speaks.",
            "support": {
              "l1_2": "Look at the icon, say the word, and flip the card to check.",
              "l3_4": "Answer with a full sentence before you flip the card.",
              "l5_6": "Answer, then say one more describing word for the same creature."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "In English, which comes first: the describing word or the creature's name?",
                  "answer": "The describing word comes first, like 'a small crab.'",
                  "icon": "🦀"
                },
                {
                  "prompt": "Which sea creature has eight long arms?",
                  "answer": "An octopus.",
                  "icon": "🐙"
                },
                {
                  "prompt": "Which word names the hard outside cover on a crab?",
                  "answer": "A shell.",
                  "icon": "🐚"
                },
                {
                  "prompt": "Say one describing word for a jellyfish's body.",
                  "answer": "Soft, clear, or floating are good answers.",
                  "icon": "🪼"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "Where Is Its Home?",
            "mission": "Listen to each clue about an animal and tap the habitat where that animal lives.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each clue twice, and after the second reading ask one student to say the home in a full sentence.",
            "support": {
              "l1_2": "Listen, tap a picture, then listen again to hear the home word.",
              "l3_4": "Tap the home and say 'It lives in ___' to a partner.",
              "l5_6": "Tap the home and tell which clue words told you where the animal lives."
            },
            "payload": {
              "items": [
                {
                  "say": "A sea star holds on tight to wet rocks in a pool of salty water, so the waves cannot wash it away.",
                  "options": [
                    {
                      "label": "tide pool",
                      "icon": "🌊"
                    },
                    {
                      "label": "oyster reef"
                    },
                    {
                      "label": "open ocean"
                    }
                  ],
                  "answer": 0,
                  "why": "Wet rocks, a small pool of salty water, and splashing waves all describe a tide pool."
                },
                {
                  "say": "Oysters live together on a reef in the Chesapeake Bay, and small crabs and fish hide between their shells.",
                  "options": [
                    {
                      "label": "tide pool"
                    },
                    {
                      "label": "oyster reef",
                      "icon": "🦪"
                    },
                    {
                      "label": "sandy beach"
                    }
                  ],
                  "answer": 1,
                  "why": "Oysters that live together on the bottom of the bay make a reef, and small animals hide in the spaces."
                },
                {
                  "say": "Far from the shore, a dolphin swims in deep, open water and comes up to breathe air.",
                  "options": [
                    {
                      "label": "tide pool"
                    },
                    {
                      "label": "pond"
                    },
                    {
                      "label": "open ocean",
                      "icon": "🐬"
                    }
                  ],
                  "answer": 2,
                  "why": "A dolphin swims in the open ocean. A pond has fresh water, and a tide pool is much too small for a dolphin."
                },
                {
                  "say": "A baby blue crab hides in tall green grass on the bottom of the bay, so hungry fish cannot see it.",
                  "options": [
                    {
                      "label": "bay grass",
                      "icon": "🌿"
                    },
                    {
                      "label": "coral reef"
                    },
                    {
                      "label": "deep ocean"
                    }
                  ],
                  "answer": 0,
                  "why": "Tall grass on the bottom of the bay hides a small crab. Coral reefs are in warm water, and the deep ocean has no grass."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Question and Answer X-Ray",
            "mission": "Look inside the hermit crab question and answer to see which words change when a question turns into an answer.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Have students compare 'live' in the question with 'lives' in the answer and say why the -s appears.",
            "support": {
              "l1_2": "Tap each color and listen, then point to the word 'does.'",
              "l3_4": "Rebuild the question and the answer, then name the job of each chunk.",
              "l5_6": "Rebuild both, then write a new question and answer about an oyster."
            },
            "payload": {
              "text": "Where does a hermit crab live? It lives in a tide pool on the rocky shore.",
              "chunks": [
                {
                  "text": "Where does a hermit crab live?",
                  "role": "A where-question: question word, 'does,' then the animal",
                  "tone": "concept"
                },
                {
                  "text": "It lives",
                  "role": "The answer starts with 'It' and a verb with -s",
                  "tone": "precision"
                },
                {
                  "text": "in a tide pool",
                  "role": "The exact home",
                  "tone": "evidence"
                },
                {
                  "text": "on the rocky shore.",
                  "role": "The bigger place around the home",
                  "tone": "precision"
                }
              ],
              "ask": "Which word has an -s in the answer but no -s in the question?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "info_gap",
            "domain": "Speaking",
            "title": "Habitat Detectives",
            "mission": "Ask your partner questions to find out where three missing animals live, and tell your partner about the three animals you know.",
            "grouping": "Partners",
            "minutes": 8,
            "tip": "Keep the cards hidden until both partners have asked every question, then compare to check the facts.",
            "materials": [
              "Habitat cards A and B"
            ],
            "support": {
              "l1_2": "Use the ask frame word for word and point to the animal picture while you ask.",
              "l3_4": "Ask in your own words, then say the answer back to check it.",
              "l5_6": "Ask a follow-up question, such as 'What does it find there?', and compare the two habitats."
            },
            "payload": {
              "goal": "Find the home of each animal your card does not show.",
              "a": {
                "title": "Explorer A",
                "has": [
                  {
                    "k": "Where the oyster lives",
                    "v": "on a reef on the bottom of the Chesapeake Bay"
                  },
                  {
                    "k": "Where a sea star lives",
                    "v": "in a tide pool on the rocky shore"
                  },
                  {
                    "k": "Where the dolphin lives",
                    "v": "in the open ocean, far from the shore"
                  }
                ],
                "needs": [
                  "Where the blue crab lives",
                  "Where the seahorse lives",
                  "Where the clownfish lives"
                ]
              },
              "b": {
                "title": "Explorer B",
                "has": [
                  {
                    "k": "Where the blue crab lives",
                    "v": "in the bay grass on the bottom of the Chesapeake Bay"
                  },
                  {
                    "k": "Where the seahorse lives",
                    "v": "in sea grass near the shore, holding on with its tail"
                  },
                  {
                    "k": "Where the clownfish lives",
                    "v": "in a warm coral reef, inside a sea anemone"
                  }
                ],
                "needs": [
                  "Where the oyster lives",
                  "Where a sea star lives",
                  "Where the dolphin lives"
                ]
              },
              "ask_frames": [
                "Where does the ___ live?",
                "Does the ___ live in a ___ or in a ___?"
              ],
              "tell_frames": [
                "It lives in ___.",
                "No, it does not live there. It lives in ___."
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Ask It, Answer It, Record It",
            "mission": "Ask where one animal lives, answer with the exact place, then record both and listen for the -s on 'lives.'",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask a partner to listen only for 'does ... live' and 'It lives'.",
            "klu": "Inform",
            "support": {
              "l1_2": "Say the question and the answer with the frame and one picture card.",
              "l3_4": "Ask and answer about two different animals without looking at the frame.",
              "l5_6": "Ask and answer about two animals, and add what each one finds in its home."
            },
            "payload": {
              "prompt": "Ask where an animal lives. Then answer your own question with the exact place.",
              "frame": "Where does the ___ live? It lives in ___ on ___.",
              "model": "Where does the oyster live? It lives on a reef in the Chesapeake Bay.",
              "checklist": [
                "I asked with 'does' and said 'live' with no -s.",
                "I said 'It lives' with an -s in my answer.",
                "I named the exact home with in, on, or near."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Vocabulary",
            "title": "Where Does It Live? Exit Check",
            "mission": "Answer three questions about asking and answering where a sea animal lives, then rate how well you can do it.",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Use the self-ratings to sort tomorrow's partners: pair 'with help' students with 'by myself' students.",
            "support": {
              "l1_2": "Listen to each question with the audio button, then tap an answer.",
              "l3_4": "Read each question, tap an answer, and read why it is right.",
              "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
            },
            "payload": {
              "can_do": "I can ask where an animal lives and answer in a complete sentence.",
              "items": [
                {
                  "q": "Which question is correct?",
                  "options": [
                    "Where lives the oyster?",
                    "Where does the oyster live?",
                    "Where the oyster lives?"
                  ],
                  "answer": 1,
                  "why": "English questions need 'does' before the animal, then the plain verb 'live.' Spanish and French can put the verb first, but English cannot."
                },
                {
                  "q": "A seahorse holds on to sea grass near the shore. Which answer is correct?",
                  "options": [
                    "It lives in sea grass near the shore.",
                    "It live in sea grass near the shore.",
                    "It lives in grass sea near the shore."
                  ],
                  "answer": 0,
                  "why": "'It' means one animal, so the verb needs -s: 'lives.' Also keep 'sea' first, because the describing word comes before the noun."
                },
                {
                  "q": "Why is a tide pool a good habitat for a sea star?",
                  "options": [
                    "It is deep, dark, and far from the shore.",
                    "It has no water, so nothing can reach it.",
                    "It has wet rocks to hold on to and food nearby."
                  ],
                  "answer": 2,
                  "why": "A habitat gives an animal what it needs. A tide pool has wet rocks for holding on and small food to eat."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say Homes",
          "mission": "Point to each home picture, say its English name, and say the short sentence about the animal that lives there.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the name of the home only.",
            "l3_4": "Say the name and the whole sentence.",
            "l5_6": "Say the sentence, then name one more animal that could live there."
          },
          "payload": {
            "items": [
              {
                "term": "tide pool",
                "icon": "🌊",
                "cue": "A small pool of seawater among rocks, with a crab and a sea star inside.",
                "say": "This is a tide pool. A sea star lives here.",
                "es": "charca de marea"
              },
              {
                "term": "oyster reef",
                "icon": "🦪",
                "cue": "Many oysters stuck together on the bottom of a bay, with small fish hiding between them.",
                "say": "This is an oyster reef. Oysters live here.",
                "es": "arrecife de ostras"
              },
              {
                "term": "open ocean",
                "icon": "🐬",
                "cue": "Wide blue water with no land in sight and a dolphin jumping.",
                "say": "This is the open ocean. A dolphin lives here.",
                "es": "mar abierto"
              },
              {
                "term": "bay grass",
                "icon": "🌿",
                "cue": "Tall green grass under the water with a small blue crab hiding in it.",
                "say": "This is bay grass. A blue crab hides here.",
                "es": "pastos marinos"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "Act Out the Homes",
          "mission": "Listen to each command and show the animal or its home with your hands and body.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model each action once, then give the command without modeling and watch for the right response.",
          "support": {
            "l1_2": "Copy the action with a partner while you listen.",
            "l3_4": "Do the action by yourself after you hear the command.",
            "l5_6": "Give the command to a partner and check what your partner does."
          },
          "payload": {
            "items": [
              {
                "command": "Make a small circle with your arms to show a tide pool.",
                "icon": "⭕"
              },
              {
                "command": "Put your hands together like an oyster shell, then open them.",
                "icon": "🦪"
              },
              {
                "command": "Walk your fingers sideways like a blue crab in the grass.",
                "icon": "🦀"
              },
              {
                "command": "Swim your arms like a dolphin in the open ocean.",
                "icon": "🐬"
              },
              {
                "command": "Point to the picture of the home of a sea star.",
                "icon": "👉"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Home Words in Two Languages",
          "mission": "Say each word or question in English and in your home language, then tell a partner how the two ways of asking are different.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add their home-language word; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner and point to the picture.",
            "l3_4": "Say both and tell one way they are alike or different.",
            "l5_6": "Say both and use each one in a question in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "habitat",
                "es": "hábitat",
                "note": "True cognate. In English say HAB-i-tat, with the strong sound on the first part, and no accent mark."
              },
              {
                "term": "Where does it live?",
                "es": "¿Dónde vive?",
                "note": "Spanish asks with one verb: '¿Dónde vive?' English adds a helper word: 'Where does it live?' and 'live' stays plain with no -s."
              },
              {
                "term": "bay",
                "es": "bahía",
                "note": "The Chesapeake Bay is la bahía de Chesapeake. A bay is a part of the ocean that reaches into the land."
              }
            ]
          }
        }
      ],
      "extension": null,
      "exit_check": {
        "kind": "exit_check",
        "domain": "Vocabulary",
        "title": "Where Does It Live? Exit Check",
        "mission": "Answer three questions about asking and answering where a sea animal lives, then rate how well you can do it.",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Use the self-ratings to sort tomorrow's partners: pair 'with help' students with 'by myself' students.",
        "support": {
          "l1_2": "Listen to each question with the audio button, then tap an answer.",
          "l3_4": "Read each question, tap an answer, and read why it is right.",
          "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
        },
        "payload": {
          "can_do": "I can ask where an animal lives and answer in a complete sentence.",
          "items": [
            {
              "q": "Which question is correct?",
              "options": [
                "Where lives the oyster?",
                "Where does the oyster live?",
                "Where the oyster lives?"
              ],
              "answer": 1,
              "why": "English questions need 'does' before the animal, then the plain verb 'live.' Spanish and French can put the verb first, but English cannot."
            },
            {
              "q": "A seahorse holds on to sea grass near the shore. Which answer is correct?",
              "options": [
                "It lives in sea grass near the shore.",
                "It live in sea grass near the shore.",
                "It lives in grass sea near the shore."
              ],
              "answer": 0,
              "why": "'It' means one animal, so the verb needs -s: 'lives.' Also keep 'sea' first, because the describing word comes before the noun."
            },
            {
              "q": "Why is a tide pool a good habitat for a sea star?",
              "options": [
                "It is deep, dark, and far from the shore.",
                "It has no water, so nothing can reach it.",
                "It has wet rocks to hold on to and food nearby."
              ],
              "answer": 2,
              "why": "A habitat gives an animal what it needs. A tide pool has wet rocks for holding on and small food to eat."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Five habitat photos (tide pool, oyster reef, bay grass, open ocean, coral reef)",
          "Animal picture cards",
          "A device with sound for each pair"
        ],
        "listen_for": [
          "Students ask with 'does' and the plain verb ('Where does the crab live?').",
          "Students say 'It lives' with -s in the answer.",
          "Students name an exact place with in, on, or near, not only 'the ocean'."
        ],
        "watchouts": [
          "Spanish, French, and Arabic speakers may put the verb first ('Where lives the crab?') or drop 'does' ('Where the crab lives?'). Show the pattern with fingers: where, does, animal, live.",
          "Students may put -s on both verbs ('Where does it lives?') or drop it in the answer ('It live in a tide pool'). Say 'one animal, one -s' and have students tap the -s on their palm in the answer only.",
          "Some students think a habitat is any wet place, so they say 'It lives in the water.' Ask 'What does it find there?' until they name food, shelter, or a place to hold on."
        ],
        "differentiation": {
          "l1_2": "Give the frames 'Where does the ___ live?' and 'It lives in ___' with picture cards. Accept a point plus the home word.",
          "l3_4": "Expect a complete question and a complete answer with in, on, or near. Ask students to answer a yes-no question as well ('Does it live in a pond?').",
          "l5_6": "Expect questions beyond 'where' ('What does it find there?'). Ask students to explain why the habitat suits the animal.",
          "newcomer": "Use Point and Say Homes, Act Out the Homes, and the Home Words bridge; accept pointing and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    },
    {
      "id": "g3-ela-u1-l03",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 3,
      "source": "authored",
      "title": "Central Idea and Key Details: Oysters Help the Bay",
      "core_lesson_ref": {
        "label": "Language session 3: central idea and key details",
        "source": "language_pathway"
      },
      "content_objective": "Students will read a short text about Chesapeake Bay oysters, state its central idea, and choose the key details that prove it instead of facts that only set the scene.",
      "language_objective": {
        "klu": "Explain",
        "function": "state a central idea and prove it with a key detail using 'because'",
        "forms": [
          "The central idea is that ___.",
          "One key detail is that ___.",
          "because + a full reason (who + what)"
        ],
        "by_level": {
          "l1_2": "I can point to a key detail in the text and say a short sentence about it: 'Oysters clean the water.'",
          "l3_4": "I can say a central idea and join one key detail to it with 'because,' finishing the reason with a who and a what.",
          "l5_6": "I can decide which details prove a central idea and which are only interesting facts, then explain my choices in writing."
        }
      },
      "standards": [
        "RI.3.2",
        "RI.3.1",
        "L.3.1.h",
        "SL.3.1.d"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Explain.Interpretive",
        "pld_targets": [
          "discourse",
          "sentence"
        ]
      },
      "vocab": [
        {
          "term": "central idea",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "detail",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "filter",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "ecosystem",
          "tier": 3,
          "new_or_review": "review"
        },
        {
          "term": "habitat",
          "tier": 3,
          "new_or_review": "review"
        }
      ],
      "mentor_sentence": {
        "text": "The central idea is that oysters help the bay because each oyster cleans a lot of water every day.",
        "chunks": [
          {
            "text": "The central idea is that",
            "role": "The big-idea starter",
            "tone": "concept",
            "ask": "Which words tell you the big idea is coming next?"
          },
          {
            "text": "oysters help the bay",
            "role": "The central idea itself",
            "tone": "precision",
            "ask": "What is the big idea about oysters and the bay?"
          },
          {
            "text": "because",
            "role": "The joining word that starts the proof",
            "tone": "connector",
            "ask": "Which small word tells you a reason is coming?"
          },
          {
            "text": "each oyster cleans a lot of water every day.",
            "role": "The key detail that proves the idea",
            "tone": "evidence",
            "ask": "What does each oyster do that proves the idea?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Habitat Memory Flip",
            "mission": "Flip each card to remember where animals live and how to ask about their homes, then say the answer before you check.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "Ask students to answer in complete sentences so yesterday's 'It lives in ___' pattern comes back before new work.",
            "support": {
              "l1_2": "Look at the icon and say the answer with your partner.",
              "l3_4": "Answer in a full sentence, then flip to check.",
              "l5_6": "Answer, then add one more fact to your answer."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "Where does an oyster live?",
                  "answer": "It lives on a reef on the bottom of the Chesapeake Bay.",
                  "icon": "🦪"
                },
                {
                  "prompt": "Which is correct: 'Where lives the crab?' or 'Where does the crab live?'",
                  "answer": "Where does the crab live?",
                  "icon": "🦀"
                },
                {
                  "prompt": "What is a habitat?",
                  "answer": "The place where a plant or animal lives and finds what it needs.",
                  "icon": "🌊"
                },
                {
                  "prompt": "What is a detail?",
                  "answer": "A small fact that helps explain a bigger idea.",
                  "icon": "🔍"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "What Big Idea Does It Prove?",
            "mission": "Listen to each oyster fact and tap the big idea that the fact helps prove.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each fact twice, then ask 'Which idea does this fact help prove?' before students tap.",
            "support": {
              "l1_2": "Listen, tap a sentence, then listen again with the words showing.",
              "l3_4": "Tap the idea and say 'This detail proves that ___.'",
              "l5_6": "Tap the idea, then say why each other choice is not proved by the fact."
            },
            "payload": {
              "items": [
                {
                  "say": "One oyster pulls in dirty water, keeps the tiny bits inside, and pushes clean water back out.",
                  "options": [
                    {
                      "label": "Oysters clean the bay water."
                    },
                    {
                      "label": "Oysters are good to eat."
                    },
                    {
                      "label": "Oysters are hard to find."
                    }
                  ],
                  "answer": 0,
                  "why": "Pulling in dirty water and pushing out clean water proves that oysters clean the water. The other ideas are not about what the oyster does."
                },
                {
                  "say": "Clear water lets sunlight reach the bay grasses, and baby crabs hide in the grasses.",
                  "options": [
                    {
                      "label": "Crabs are the biggest animal in the bay."
                    },
                    {
                      "label": "Clean water helps the whole bay."
                    },
                    {
                      "label": "Sunlight makes the water hot."
                    }
                  ],
                  "answer": 1,
                  "why": "Clear water gives light to the grass, and the grass hides baby crabs, so clean water helps many parts of the bay."
                },
                {
                  "say": "Oysters grow close together and build a reef, and small fish and crabs hide between the shells.",
                  "options": [
                    {
                      "label": "Oysters swim fast across the bay."
                    },
                    {
                      "label": "Oysters make the water muddy."
                    },
                    {
                      "label": "Oysters build a home for other animals."
                    }
                  ],
                  "answer": 2,
                  "why": "A reef with hiding places for fish and crabs shows that oysters build a home for other animals."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Central Idea Sentence X-Ray",
            "mission": "Look inside the oyster sentence to find the chunk that states the big idea and the chunk that proves it.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Ask students to cover the last chunk and see that the idea stands alone, then uncover it to see the proof.",
            "support": {
              "l1_2": "Tap each color and listen, then point to the word 'because.'",
              "l3_4": "Rebuild the sentence and say what each chunk does.",
              "l5_6": "Rebuild it, then write a new sentence about blue crabs with the same four chunks."
            },
            "payload": {
              "text": "The central idea is that oysters help the bay because each oyster cleans a lot of water every day.",
              "chunks": [
                {
                  "text": "The central idea is that",
                  "role": "The big-idea starter",
                  "tone": "concept"
                },
                {
                  "text": "oysters help the bay",
                  "role": "The central idea itself",
                  "tone": "precision"
                },
                {
                  "text": "because",
                  "role": "The joining word that starts the proof",
                  "tone": "connector"
                },
                {
                  "text": "each oyster cleans a lot of water every day.",
                  "role": "The key detail that proves the idea",
                  "tone": "evidence"
                }
              ],
              "ask": "Which chunk would be left unfinished if you stopped the sentence after the word 'because'?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "read_annotate",
            "domain": "Reading",
            "title": "Prove It: Oysters and the Bay",
            "mission": "Read the oyster text with your partner, mark the key details that prove the central idea, and circle the facts that only set the scene.",
            "grouping": "Partners",
            "minutes": 8,
            "tip": "Ask partners to point to the sentence that proves each answer before they choose it.",
            "materials": [
              "Highlighters or colored pencils"
            ],
            "support": {
              "l1_2": "Mark only the key details and read each one aloud with your partner.",
              "l3_4": "Mark both kinds of facts and answer the three questions.",
              "l5_6": "Mark both kinds, answer the questions, and write the central idea in your own words."
            },
            "payload": {
              "text": "Oysters live on reefs in the Chesapeake Bay. An oyster pulls in water, keeps the tiny bits of food, and pushes clean water out. One oyster can clean many gallons of water in a single day. Clear water lets sunlight reach the bay grasses. Baby crabs and small fish hide in those grasses and between the oyster shells. Many people in Maryland also like to eat oysters.",
              "marks": [
                {
                  "label": "Key details",
                  "instruction": "Underline four facts that prove oysters help the bay.",
                  "targets": [
                    "pushes clean water out",
                    "can clean many gallons of water in a single day",
                    "Clear water lets sunlight reach the bay grasses",
                    "hide in those grasses and between the oyster shells"
                  ]
                },
                {
                  "label": "True facts that do not prove it",
                  "instruction": "Circle two facts that are true but do not prove that oysters help the bay.",
                  "targets": [
                    "Oysters live on reefs in the Chesapeake Bay",
                    "Many people in Maryland also like to eat oysters"
                  ]
                }
              ],
              "questions": [
                {
                  "q": "What is the central idea of the text?",
                  "options": [
                    "Oysters live in Maryland.",
                    "Oysters help keep the bay healthy.",
                    "Baby crabs like grass."
                  ],
                  "answer": 1,
                  "why": "Almost every detail shows how oysters help the bay: clean water, more sunlight, and a place to hide."
                },
                {
                  "q": "Which key detail best proves the central idea?",
                  "options": [
                    "Many people in Maryland also like to eat oysters.",
                    "Oysters live on reefs in the Chesapeake Bay.",
                    "One oyster can clean many gallons of water in a single day."
                  ],
                  "answer": 2,
                  "why": "Cleaning a lot of water shows exactly how an oyster helps the bay. The other two facts do not prove it."
                },
                {
                  "q": "How does clear water help the bay grasses?",
                  "options": [
                    "Sunlight can reach the grasses.",
                    "The grasses can grow in the dark.",
                    "Clear water keeps crabs out of the grasses."
                  ],
                  "answer": 0,
                  "why": "The text says clear water lets sunlight reach the grasses, and plants need sunlight to grow."
                }
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Prove Your Idea Aloud",
            "mission": "State a central idea about a bay animal, prove it with 'because,' then record yourself and listen back.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask a partner to listen for a full reason after 'because.'",
            "klu": "Explain",
            "support": {
              "l1_2": "Use the frame and say one full sentence with 'because.'",
              "l3_4": "Say the central idea with 'because,' then add one more key detail.",
              "l5_6": "Say the idea and two key details, and tell which detail is the strongest proof."
            },
            "payload": {
              "prompt": "Pick a bay animal. Say the central idea about how it needs or helps the bay, and prove it with 'because.'",
              "frame": "The central idea is that ___ because ___. One key detail is that ___.",
              "model": "The central idea is that baby crabs need bay grass because the grass hides them from hungry fish. One key detail is that clear water lets sunlight reach the grass.",
              "checklist": [
                "I said the central idea in one full sentence.",
                "I finished my reason after 'because' with who and what.",
                "My key detail really proves my idea."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Reading",
            "title": "Central Idea and Because Exit Check",
            "mission": "Answer three questions about central ideas and key details, then rate how well you can prove an idea with 'because.'",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Sort the can-do ratings to decide who needs the topic-versus-central-idea mini-lesson tomorrow.",
            "support": {
              "l1_2": "Listen to each question, then tap an answer.",
              "l3_4": "Read each question, tap an answer, and read why it is right.",
              "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
            },
            "payload": {
              "can_do": "I can state a central idea and prove it with a key detail and 'because.'",
              "items": [
                {
                  "q": "Which sentence is a complete central idea with a reason?",
                  "options": [
                    "Oysters help the bay because.",
                    "Oysters help the bay because they clean the water.",
                    "Oysters help the bay because clean."
                  ],
                  "answer": 1,
                  "why": "After 'because' you need a whole reason with a who and a what: 'they clean the water.' The other two stop too early."
                },
                {
                  "q": "The central idea is that blue crabs hide in bay grass to stay safe. Which detail proves it?",
                  "options": [
                    "Blue crabs are good to eat with butter.",
                    "Blue crabs walk sideways.",
                    "Hungry fish cannot see a small crab inside tall grass."
                  ],
                  "answer": 2,
                  "why": "Only the third detail shows hiding to stay safe. The other facts are true but do not prove the idea."
                },
                {
                  "q": "Which choice is only a topic, not a central idea?",
                  "options": [
                    "Oysters in the bay.",
                    "Oysters clean the bay water.",
                    "Oysters help the bay."
                  ],
                  "answer": 0,
                  "why": "'Oysters in the bay' tells what the text is about, but it does not say what the author wants you to learn about oysters."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say Oyster Words",
          "mission": "Point to each picture about oysters, say the English word, and say the short sentence that goes with it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the word only.",
            "l3_4": "Say the word and the whole sentence.",
            "l5_6": "Say the sentence, then add one more fact about the picture."
          },
          "payload": {
            "items": [
              {
                "term": "oyster",
                "icon": "🦪",
                "cue": "An open oyster on a reef, with a little water flowing in and flowing out.",
                "say": "This is an oyster. It cleans the water.",
                "es": "ostra"
              },
              {
                "term": "clean water",
                "icon": "💧",
                "cue": "Two glasses side by side: one with cloudy brown water and one with clear water.",
                "say": "This water is dirty. This water is clean.",
                "es": "agua limpia"
              },
              {
                "term": "bay grass",
                "icon": "🌿",
                "cue": "Tall green grass under the water with a small crab hiding in it.",
                "say": "A crab hides in the grass.",
                "es": "pastos marinos"
              },
              {
                "term": "sunlight",
                "icon": "☀️",
                "cue": "Sun rays going down through clear water to green grass on the bottom.",
                "say": "Sunlight reaches the grass.",
                "es": "luz del sol"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "Be an Oyster",
          "mission": "Listen to each command and act out how an oyster cleans the water or how the bay helps its animals.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model each action once, then give the command without modeling and watch for the right response.",
          "support": {
            "l1_2": "Copy the action with a partner while you listen.",
            "l3_4": "Do the action by yourself after you hear the command.",
            "l5_6": "Give the command to a partner and check the response."
          },
          "payload": {
            "items": [
              {
                "command": "Cup your hands like an oyster and open them slowly.",
                "icon": "🦪"
              },
              {
                "command": "Pull your hands in like dirty water, then push them out like clean water.",
                "icon": "💧"
              },
              {
                "command": "Hide behind your hands like a small crab in the grass.",
                "icon": "🦀"
              },
              {
                "command": "Point up to the sunlight.",
                "icon": "☀️"
              },
              {
                "command": "Point to the picture with the clean water.",
                "icon": "👉"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Idea Words in Two Languages",
          "mission": "Say each idea word in English and in your home language, then tell a partner how the two words are used.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add words from any home language; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner.",
            "l3_4": "Say both and one way they are alike or different.",
            "l5_6": "Say both and use each one in a sentence in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "central idea",
                "es": "idea central / idea principal",
                "note": "In Spanish, say 'idea central' or 'idea principal.' It is the big point of the whole text, not one small fact."
              },
              {
                "term": "detail",
                "es": "detalle",
                "note": "True cognate: the spelling and meaning match. Stress the second part in English: de-TAIL."
              },
              {
                "term": "because",
                "es": "porque",
                "note": "'Porque' (one word) means 'because.' In Spanish, 'por qué' (two words) is the question 'why?' and in English 'because' always starts the reason."
              }
            ]
          }
        },
        {
          "kind": "cognate_detective",
          "domain": "Vocabulary",
          "title": "Cognates in the Bay",
          "mission": "Sort six words from the oyster text with their Spanish partners into true cognate or no look-alike, and say what helps you remember each one.",
          "grouping": "Small Group",
          "minutes": 4,
          "tip": "Celebrate every guess; the 'why' teaches the spelling pattern, so students can find new cognates alone.",
          "support": {
            "l1_2": "Say each English word and its Spanish word, then point to a bin.",
            "l3_4": "Sort the pairs and read the reason for each answer.",
            "l5_6": "Sort the pairs, then find one more cognate from today's text."
          },
          "payload": {
            "items": [
              {
                "term": "detail",
                "es": "detalle",
                "status": "true",
                "why": "Same meaning and almost the same spelling: -ail becomes -alle."
              },
              {
                "term": "filter",
                "es": "filtrar",
                "status": "true",
                "why": "The meaning matches. The English noun and verb are both 'filter,' and the Spanish verb ends in -ar."
              },
              {
                "term": "gallon",
                "es": "galón",
                "status": "true",
                "why": "Same meaning and almost the same spelling. Add an accent mark in Spanish."
              },
              {
                "term": "oyster",
                "es": "ostra",
                "status": "true",
                "why": "Both words come from the same old word, so the first sounds match: 'oy-' and 'os-.' The ending changes."
              },
              {
                "term": "bay",
                "es": "bahía",
                "status": "none",
                "why": "A bay is a part of the ocean that reaches into the land. The Spanish word does not look like the English word."
              },
              {
                "term": "clean",
                "es": "limpio",
                "status": "none",
                "why": "These words do not look alike. Remember 'clean' by touching something clean."
              }
            ]
          }
        }
      ],
      "extension": null,
      "exit_check": {
        "kind": "exit_check",
        "domain": "Reading",
        "title": "Central Idea and Because Exit Check",
        "mission": "Answer three questions about central ideas and key details, then rate how well you can prove an idea with 'because.'",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Sort the can-do ratings to decide who needs the topic-versus-central-idea mini-lesson tomorrow.",
        "support": {
          "l1_2": "Listen to each question, then tap an answer.",
          "l3_4": "Read each question, tap an answer, and read why it is right.",
          "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
        },
        "payload": {
          "can_do": "I can state a central idea and prove it with a key detail and 'because.'",
          "items": [
            {
              "q": "Which sentence is a complete central idea with a reason?",
              "options": [
                "Oysters help the bay because.",
                "Oysters help the bay because they clean the water.",
                "Oysters help the bay because clean."
              ],
              "answer": 1,
              "why": "After 'because' you need a whole reason with a who and a what: 'they clean the water.' The other two stop too early."
            },
            {
              "q": "The central idea is that blue crabs hide in bay grass to stay safe. Which detail proves it?",
              "options": [
                "Blue crabs are good to eat with butter.",
                "Blue crabs walk sideways.",
                "Hungry fish cannot see a small crab inside tall grass."
              ],
              "answer": 2,
              "why": "Only the third detail shows hiding to stay safe. The other facts are true but do not prove the idea."
            },
            {
              "q": "Which choice is only a topic, not a central idea?",
              "options": [
                "Oysters in the bay.",
                "Oysters clean the bay water.",
                "Oysters help the bay."
              ],
              "answer": 0,
              "why": "'Oysters in the bay' tells what the text is about, but it does not say what the author wants you to learn about oysters."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Copies of the oyster text or the digital player",
          "Highlighters or colored pencils",
          "A device with sound for each pair"
        ],
        "listen_for": [
          "Students say 'The central idea is that ___' as a whole sentence, not one word.",
          "Students finish the reason after 'because' with who and what.",
          "Students reject facts that are true but do not prove the idea, and can say why."
        ],
        "watchouts": [
          "Students often write a topic ('Oysters in the bay') or a long list of facts and call it a central idea. Ask 'What does the author want me to learn about oysters?'",
          "Because-fragments are common ('Oysters help because.' or 'Because they clean.'). Spanish 'porque' and Haitian Creole 'paske' can start a stand-alone answer, so students think a fragment is a whole sentence. Require who + does what after 'because.'",
          "Students choose interesting facts, like people eating oysters, as key details. Use the test 'Does this fact prove the idea, or only tell me something true?'"
        ],
        "differentiation": {
          "l1_2": "Give the frame 'Oysters ___ the water.' and point to the key details together. Accept one short, true sentence.",
          "l3_4": "Expect a central idea joined to one key detail with 'because' and a full reason.",
          "l5_6": "Expect two key details and a reason that says why the strongest detail proves the idea.",
          "newcomer": "Use Point and Say, Be an Oyster, the idea-word bridge, and Cognates in the Bay; accept pointing and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    },
    {
      "id": "g3-ela-u1-l04",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 4,
      "source": "authored",
      "title": "Compare a Tide Pool and the Deep Ocean",
      "core_lesson_ref": {
        "label": "Language session 4: comparing habitats",
        "source": "language_pathway"
      },
      "content_objective": "Students will compare two ocean habitats, a tide pool and the deep ocean, by sorting facts about light, depth, and temperature and by stating one likeness and two differences.",
      "language_objective": {
        "klu": "Inform",
        "function": "compare two habitats by telling how they are alike and how they are different",
        "forms": [
          "Both ___ and ___ are ___.",
          "___ is ___, but ___ is ___.",
          "while / but / both"
        ],
        "by_level": {
          "l1_2": "I can sort picture cards into tide pool, deep ocean, and both, and say 'A tide pool is shallow. The deep ocean is dark.'",
          "l3_4": "I can tell one way two habitats are alike with 'both' and one way they are different with 'but.'",
          "l5_6": "I can write a comparison with one likeness and two differences using 'both,' 'but,' and 'while,' and explain why a difference matters to the animals."
        }
      },
      "standards": [
        "RI.3.9",
        "L.3.1.h",
        "SL.3.4",
        "W.3.2"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Inform.Expressive",
        "pld_targets": [
          "discourse",
          "sentence",
          "word"
        ]
      },
      "vocab": [
        {
          "term": "compare",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "shallow",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "depth",
          "tier": 2,
          "new_or_review": "review"
        },
        {
          "term": "tide pool",
          "tier": 3,
          "new_or_review": "review"
        },
        {
          "term": "habitat",
          "tier": 3,
          "new_or_review": "review"
        }
      ],
      "mentor_sentence": {
        "text": "Both are salty habitats, but a tide pool is shallow and bright while the deep ocean is dark and cold.",
        "chunks": [
          {
            "text": "Both are salty habitats,",
            "role": "A likeness: what the two places share",
            "tone": "concept",
            "ask": "What do both places share?"
          },
          {
            "text": "but",
            "role": "The joining word that turns to a difference",
            "tone": "connector",
            "ask": "Which word tells you the sentence is about to show a difference?"
          },
          {
            "text": "a tide pool is shallow and bright",
            "role": "Describing the first habitat",
            "tone": "evidence",
            "ask": "Which two describing words tell what a tide pool is like?"
          },
          {
            "text": "while",
            "role": "A second joining word that sets the habitats side by side",
            "tone": "connector",
            "ask": "Which word puts the two habitats side by side?"
          },
          {
            "text": "the deep ocean is dark and cold.",
            "role": "Describing the second habitat",
            "tone": "precision",
            "ask": "Which two describing words tell what the deep ocean is like?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Idea and Because Flip",
            "mission": "Flip each card to remember what a tide pool is, how 'because' works, and what a central idea does, then check yourself.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "Have students answer in a full sentence so the 'because' pattern from yesterday returns before new work.",
            "support": {
              "l1_2": "Look at the icon, say the answer with your partner, and flip to check.",
              "l3_4": "Answer in a full sentence before you flip the card.",
              "l5_6": "Answer, then add an example from the oyster text."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "What is a tide pool?",
                  "answer": "A small pool of salt water that stays on the rocks when the tide goes out.",
                  "icon": "🌊"
                },
                {
                  "prompt": "Which word means the rise and fall of ocean water at the shore each day?",
                  "answer": "The tide.",
                  "icon": "🌗"
                },
                {
                  "prompt": "What must come after the word 'because' in a sentence?",
                  "answer": "A full reason with a who and a what, like 'they clean the water.'",
                  "icon": "💬"
                },
                {
                  "prompt": "What is a central idea?",
                  "answer": "The most important point a text makes about its topic.",
                  "icon": "💡"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "Which Habitat Do You Hear?",
            "mission": "Listen to each description and tap tide pool, deep ocean, or both, depending on where the description fits.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each description twice and stress the describing words; ask students which word made them choose.",
            "support": {
              "l1_2": "Listen, tap, then listen again while you read the words.",
              "l3_4": "Tap and say 'It is a ___ because ___.' to a partner.",
              "l5_6": "Tap, then say which describing words fit only one habitat and which fit both."
            },
            "payload": {
              "items": [
                {
                  "say": "Sunlight shines through the shallow water, and a sea star crawls on a warm rock.",
                  "options": [
                    {
                      "label": "tide pool"
                    },
                    {
                      "label": "deep ocean"
                    },
                    {
                      "label": "both"
                    }
                  ],
                  "answer": 0,
                  "why": "Sunlight, shallow water, and a warm rock describe a tide pool. In the deep ocean, sunlight cannot reach."
                },
                {
                  "say": "It is very dark here, and the water is icy cold. A fish with a glowing light swims by.",
                  "options": [
                    {
                      "label": "both"
                    },
                    {
                      "label": "deep ocean"
                    },
                    {
                      "label": "tide pool"
                    }
                  ],
                  "answer": 1,
                  "why": "No sunlight and very cold water describe the deep ocean. Some deep-sea fish make their own light."
                },
                {
                  "say": "The water here is salty, and the animals find food and a place to stay safe.",
                  "options": [
                    {
                      "label": "tide pool"
                    },
                    {
                      "label": "deep ocean"
                    },
                    {
                      "label": "both"
                    }
                  ],
                  "answer": 2,
                  "why": "Both habitats have salty water, and animals in both places need food and shelter, so the answer is both."
                },
                {
                  "say": "When the tide goes out, the water here gets low and warm, and the animals must hold on.",
                  "options": [
                    {
                      "label": "both"
                    },
                    {
                      "label": "tide pool",
                      "icon": "🌊"
                    },
                    {
                      "label": "deep ocean"
                    }
                  ],
                  "answer": 1,
                  "why": "The tide changes the water level in a tide pool. The deep ocean is too far from shore to feel the tide the same way."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Comparison Sentence X-Ray",
            "mission": "Look inside the comparison sentence to find the likeness, the two differences, and the words that connect them.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Ask students to point to 'but' and 'while' and explain that both words put two things side by side.",
            "support": {
              "l1_2": "Tap each color and listen, then point to the word 'both.'",
              "l3_4": "Rebuild the sentence and say the job of each chunk.",
              "l5_6": "Rebuild it, then write a new sentence comparing a bay and the open ocean with the same chunks."
            },
            "payload": {
              "text": "Both are salty habitats, but a tide pool is shallow and bright while the deep ocean is dark and cold.",
              "chunks": [
                {
                  "text": "Both are salty habitats,",
                  "role": "A likeness: what the two places share",
                  "tone": "concept"
                },
                {
                  "text": "but",
                  "role": "The joining word that turns to a difference",
                  "tone": "connector"
                },
                {
                  "text": "a tide pool is shallow and bright",
                  "role": "Describing the first habitat",
                  "tone": "evidence"
                },
                {
                  "text": "while",
                  "role": "A second joining word that sets the habitats side by side",
                  "tone": "connector"
                },
                {
                  "text": "the deep ocean is dark and cold.",
                  "role": "Describing the second habitat",
                  "tone": "precision"
                }
              ],
              "ask": "Which word shows what is the same, and which two words show what is different?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "word_sort",
            "domain": "Vocabulary",
            "title": "Tide Pool or Deep Ocean?",
            "mission": "Sort each fact into tide pool, deep ocean, or both, and tell your partner why with the word 'because.'",
            "grouping": "Partners",
            "minutes": 8,
            "tip": "Ask one partner to place a card and the other to say 'It goes there because ___' before the card is locked.",
            "materials": [
              "Fact cards or the digital sort"
            ],
            "support": {
              "l1_2": "Look at the picture on each card and sort the six easiest cards first.",
              "l3_4": "Sort all nine cards and say 'It goes in ___ because ___.'",
              "l5_6": "Sort all nine, then write one sentence with 'but' for a pair of cards."
            },
            "payload": {
              "categories": [
                {
                  "name": "Tide pool"
                },
                {
                  "name": "Deep ocean"
                },
                {
                  "name": "Both"
                }
              ],
              "items": [
                {
                  "text": "Shallow water with sunlight",
                  "cat": 0
                },
                {
                  "text": "Waves splash in at high tide",
                  "cat": 0
                },
                {
                  "text": "Water drains away at low tide",
                  "cat": 0
                },
                {
                  "text": "No sunlight at all",
                  "cat": 1
                },
                {
                  "text": "Very cold water",
                  "cat": 1
                },
                {
                  "text": "Fish that make their own light",
                  "cat": 1
                },
                {
                  "text": "Salt water",
                  "cat": 2
                },
                {
                  "text": "Animals that need food",
                  "cat": 2
                },
                {
                  "text": "A habitat with shelter",
                  "cat": 2
                }
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Compare It Aloud",
            "mission": "Tell one way a tide pool and the deep ocean are alike and two ways they are different, then record yourself.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask a partner to listen for 'both' once and 'but' or 'while' once.",
            "klu": "Inform",
            "support": {
              "l1_2": "Use the frame and say one likeness and one difference.",
              "l3_4": "Say one likeness with 'both' and one difference with 'but.'",
              "l5_6": "Say one likeness and two differences using 'both,' 'but,' and 'while.'"
            },
            "payload": {
              "prompt": "Compare a tide pool and the deep ocean: one way they are alike and two ways they are different.",
              "frame": "Both ___ and ___ are ___. A tide pool is ___, but the deep ocean is ___.",
              "model": "Both have animals that must find food. A tide pool is sunny and shallow, but the deep ocean is dark and very far down.",
              "checklist": [
                "I used 'both' to tell what is the same.",
                "I used 'but' or 'while' to tell what is different.",
                "I used describing words from the sort, like shallow, dark, cold, or bright."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Reading",
            "title": "Compare Habitats Exit Check",
            "mission": "Answer three questions about comparing a tide pool and the deep ocean, then rate how well you can compare two habitats.",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Use the self-ratings to choose who writes a comparison paragraph with you and who writes it alone.",
            "support": {
              "l1_2": "Listen to each question with the audio button, then tap an answer.",
              "l3_4": "Read each question, tap an answer, and read why it is right.",
              "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
            },
            "payload": {
              "can_do": "I can compare two habitats with both, but, and while.",
              "items": [
                {
                  "q": "Which sentence compares the habitats correctly?",
                  "options": [
                    "A tide pool shallow, but the deep ocean dark.",
                    "A tide pool is shallow, because the deep ocean is dark.",
                    "A tide pool is shallow, but the deep ocean is dark."
                  ],
                  "answer": 2,
                  "why": "'But' shows a difference, and each part needs 'is.' 'Because' would say one thing causes the other, and leaving out 'is' makes the sentence incomplete."
                },
                {
                  "q": "Which fact is true for both a tide pool and the deep ocean?",
                  "options": [
                    "Sunlight never reaches it.",
                    "It has salt water.",
                    "It changes with every tide."
                  ],
                  "answer": 1,
                  "why": "Both are part of the ocean, so both have salt water. Sunlight never reaches the deep ocean, and tides change the tide pool."
                },
                {
                  "q": "Which sentence uses 'both' correctly?",
                  "options": [
                    "Both a tide pool and a reef are habitats.",
                    "Both a tide pool and a reef is habitats.",
                    "Both a tide pool and a reef habitat."
                  ],
                  "answer": 0,
                  "why": "'Both' means two things, so use 'are.' The other sentences use 'is' with two things or leave out the verb."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say Habitat Words",
          "mission": "Point to each habitat picture, say the describing word in English, and say the short sentence that goes with it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the describing word only.",
            "l3_4": "Say the word and the whole sentence.",
            "l5_6": "Say the sentence, then say its opposite, like 'shallow' and 'deep.'"
          },
          "payload": {
            "items": [
              {
                "term": "shallow",
                "icon": "🏖️",
                "cue": "A tide pool just a few inches deep, with sunlight on the sandy bottom.",
                "say": "This water is shallow. It is bright.",
                "es": "poco profundo"
              },
              {
                "term": "deep",
                "icon": "🌊",
                "cue": "Dark blue water going down and down, with no bottom in sight.",
                "say": "This water is deep. It is dark.",
                "es": "profundo"
              },
              {
                "term": "cold",
                "icon": "🧊",
                "cue": "Icy blue water next to a thermometer that shows a very low number.",
                "say": "The deep ocean is cold.",
                "es": "frío"
              },
              {
                "term": "bright",
                "icon": "☀️",
                "cue": "A tide pool with strong sun on the water and a crab walking in the light.",
                "say": "The tide pool is bright.",
                "es": "luminoso"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "Show the Habitats",
          "mission": "Listen to each command and show deep, shallow, cold, or bright with your hands and body.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model each action once, then give the command without modeling and watch for the right response.",
          "support": {
            "l1_2": "Copy the action with a partner while you listen.",
            "l3_4": "Do the action by yourself after you hear the command.",
            "l5_6": "Give the command to a partner and check the response."
          },
          "payload": {
            "items": [
              {
                "command": "Hold your hand low to show shallow water.",
                "icon": "✋"
              },
              {
                "command": "Reach your hand high above your head to show deep water.",
                "icon": "🙌"
              },
              {
                "command": "Hug yourself and shiver to show cold water.",
                "icon": "🥶"
              },
              {
                "command": "Point to the picture with sunlight.",
                "icon": "☀️"
              },
              {
                "command": "Cover your eyes to show a dark place.",
                "icon": "🙈"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Compare Words in Two Languages",
          "mission": "Say each comparing word in English and in your home language, then tell a partner how English uses it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add words from any home language; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner.",
            "l3_4": "Say both and one way they are alike or different.",
            "l5_6": "Say both and use each one in a sentence in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "shallow",
                "es": "poco profundo",
                "note": "Spanish says 'poco profundo,' which means 'not very deep.' English has one word, 'shallow,' and its opposite is 'deep.'"
              },
              {
                "term": "both",
                "es": "ambos / los dos",
                "note": "'Both' means 'ambos' or 'los dos.' In English it comes before the two things and goes with 'are,' as in 'Both are salty.'"
              },
              {
                "term": "tide pool",
                "es": "charca de marea",
                "note": "'Pool' also means 'piscina,' a swimming pool, but a tide pool is a small natural pool of sea water left on the rocks."
              }
            ]
          }
        }
      ],
      "extension": null,
      "exit_check": {
        "kind": "exit_check",
        "domain": "Reading",
        "title": "Compare Habitats Exit Check",
        "mission": "Answer three questions about comparing a tide pool and the deep ocean, then rate how well you can compare two habitats.",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Use the self-ratings to choose who writes a comparison paragraph with you and who writes it alone.",
        "support": {
          "l1_2": "Listen to each question with the audio button, then tap an answer.",
          "l3_4": "Read each question, tap an answer, and read why it is right.",
          "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
        },
        "payload": {
          "can_do": "I can compare two habitats with both, but, and while.",
          "items": [
            {
              "q": "Which sentence compares the habitats correctly?",
              "options": [
                "A tide pool shallow, but the deep ocean dark.",
                "A tide pool is shallow, because the deep ocean is dark.",
                "A tide pool is shallow, but the deep ocean is dark."
              ],
              "answer": 2,
              "why": "'But' shows a difference, and each part needs 'is.' 'Because' would say one thing causes the other, and leaving out 'is' makes the sentence incomplete."
            },
            {
              "q": "Which fact is true for both a tide pool and the deep ocean?",
              "options": [
                "Sunlight never reaches it.",
                "It has salt water.",
                "It changes with every tide."
              ],
              "answer": 1,
              "why": "Both are part of the ocean, so both have salt water. Sunlight never reaches the deep ocean, and tides change the tide pool."
            },
            {
              "q": "Which sentence uses 'both' correctly?",
              "options": [
                "Both a tide pool and a reef are habitats.",
                "Both a tide pool and a reef is habitats.",
                "Both a tide pool and a reef habitat."
              ],
              "answer": 0,
              "why": "'Both' means two things, so use 'are.' The other sentences use 'is' with two things or leave out the verb."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Photos of a tide pool and the deep ocean",
          "Fact cards for the sort",
          "Large paper for a three-column chart"
        ],
        "listen_for": [
          "Students use 'both' for a likeness and 'but' or 'while' for a difference, not the other way around.",
          "Students include 'is' or 'are' in every part of the comparison.",
          "Students give a reason ('because it has no sunlight') when they sort a card."
        ],
        "watchouts": [
          "Arabic and Haitian Creole speakers may leave out 'is' in comparisons ('A tide pool shallow'). Tap 'is' on the board before every describing word and have students say the full sentence.",
          "Students may say 'Both is' because 'both' feels like one idea. Teach 'two things, so are.' Some also use 'because' for a difference ('A tide pool is shallow because the deep ocean is dark'); ask whether one thing causes the other or the two are just different.",
          "Some students think the deep ocean is just a bigger tide pool. Check the science: sunlight fades with depth, so only the top layer is bright, and the deep ocean is very cold and dark."
        ],
        "differentiation": {
          "l1_2": "Give picture cards and the frame 'A tide pool is ___.' Accept one sorted card and one describing word.",
          "l3_4": "Expect one likeness with 'both' and one difference with 'but,' each with a verb.",
          "l5_6": "Expect a likeness and two differences using 'while' as well, plus a reason a difference matters to the animals.",
          "newcomer": "Use Point and Say Habitat Words, Show the Habitats, and the compare bridge; accept pointing, acting, and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    },
    {
      "id": "g3-ela-u1-l05",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 5,
      "source": "authored",
      "title": "Sequence a Bay Food Chain with First, Next, Then",
      "core_lesson_ref": {
        "label": "Language session 5: sequencing a food chain",
        "source": "language_pathway"
      },
      "content_objective": "Students will put the steps of a Chesapeake Bay food chain (sunlight, algae, menhaden, osprey) in order and explain that energy moves from each living thing to the one that eats it.",
      "language_objective": {
        "klu": "Explain",
        "function": "tell the steps of a food chain in order using sequence words",
        "forms": [
          "First, ___. Next, ___. Then, ___.",
          "___ eats ___ (present tense)",
          "Finally, ___, so ___"
        ],
        "by_level": {
          "l1_2": "I can put three picture cards in order and say 'First, algae. Next, fish. Then, osprey.'",
          "l3_4": "I can tell a four-step food chain with first, next, then, and finally, keeping every verb in the present tense.",
          "l5_6": "I can explain how energy moves along a food chain, using sequence words and 'because' to link each step to the one before it."
        }
      },
      "standards": [
        "RI.3.3",
        "W.3.2",
        "L.3.1.e",
        "SL.3.4"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Explain.Expressive",
        "pld_targets": [
          "discourse",
          "sentence"
        ]
      },
      "vocab": [
        {
          "term": "food chain",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "energy",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "algae",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "osprey",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "ecosystem",
          "tier": 3,
          "new_or_review": "review"
        }
      ],
      "mentor_sentence": {
        "text": "First, algae use sunlight to grow, next a menhaden eats the algae, and then an osprey eats the menhaden.",
        "chunks": [
          {
            "text": "First,",
            "role": "Sequence word: the beginning",
            "tone": "connector",
            "ask": "Which word tells you this is the first step?"
          },
          {
            "text": "algae use sunlight to grow,",
            "role": "Step one: where the energy begins",
            "tone": "concept",
            "ask": "What do the algae use to grow?"
          },
          {
            "text": "next",
            "role": "Sequence word: the second step",
            "tone": "connector",
            "ask": "Which word moves you to the second step?"
          },
          {
            "text": "a menhaden eats the algae,",
            "role": "Step two: the first animal in the chain",
            "tone": "evidence",
            "ask": "Who eats the algae in step two?"
          },
          {
            "text": "and then",
            "role": "Sequence word: the third step",
            "tone": "connector",
            "ask": "Which two words move you to the last step?"
          },
          {
            "text": "an osprey eats the menhaden.",
            "role": "Step three: the last animal in the chain",
            "tone": "precision",
            "ask": "Who eats the menhaden at the end of the chain?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Compare and Connect Flip",
            "mission": "Flip each card to remember how habitats are different, what oysters do, and which words show order, then check yourself.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "Have students answer in complete sentences so yesterday's 'but' comparison and the oyster details come back before new work.",
            "support": {
              "l1_2": "Look at the icon, say the answer with your partner, and flip to check.",
              "l3_4": "Answer in a full sentence before you flip the card.",
              "l5_6": "Answer, then add one more detail you remember."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "Say one way a tide pool and the deep ocean are different.",
                  "answer": "A tide pool is shallow, but the deep ocean is dark.",
                  "icon": "🌊"
                },
                {
                  "prompt": "What do oysters do to bay water?",
                  "answer": "They filter it and make it clean.",
                  "icon": "🦪"
                },
                {
                  "prompt": "Which word means a small fact that helps explain a big idea?",
                  "answer": "A detail.",
                  "icon": "🔍"
                },
                {
                  "prompt": "Name two words that show order, such as 'first' and ___.",
                  "answer": "Next, then, or finally.",
                  "icon": "1️⃣"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "Who Eats Whom, and When?",
            "mission": "Listen to each food chain story and tap the sentence or order that matches what you heard.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each story twice and pause on the sequence words; ask students to hold up fingers for first, second, and third.",
            "support": {
              "l1_2": "Listen, hold up one, two, or three fingers for the steps, and tap.",
              "l3_4": "Tap, then retell the chain to a partner with first, next, then.",
              "l5_6": "Tap, then retell the chain and explain which word told you the order."
            },
            "payload": {
              "items": [
                {
                  "say": "First, tiny algae float near the top of the water and use sunlight to grow. Next, a small fish eats the algae.",
                  "options": [
                    {
                      "label": "The algae eat the fish."
                    },
                    {
                      "label": "The fish eats the algae."
                    },
                    {
                      "label": "The sunlight eats the fish."
                    }
                  ],
                  "answer": 1,
                  "why": "'Next' tells you the fish comes after the algae, and the fish is the one that eats the algae."
                },
                {
                  "say": "A menhaden eats algae. Then an osprey dives and catches the menhaden. What happens last?",
                  "options": [
                    {
                      "label": "The osprey catches the menhaden."
                    },
                    {
                      "label": "The menhaden eats the algae."
                    },
                    {
                      "label": "The algae grow in the sunlight."
                    }
                  ],
                  "answer": 0,
                  "why": "'Then' comes after the menhaden eats the algae, so the osprey catching the menhaden is last."
                },
                {
                  "say": "In a food chain the energy starts with the sun. It moves to the algae, and then it moves to the animals that eat them.",
                  "options": [
                    {
                      "label": "The energy begins with the osprey."
                    },
                    {
                      "label": "The energy begins with the fish."
                    },
                    {
                      "label": "The energy begins with the sun."
                    }
                  ],
                  "answer": 2,
                  "why": "The speaker says the energy starts with the sun, and then it moves to algae and animals."
                },
                {
                  "say": "First, a snail eats algae on a rock. Next, a crab eats the snail. Then a striped bass eats the crab.",
                  "options": [
                    {
                      "label": "striped bass, crab, snail, algae"
                    },
                    {
                      "label": "algae, snail, crab, striped bass"
                    },
                    {
                      "label": "algae, crab, snail, striped bass"
                    }
                  ],
                  "answer": 1,
                  "why": "Follow the sequence words: algae first, snail next, crab after that, and the striped bass last."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Sequence Sentence X-Ray",
            "mission": "Look inside the food chain sentence to find the sequence words and the three steps they connect.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Ask students to circle every verb ('use,' 'eats,' 'eats') and notice that all of them stay in the present tense.",
            "support": {
              "l1_2": "Tap each color and listen, then point to the word 'first.'",
              "l3_4": "Rebuild the sentence and say the job of each chunk.",
              "l5_6": "Rebuild it, then write a new food chain about a tide pool with the same six chunks."
            },
            "payload": {
              "text": "First, algae use sunlight to grow, next a menhaden eats the algae, and then an osprey eats the menhaden.",
              "chunks": [
                {
                  "text": "First,",
                  "role": "Sequence word: the beginning",
                  "tone": "connector"
                },
                {
                  "text": "algae use sunlight to grow,",
                  "role": "Step one: where the energy begins",
                  "tone": "concept"
                },
                {
                  "text": "next",
                  "role": "Sequence word: the second step",
                  "tone": "connector"
                },
                {
                  "text": "a menhaden eats the algae,",
                  "role": "Step two: the first animal in the chain",
                  "tone": "evidence"
                },
                {
                  "text": "and then",
                  "role": "Sequence word: the third step",
                  "tone": "connector"
                },
                {
                  "text": "an osprey eats the menhaden.",
                  "role": "Step three: the last animal in the chain",
                  "tone": "precision"
                }
              ],
              "ask": "Which three chunks tell the order, and which three tell what happens?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "sequence",
            "domain": "Reading",
            "title": "Build the Bay Food Chain",
            "mission": "Put the five steps of the bay food chain in order, then add the sequence word that fits each step and read the chain aloud with your partner.",
            "grouping": "Partners",
            "minutes": 8,
            "tip": "Ask partners to read the finished chain aloud with each sequence word in front of its step.",
            "materials": [
              "Step strips or the digital sort"
            ],
            "support": {
              "l1_2": "Start with the sun and the algae, then use the pictures to place the rest.",
              "l3_4": "Order all five steps and read the chain aloud with first, next, then, and finally.",
              "l5_6": "Order the steps, then say how the energy moves from one step to the next."
            },
            "payload": {
              "title": "A Bay Food Chain",
              "steps": [
                "Sunlight shines on the bay, and tiny algae use it to grow.",
                "A small fish called a menhaden eats the algae.",
                "An osprey dives and catches the menhaden.",
                "The osprey carries the fish to its nest to feed its chicks.",
                "The chicks have the energy they need to grow strong."
              ],
              "signals": [
                "First",
                "Next",
                "Then",
                "After that",
                "Finally"
              ],
              "items": [
                "Sunlight shines on the bay, and tiny algae use it to grow.",
                "A small fish called a menhaden eats the algae.",
                "An osprey dives and catches the menhaden.",
                "The osprey carries the fish to its nest to feed its chicks.",
                "The chicks have the energy they need to grow strong."
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Tell the Chain, Record It",
            "mission": "Tell a food chain in order with first, next, and then, record yourself, and listen for who eats whom.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask a partner to listen for the three sequence words and the present-tense verbs.",
            "klu": "Explain",
            "support": {
              "l1_2": "Use the frame and the picture cards to say three steps.",
              "l3_4": "Say first, next, then, and finally with a verb in the present tense each time.",
              "l5_6": "Say all four steps and explain with 'because' why the energy moves on."
            },
            "payload": {
              "prompt": "Tell a food chain in order. Use first, next, and then, and say who eats whom.",
              "frame": "First, ___ use sunlight to grow. Next, ___ eats ___. Then ___ eats ___.",
              "model": "First, algae in a tide pool use sunlight to grow. Next, a snail eats the algae. Then a crab eats the snail.",
              "checklist": [
                "I used first, next, and then in the right order.",
                "I said 'eats' after one animal, with an -s.",
                "I told who eats whom in every step."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Reading",
            "title": "Food Chain Order Exit Check",
            "mission": "Answer three questions about putting a food chain in order, then rate how well you can tell it with first, next, and then.",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Use the self-ratings to decide who needs the sentence strips again and who is ready for the writing extension.",
            "support": {
              "l1_2": "Listen to each question with the audio button, then tap an answer.",
              "l3_4": "Read each question, tap an answer, and read why it is right.",
              "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
            },
            "payload": {
              "can_do": "I can tell a food chain in order with first, next, and then.",
              "items": [
                {
                  "q": "Which group of sentences keeps every verb in the present tense?",
                  "options": [
                    "First, algae grow. Next, a fish ate them. Then an osprey eat the fish.",
                    "First, algae grow. Next, a fish eating them. Then an osprey eats the fish.",
                    "First, algae grow. Next, a fish eats them. Then an osprey eats the fish."
                  ],
                  "answer": 2,
                  "why": "A food chain is a fact that is always true, so keep every verb in the present: 'grow,' 'eats,' 'eats.' 'Ate' and 'eating' break the pattern, and one osprey needs 'eats.'"
                },
                {
                  "q": "Which food chain is in the right order?",
                  "options": [
                    "osprey, menhaden, algae",
                    "algae, menhaden, osprey",
                    "menhaden, algae, osprey"
                  ],
                  "answer": 1,
                  "why": "Energy starts with algae, moves to the menhaden that eats them, and then to the osprey that eats the menhaden."
                },
                {
                  "q": "Which sentence spells the order word correctly?",
                  "options": [
                    "First, algae grow. Then a fish eats them.",
                    "First, algae grow. Than a fish eats them.",
                    "First, algae grow. Den a fish eats them."
                  ],
                  "answer": 0,
                  "why": "'Then' shows what comes next in order. 'Than' is for comparing, and 'den' is not an English word."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say the Chain",
          "mission": "Point to each living thing in the food chain, say its English name, and say the short sentence about it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the name only.",
            "l3_4": "Say the name and the whole sentence.",
            "l5_6": "Say the sentence and then say who eats it."
          },
          "payload": {
            "items": [
              {
                "term": "sun",
                "icon": "☀️",
                "cue": "A bright sun above the water, with rays shining down.",
                "say": "The sun gives energy.",
                "es": "sol"
              },
              {
                "term": "algae",
                "icon": "🌱",
                "cue": "Tiny green plants floating near the top of the water, with sunlight above.",
                "say": "These are algae. They use sunlight.",
                "es": "algas"
              },
              {
                "term": "fish",
                "icon": "🐟",
                "cue": "A small silver fish swimming toward the green algae with its mouth open.",
                "say": "The fish eats the algae.",
                "es": "pez"
              },
              {
                "term": "osprey",
                "icon": "🦅",
                "cue": "A large bird diving toward the water with its feet out, and a fish below.",
                "say": "The osprey eats the fish.",
                "es": "águila pescadora"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "First, Next, Then, Finally",
          "mission": "Listen to each command and touch the pictures in the right order to build the food chain with your body.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model the actions once, then slow down on first, next, then, and finally so students hear each order word.",
          "support": {
            "l1_2": "Copy the action with a partner while you listen.",
            "l3_4": "Do the action by yourself after you hear the command.",
            "l5_6": "Give the commands to a partner and check the order."
          },
          "payload": {
            "items": [
              {
                "command": "First, point to the sun.",
                "icon": "☀️"
              },
              {
                "command": "Next, point to the algae.",
                "icon": "🌱"
              },
              {
                "command": "Then, point to the fish.",
                "icon": "🐟"
              },
              {
                "command": "Finally, point to the osprey.",
                "icon": "🦅"
              },
              {
                "command": "Open and close your mouth to show the word 'eats.'",
                "icon": "🍽️"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Order Words in Two Languages",
          "mission": "Say each order word in English and in your home language, then tell a partner how the two words are used.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add words from any home language; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner.",
            "l3_4": "Say both and one way they are alike or different.",
            "l5_6": "Say both and use each one in a sentence in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "first, next, then",
                "es": "primero, luego, después",
                "note": "Order words in Spanish are 'primero,' 'luego,' and 'después.' Be careful with 'then' and 'than': 'then' shows order and 'than' means 'que' in a comparison."
              },
              {
                "term": "food chain",
                "es": "cadena alimentaria",
                "note": "'Cadena' means chain and 'alimentaria' comes from 'alimento,' which means food. Together they name who eats whom."
              },
              {
                "term": "energy",
                "es": "energía",
                "note": "True cognate. In English say EN-er-gy, with the strong sound on the first part and no accent mark."
              }
            ]
          }
        },
        {
          "kind": "cognate_detective",
          "domain": "Vocabulary",
          "title": "Cognates in the Food Chain",
          "mission": "Sort six food chain words with their Spanish partners, and find the false friend that does not mean what it seems to mean.",
          "grouping": "Small Group",
          "minutes": 4,
          "tip": "Spend extra time on 'eventually,' which is a real false friend that students use when they mean 'finally' in their writing.",
          "support": {
            "l1_2": "Say each English word and its Spanish word, then point to a bin.",
            "l3_4": "Sort the pairs and read the reason for each answer.",
            "l5_6": "Sort the pairs, then write one sentence that uses 'finally' correctly."
          },
          "payload": {
            "items": [
              {
                "term": "energy",
                "es": "energía",
                "status": "true",
                "why": "Same meaning and nearly the same spelling. The ending changes from -y to -ía."
              },
              {
                "term": "sequence",
                "es": "secuencia",
                "status": "true",
                "why": "Same meaning and spelling pattern. English has -quence, and Spanish has -cuencia."
              },
              {
                "term": "algae",
                "es": "algas",
                "status": "true",
                "why": "Same meaning. In English 'algae' is the plural, and in Spanish you can say 'alga' for one."
              },
              {
                "term": "finally",
                "es": "finalmente",
                "status": "true",
                "why": "Both words mean 'at the end,' and both come from the same Latin word."
              },
              {
                "term": "eventually",
                "es": "eventualmente",
                "status": "false_friend",
                "why": "In English, 'eventually' means 'after a long time.' In Spanish, 'eventualmente' means 'possibly.'"
              },
              {
                "term": "eat",
                "es": "comer",
                "status": "none",
                "why": "These words do not look alike. Remember 'eat' by acting out putting food in your mouth."
              }
            ]
          }
        }
      ],
      "extension": {
        "kind": "write_scaffold",
        "domain": "Writing",
        "title": "Write Your Own Food Chain",
        "mission": "Write a short paragraph that tells a food chain from the Chesapeake Bay or a tide pool in order, with first, next, then, and finally.",
        "grouping": "Solo",
        "minutes": 10,
        "tip": "Score with the checklist; ask students to read the paragraph aloud and underline each sequence word.",
        "materials": [
          "Pencil and the lesson sheet"
        ],
        "support": {
          "l1_2": "Use the frames and the word bank to write the first two steps.",
          "l3_4": "Write all four steps and keep every verb in the present tense.",
          "l5_6": "Write all four steps and add a sentence that tells how the energy moves on."
        },
        "payload": {
          "prompt": "Choose a food chain from the Chesapeake Bay or a tide pool. Write a paragraph that tells the chain in order.",
          "structure": [
            {
              "part": "Step one",
              "frame": "First, ___ use sunlight to ___."
            },
            {
              "part": "Step two",
              "frame": "Next, ___ eats ___."
            },
            {
              "part": "Step three",
              "frame": "Then, ___ eats ___."
            },
            {
              "part": "Ending",
              "frame": "Finally, ___, so the energy ___."
            }
          ],
          "word_bank": [
            "first",
            "next",
            "then",
            "finally",
            "energy",
            "algae",
            "eats",
            "food chain"
          ],
          "checklist": [
            "I used first, next, then, and finally in order.",
            "Every verb is in the present tense.",
            "I told who eats whom in every step.",
            "I used a capital letter and a period in every sentence."
          ],
          "model": "First, tiny algae in the Chesapeake Bay use sunlight to grow. Next, a small clam filters the algae and eats them. Then a blue crab digs up the clam and eats it. Finally, a person catches the crab, so the energy moves from the sun to the dinner table."
        }
      },
      "exit_check": {
        "kind": "exit_check",
        "domain": "Reading",
        "title": "Food Chain Order Exit Check",
        "mission": "Answer three questions about putting a food chain in order, then rate how well you can tell it with first, next, and then.",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Use the self-ratings to decide who needs the sentence strips again and who is ready for the writing extension.",
        "support": {
          "l1_2": "Listen to each question with the audio button, then tap an answer.",
          "l3_4": "Read each question, tap an answer, and read why it is right.",
          "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
        },
        "payload": {
          "can_do": "I can tell a food chain in order with first, next, and then.",
          "items": [
            {
              "q": "Which group of sentences keeps every verb in the present tense?",
              "options": [
                "First, algae grow. Next, a fish ate them. Then an osprey eat the fish.",
                "First, algae grow. Next, a fish eating them. Then an osprey eats the fish.",
                "First, algae grow. Next, a fish eats them. Then an osprey eats the fish."
              ],
              "answer": 2,
              "why": "A food chain is a fact that is always true, so keep every verb in the present: 'grow,' 'eats,' 'eats.' 'Ate' and 'eating' break the pattern, and one osprey needs 'eats.'"
            },
            {
              "q": "Which food chain is in the right order?",
              "options": [
                "osprey, menhaden, algae",
                "algae, menhaden, osprey",
                "menhaden, algae, osprey"
              ],
              "answer": 1,
              "why": "Energy starts with algae, moves to the menhaden that eats them, and then to the osprey that eats the menhaden."
            },
            {
              "q": "Which sentence spells the order word correctly?",
              "options": [
                "First, algae grow. Then a fish eats them.",
                "First, algae grow. Than a fish eats them.",
                "First, algae grow. Den a fish eats them."
              ],
              "answer": 0,
              "why": "'Then' shows what comes next in order. 'Than' is for comparing, and 'den' is not an English word."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Food chain picture cards",
          "Sentence strips for the five steps",
          "A device with sound for each pair"
        ],
        "listen_for": [
          "Students say first, next, then, and finally in the right order.",
          "Students keep verbs in the present tense across all the steps.",
          "Students say who eats whom and can explain which way the energy moves."
        ],
        "watchouts": [
          "Tense mixing across steps is common ('First algae grow, next a fish ate them'). Have students underline every verb and read them in a row to hear the mismatch.",
          "Students spell 'then' as 'than' or 'den,' and some use 'eventually' to mean 'finally' because Spanish 'eventualmente' means 'possibly.' Teach 'then = order, than = compare.'",
          "Students draw or say the arrows from the eater to the food. Say 'the energy goes to the animal that eats' and have students trace the arrow with a finger."
        ],
        "differentiation": {
          "l1_2": "Give three picture cards and the frame 'First, ___. Next, ___. Then, ___.' Accept a point plus the animal names.",
          "l3_4": "Expect four steps with first, next, then, finally, and present-tense verbs.",
          "l5_6": "Expect an explanation of how the energy moves, with 'because' linking two steps.",
          "newcomer": "Use Point and Say the Chain, First Next Then Finally, the order-word bridge, and the cognate sort; accept pointing and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    },
    {
      "id": "g3-ela-u1-l06",
      "unit_id": "g3-ela-u1",
      "version": 1,
      "sequence": 6,
      "source": "authored",
      "title": "Explain Cause and Effect: Muddy Water in the Bay",
      "core_lesson_ref": {
        "label": "Language session 6: explaining cause and effect",
        "source": "language_pathway"
      },
      "content_objective": "Students will explain how muddy water in the Chesapeake Bay blocks sunlight from the bay grass and leaves baby crabs without a hiding place, using cause-and-effect language.",
      "language_objective": {
        "klu": "Explain",
        "function": "explain a cause and its effect with 'when,' 'because,' and 'so'",
        "forms": [
          "When ___, ___.",
          "___ because ___.",
          "___, so ___."
        ],
        "by_level": {
          "l1_2": "I can match a cause card to an effect card and say one cause and one effect with the word 'so.'",
          "l3_4": "I can explain one cause and its effect in the bay with 'because' and 'so,' keeping the cause and the effect in the right order.",
          "l5_6": "I can explain a three-step chain of causes and effects with 'when,' 'because,' and 'so,' and tell which step people could change to help the bay."
        }
      },
      "standards": [
        "RI.3.3",
        "L.3.1.h",
        "W.3.2.c",
        "SL.3.4"
      ],
      "wida": {
        "framework": "2020",
        "language_expectation": "ELA.3-5.Explain.Expressive",
        "pld_targets": [
          "discourse",
          "sentence"
        ]
      },
      "vocab": [
        {
          "term": "cause",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "effect",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "pollution",
          "tier": 3,
          "new_or_review": "new"
        },
        {
          "term": "protect",
          "tier": 2,
          "new_or_review": "new"
        },
        {
          "term": "ecosystem",
          "tier": 3,
          "new_or_review": "review"
        }
      ],
      "mentor_sentence": {
        "text": "When the water gets muddy, sunlight cannot reach the grass, so baby crabs lose their hiding place.",
        "chunks": [
          {
            "text": "When the water gets muddy,",
            "role": "The cause: what happens first",
            "tone": "connector",
            "ask": "What happens first in the bay?"
          },
          {
            "text": "sunlight cannot reach the grass,",
            "role": "The first effect of the cause",
            "tone": "concept",
            "ask": "What cannot reach the grass?"
          },
          {
            "text": "so",
            "role": "The joining word that shows a result",
            "tone": "connector",
            "ask": "Which small word shows that a result is coming?"
          },
          {
            "text": "baby crabs lose their hiding place.",
            "role": "The last effect in the chain",
            "tone": "precision",
            "ask": "What do baby crabs lose in the end?"
          }
        ]
      },
      "arc": [
        {
          "step": "warm_up",
          "minutes": 4,
          "activity": {
            "kind": "flash_retrieval",
            "domain": "Vocabulary",
            "title": "Bay Connections Flip",
            "mission": "Flip each card to remember how the parts of the bay help each other, then say the answer before you check.",
            "grouping": "Partners",
            "minutes": 4,
            "tip": "Ask students to answer with a full sentence so the sequence words and 'because' from earlier lessons come back.",
            "support": {
              "l1_2": "Look at the icon, say the answer with your partner, and flip to check.",
              "l3_4": "Answer in a full sentence before you flip the card.",
              "l5_6": "Answer, then connect your answer to a second fact about the bay."
            },
            "payload": {
              "cards": [
                {
                  "prompt": "Why are oysters important to the bay?",
                  "answer": "They filter the water and make it clean.",
                  "icon": "🦪"
                },
                {
                  "prompt": "What do menhaden eat in the bay food chain?",
                  "answer": "They eat algae.",
                  "icon": "🐟"
                },
                {
                  "prompt": "What is an ecosystem?",
                  "answer": "Living and nonliving things that depend on each other in one place.",
                  "icon": "🌎"
                },
                {
                  "prompt": "Name the word that shows order: first, next, ___, finally.",
                  "answer": "Then.",
                  "icon": "🔢"
                }
              ]
            }
          }
        },
        {
          "step": "input",
          "minutes": 5,
          "activity": {
            "kind": "listen_and_show",
            "domain": "Listening",
            "title": "Cause or Effect? Tap It",
            "mission": "Listen to each bay story and tap the choice that names the cause, the effect, or the sentence with the same meaning.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Read each story twice and stress 'when,' 'because,' and 'so'; ask students which word points to the cause.",
            "support": {
              "l1_2": "Listen, tap a choice, then listen again with the words showing.",
              "l3_4": "Tap, then say 'The cause is ___, and the effect is ___.'",
              "l5_6": "Tap, then explain which joining word told you the order."
            },
            "payload": {
              "items": [
                {
                  "say": "When too much dirt washes into the bay, the water turns muddy. What is the cause?",
                  "options": [
                    {
                      "label": "Dirt washes into the bay."
                    },
                    {
                      "label": "The water turns muddy."
                    },
                    {
                      "label": "Crabs hide in grass."
                    }
                  ],
                  "answer": 0,
                  "why": "The dirt washing in comes first and makes the water muddy. The muddy water is the effect."
                },
                {
                  "say": "The water is muddy, so sunlight cannot reach the bay grass. What happens to the grass?",
                  "options": [
                    {
                      "label": "The grass grows taller."
                    },
                    {
                      "label": "The grass does not get enough light to grow."
                    },
                    {
                      "label": "The grass turns into sand."
                    }
                  ],
                  "answer": 1,
                  "why": "Plants need sunlight to grow, so grass that cannot get light cannot grow well."
                },
                {
                  "say": "Baby crabs lose their hiding place because the bay grass dies. Which sentence means the same thing?",
                  "options": [
                    {
                      "label": "Baby crabs hide, so the grass dies."
                    },
                    {
                      "label": "Baby crabs grow, so the water is muddy."
                    },
                    {
                      "label": "The grass dies, so baby crabs have fewer places to hide."
                    }
                  ],
                  "answer": 2,
                  "why": "'Because' points to the cause: the grass dying. 'So' points to the result: fewer hiding places. The grass dies first in both sentences."
                }
              ]
            }
          }
        },
        {
          "step": "notice",
          "minutes": 4,
          "activity": {
            "kind": "sentence_xray",
            "domain": "Reading",
            "title": "Cause and Effect Sentence X-Ray",
            "mission": "Look inside the muddy water sentence to find the cause, the effects, and the small words that connect them.",
            "grouping": "Whole Class",
            "minutes": 4,
            "tip": "Ask students to point to 'When' and to 'so' and explain that each one starts a different part of the chain.",
            "support": {
              "l1_2": "Tap each color and listen, then point to the word 'so.'",
              "l3_4": "Rebuild the sentence and say what each chunk does.",
              "l5_6": "Rebuild it, then write a new sentence about fewer oysters with the same four chunks."
            },
            "payload": {
              "text": "When the water gets muddy, sunlight cannot reach the grass, so baby crabs lose their hiding place.",
              "chunks": [
                {
                  "text": "When the water gets muddy,",
                  "role": "The cause: what happens first",
                  "tone": "connector"
                },
                {
                  "text": "sunlight cannot reach the grass,",
                  "role": "The first effect of the cause",
                  "tone": "concept"
                },
                {
                  "text": "so",
                  "role": "The joining word that shows a result",
                  "tone": "connector"
                },
                {
                  "text": "baby crabs lose their hiding place.",
                  "role": "The last effect in the chain",
                  "tone": "precision"
                }
              ],
              "ask": "Which chunk is the cause, and which chunk is the last effect?"
            }
          }
        },
        {
          "step": "interact",
          "minutes": 8,
          "activity": {
            "kind": "error_analysis",
            "domain": "Writing",
            "title": "Fix the Bay Sentences",
            "mission": "Each sentence about the muddy bay has a problem, so pick the best fix with your partner and say why it works.",
            "grouping": "Partners",
            "minutes": 8,
            "tip": "Ask partners to read the original aloud first and name whether the problem is the order, a fragment, or a doubled connector.",
            "support": {
              "l1_2": "Read the choices aloud and point to the one that sounds right.",
              "l3_4": "Pick the fix and say 'This is better because ___.'",
              "l5_6": "Pick the fix, then rewrite the sentence in a different way with 'so' or 'when.'"
            },
            "payload": {
              "items": [
                {
                  "wrong": "The water is muddy because the grass has no sunlight.",
                  "options": [
                    "The water is muddy, so the grass is clean.",
                    "The grass has no sunlight because the water is muddy.",
                    "The grass has no sunlight, but the water is muddy."
                  ],
                  "answer": 1,
                  "why": "The muddy water is the cause, and the grass losing its sunlight is the effect. The first sentence flipped them, so 'because' pointed to the wrong thing."
                },
                {
                  "wrong": "Baby crabs lose their hiding place. Because the bay grass dies.",
                  "options": [
                    "Baby crabs lose their hiding place because the bay grass dies.",
                    "Baby crabs lose their hiding place because.",
                    "Because baby crabs lose their hiding place the grass dies."
                  ],
                  "answer": 0,
                  "why": "A 'because' part cannot stand alone as its own sentence. Join it to the effect, with the real cause after 'because.'"
                },
                {
                  "wrong": "When the water is muddy, so the grass cannot get sunlight.",
                  "options": [
                    "When the water is muddy so, the grass cannot get sunlight.",
                    "The water is muddy when, so the grass cannot get sunlight.",
                    "When the water is muddy, the grass cannot get sunlight."
                  ],
                  "answer": 2,
                  "why": "Pick one pattern: 'When ___, ___' or '___, so ___.' Using 'when' and 'so' together in one sentence makes the sentence hard to follow."
                },
                {
                  "wrong": "Muddy water helps the grass because it gives the grass a thick blanket.",
                  "options": [
                    "Muddy water helps the grass because it keeps the water warm.",
                    "Muddy water hurts the grass because it blocks the sunlight the grass needs.",
                    "Muddy water does not matter because grass does not need light."
                  ],
                  "answer": 1,
                  "why": "Bay grass is a plant, and plants use sunlight to make food. Water that blocks sunlight hurts the grass."
                }
              ]
            }
          }
        },
        {
          "step": "produce",
          "minutes": 5,
          "activity": {
            "kind": "speak_and_record",
            "domain": "Speaking",
            "title": "Explain the Cause, Record It",
            "mission": "Explain what happens in the bay when there are fewer oysters, join the steps with 'so,' and record yourself.",
            "grouping": "Solo",
            "minutes": 5,
            "tip": "Recordings stay on the student's device; ask a partner to listen for the cause first and a connector in the middle.",
            "klu": "Explain",
            "support": {
              "l1_2": "Use the frame to say one cause and one effect with 'so.'",
              "l3_4": "Say a cause and two effects, joining them with 'so' and 'because.'",
              "l5_6": "Say the whole chain and tell one way people could protect the bay."
            },
            "payload": {
              "prompt": "Explain what happens in the bay when there are fewer oysters. Say the cause first and join each effect with 'so.'",
              "frame": "When ___, ___, so ___.",
              "model": "When there are fewer oysters, less water gets cleaned, so the bay water gets cloudy.",
              "checklist": [
                "I said the cause first.",
                "I used 'so' or 'because' to join the cause and the effect.",
                "My effect really follows from my cause."
              ]
            }
          }
        },
        {
          "step": "check",
          "minutes": 3,
          "activity": {
            "kind": "exit_check",
            "domain": "Reading",
            "title": "Cause and Effect Exit Check",
            "mission": "Answer three questions about explaining a cause and its effect, then rate how well you can do it with 'when,' 'because,' and 'so.'",
            "grouping": "Solo",
            "minutes": 3,
            "tip": "Use the self-ratings to choose which students revise their paragraph with you and which write alone.",
            "support": {
              "l1_2": "Listen to each question with the audio button, then tap an answer.",
              "l3_4": "Read each question, tap an answer, and read why it is right.",
              "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
            },
            "payload": {
              "can_do": "I can explain a cause and its effect with when, because, and so.",
              "items": [
                {
                  "q": "Which sentence puts the cause and the effect in the right order?",
                  "options": [
                    "The water is muddy because the grass dies.",
                    "Muddy because the grass dies the water.",
                    "The grass dies because the water is muddy."
                  ],
                  "answer": 2,
                  "why": "The muddy water comes first and makes the grass die, so the cause goes after 'because.' The other sentences flip the order or are not complete."
                },
                {
                  "q": "Which sentence is a complete sentence?",
                  "options": [
                    "Because fewer oysters clean the water.",
                    "Fewer oysters clean the water, so the bay gets cloudy.",
                    "So the bay gets cloudy fewer oysters."
                  ],
                  "answer": 1,
                  "why": "It has a cause and an effect that are joined by 'so.' A 'because' part alone is a fragment, and the last sentence is in the wrong order."
                },
                {
                  "q": "A storm washes lots of dirt into the bay. What is a likely effect?",
                  "options": [
                    "The water gets muddy, and sunlight is blocked.",
                    "The water gets clearer, and the grass grows faster.",
                    "The oysters turn into crabs."
                  ],
                  "answer": 0,
                  "why": "Dirt makes the water muddy, and muddy water blocks sunlight. Clearer water and oysters turning into crabs are not real effects of dirt."
                }
              ]
            }
          }
        }
      ],
      "newcomer_path": [
        {
          "kind": "point_and_say",
          "domain": "Vocabulary",
          "title": "Point and Say Cause Words",
          "mission": "Point to each picture in the story of the muddy bay, say the English word, and say the short sentence with it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "No reading is needed: show the picture, say the sentence slowly, and let the student echo it.",
          "support": {
            "l1_2": "Point and say the word only.",
            "l3_4": "Say the word and the whole sentence.",
            "l5_6": "Say the sentence, then say what happens next with 'so.'"
          },
          "payload": {
            "items": [
              {
                "term": "rain",
                "icon": "🌧️",
                "cue": "Heavy rain washing brown dirt down a hill toward a bay.",
                "say": "The rain washes dirt into the water.",
                "es": "lluvia"
              },
              {
                "term": "muddy water",
                "icon": "💧",
                "cue": "Brown, cloudy water in a bay with the bottom hidden from view.",
                "say": "The water is muddy.",
                "es": "agua turbia"
              },
              {
                "term": "grass",
                "icon": "🌿",
                "cue": "Tall green grass under the water, with sunlight shining down to it.",
                "say": "The grass needs sunlight.",
                "es": "pastos marinos"
              },
              {
                "term": "crab",
                "icon": "🦀",
                "cue": "A small blue crab hiding in tall grass on the bottom of the bay.",
                "say": "The crab hides in the grass.",
                "es": "cangrejo"
              }
            ]
          }
        },
        {
          "kind": "tpr_cards",
          "domain": "Listening",
          "title": "Act Out Cause and Effect",
          "mission": "Listen to each command and act out the story of the bay, from the rain to the hiding crab.",
          "grouping": "Whole Class",
          "minutes": 4,
          "tip": "Model each action once, then give the command without modeling and watch for the right response.",
          "support": {
            "l1_2": "Copy the action with a partner while you listen.",
            "l3_4": "Do the action by yourself after you hear the command.",
            "l5_6": "Give the commands to a partner and check the response."
          },
          "payload": {
            "items": [
              {
                "command": "Wiggle your fingers downward like rain.",
                "icon": "🌧️"
              },
              {
                "command": "Point to the muddy water.",
                "icon": "👉"
              },
              {
                "command": "Cover your eyes like grass with no sunlight.",
                "icon": "🙈"
              },
              {
                "command": "Hide under your hands like a baby crab.",
                "icon": "🦀"
              },
              {
                "command": "Open your hands wide to show clear water.",
                "icon": "💧"
              }
            ]
          }
        },
        {
          "kind": "home_language_bridge",
          "domain": "Vocabulary",
          "title": "Cause Words in Two Languages",
          "mission": "Say each cause-and-effect word in English and in your home language, then tell a partner how English uses it.",
          "grouping": "Partners",
          "minutes": 4,
          "tip": "Invite students to add words from any home language; the Spanish glosses are drafts that a Spanish speaker should check.",
          "support": {
            "l1_2": "Say both words with your partner.",
            "l3_4": "Say both and one way they are alike or different.",
            "l5_6": "Say both and use each one in a sentence in its own language."
          },
          "payload": {
            "items": [
              {
                "term": "cause and effect",
                "es": "causa y efecto",
                "note": "Both words are cognates. In English the stress is on the first part of 'CAUSE' and on the second part of 'ef-FECT.'"
              },
              {
                "term": "so",
                "es": "así que / por eso",
                "note": "'So' shows a result: 'The water is muddy, so the grass dies.' It goes in the middle of the sentence, after the cause."
              },
              {
                "term": "pollution",
                "es": "contaminación",
                "note": "Both words end like 'tion' and 'ción,' so they are easy to match. In English the verb is 'pollute,' and in Spanish it is 'contaminar.'"
              }
            ]
          }
        }
      ],
      "extension": {
        "kind": "write_scaffold",
        "domain": "Writing",
        "title": "Write a Cause and Effect Paragraph",
        "mission": "Write a short paragraph that explains how planting young oysters could help the bay, and tell one way people can protect it.",
        "grouping": "Solo",
        "minutes": 10,
        "tip": "Score with the checklist; ask students to circle the cause in each sentence and underline the effect.",
        "materials": [
          "Pencil and the lesson sheet"
        ],
        "support": {
          "l1_2": "Use the frames and the word bank to write one cause and one effect.",
          "l3_4": "Write all four parts and use 'so' at least once.",
          "l5_6": "Write all four parts, use 'when,' 'because,' and 'so,' and explain why your last step matters."
        },
        "payload": {
          "prompt": "Explain what happens in the bay when people plant young oysters on a reef. Then tell one way people can protect the bay.",
          "structure": [
            {
              "part": "Cause",
              "frame": "When ___, ___."
            },
            {
              "part": "Effect",
              "frame": "___, so ___."
            },
            {
              "part": "Why it matters",
              "frame": "This matters because ___."
            },
            {
              "part": "How people help",
              "frame": "People can protect the bay by ___."
            }
          ],
          "word_bank": [
            "when",
            "because",
            "so",
            "cause",
            "effect",
            "pollution",
            "protect",
            "oysters",
            "grass"
          ],
          "checklist": [
            "I wrote the cause before the effect.",
            "I used when, because, and so correctly.",
            "My reasons match what I learned about the bay.",
            "I ended with one way people can protect the bay."
          ],
          "model": "When people plant young oysters on a reef, more water gets cleaned, so sunlight can reach the grass again. This matters because baby crabs need the grass to hide. People can protect the bay by keeping trash and extra fertilizer out of the water."
        }
      },
      "exit_check": {
        "kind": "exit_check",
        "domain": "Reading",
        "title": "Cause and Effect Exit Check",
        "mission": "Answer three questions about explaining a cause and its effect, then rate how well you can do it with 'when,' 'because,' and 'so.'",
        "grouping": "Solo",
        "minutes": 3,
        "tip": "Use the self-ratings to choose which students revise their paragraph with you and which write alone.",
        "support": {
          "l1_2": "Listen to each question with the audio button, then tap an answer.",
          "l3_4": "Read each question, tap an answer, and read why it is right.",
          "l5_6": "Answer, fix any mistake in your own words, and then rate yourself."
        },
        "payload": {
          "can_do": "I can explain a cause and its effect with when, because, and so.",
          "items": [
            {
              "q": "Which sentence puts the cause and the effect in the right order?",
              "options": [
                "The water is muddy because the grass dies.",
                "Muddy because the grass dies the water.",
                "The grass dies because the water is muddy."
              ],
              "answer": 2,
              "why": "The muddy water comes first and makes the grass die, so the cause goes after 'because.' The other sentences flip the order or are not complete."
            },
            {
              "q": "Which sentence is a complete sentence?",
              "options": [
                "Because fewer oysters clean the water.",
                "Fewer oysters clean the water, so the bay gets cloudy.",
                "So the bay gets cloudy fewer oysters."
              ],
              "answer": 1,
              "why": "It has a cause and an effect that are joined by 'so.' A 'because' part alone is a fragment, and the last sentence is in the wrong order."
            },
            {
              "q": "A storm washes lots of dirt into the bay. What is a likely effect?",
              "options": [
                "The water gets muddy, and sunlight is blocked.",
                "The water gets clearer, and the grass grows faster.",
                "The oysters turn into crabs."
              ],
              "answer": 0,
              "why": "Dirt makes the water muddy, and muddy water blocks sunlight. Clearer water and oysters turning into crabs are not real effects of dirt."
            }
          ]
        }
      },
      "teacher_card": {
        "minutes": 29,
        "materials": [
          "Cause and effect cards (rain, dirt, muddy water, grass, crabs)",
          "Sticky notes or small whiteboards",
          "A device with sound for each pair"
        ],
        "listen_for": [
          "Students say the cause first and then the effect, joined by 'so' or 'because.'",
          "Students finish every 'because' part inside the same sentence, not as a fragment.",
          "Students use only one connector pattern per sentence, not 'When ..., so ...'."
        ],
        "watchouts": [
          "Students reverse the order with 'because' ('The water is muddy because the grass dies'). Ask them to cover the sentence and tell which thing happened first in the bay.",
          "Spanish speakers may double connectors ('When the water is muddy, so ...') because 'cuando' and 'entonces' can appear in the same Spanish sentence, and many students write 'Because ...' as a full sentence. Teach one pattern per sentence.",
          "Some students think muddy water only looks bad. Check the science: bay grass is a plant that needs sunlight to make food, so blocked light hurts it."
        ],
        "differentiation": {
          "l1_2": "Give cause and effect picture cards and the frame '___, so ___.' Accept a matched pair and one 'so' sentence.",
          "l3_4": "Expect one cause and its effect joined with 'because' or 'so,' in the right order.",
          "l5_6": "Expect a chain of three steps with at least two connectors and a suggestion for how people could protect the bay.",
          "newcomer": "Use Point and Say Cause Words, Act Out Cause and Effect, and the cause-word bridge; accept pointing, acting, and home-language answers."
        }
      },
      "media": {
        "images": [],
        "audio": []
      },
      "review": {
        "pedagogy": "pending",
        "language_qa": "pending",
        "translation": {}
      }
    }
  ]
};
