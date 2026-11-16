// Newsroom Challenge, grades 3-5: "The Maple Street Messenger". Content only (schema: engine.js).
// Every assignment runs the same newsroom routine: judge a source, catch the witness detail that is wrong, sort fact
// from opinion, write a headline, write a lead, and fix a draft sentence the editor flags.
const C = (en, es) => [en, es];

const FACT = { id: "fact", label: C("Fact: can be checked", "Hecho: se puede comprobar") };
const OPINION = {
  id: "opinion",
  label: C("Opinion: a feeling or judgment", "Opinión: un sentimiento o juicio"),
};
const EDITOR = "Ms. Rivera, editor";

export const BAND_35 = {
  premise:
    "You are the newest reporter at The Maple Street Messenger, your school newspaper. Your editor, Ms. Rivera, gives you three stories. Talk to people, read the numbers, and check every fact before your story goes to print.",
  premiseEs:
    "Eres la reportera o el reportero más nuevo de The Maple Street Messenger, el periódico de tu escuela. Tu editora, la Sra. Rivera, te da tres noticias. Habla con la gente, lee los números y revisa cada dato antes de que tu noticia se imprima.",
  chapters: [
    {
      id: "nc35-garden",
      title: "The First Harvest",
      art: ["bg-park", "char-reporter"],
      intro:
        'Ms. Rivera drops a notebook on your desk. "The school garden had its first harvest on Friday. Find out what happened, and get the numbers right."',
      introEs:
        'La Sra. Rivera pone un cuaderno en tu escritorio. "El huerto de la escuela tuvo su primera cosecha el viernes. Averigua qué pasó y escribe bien los números."',
      outro:
        'Your garden story is on page one. Ms. Rivera smiles. "Good checking. Now the library needs a reporter. Something big happened during read-a-thon week."',
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with the garden teacher",
          who: "Mr. Okoro, Garden Club teacher",
          qa: [
            {
              q: "When did the Garden Club pick the vegetables?",
              a: "On Friday morning, before school started.",
            },
            { q: "Who helped?", a: "Twenty students from Room 12 helped me." },
            {
              q: "What will happen to the food?",
              a: "It goes to the cafeteria salad bar on Monday.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "First harvest: what we picked",
          unit: "vegetables",
          bars: [
            { label: "Tomatoes", value: 34 },
            { label: "Carrots", value: 21 },
            { label: "Peppers", value: 12 },
            { label: "Lettuce", value: 8 },
          ],
          source: "Garden Club count sheet, filled in while picking on Friday",
        },
        {
          id: "lina",
          kind: "witness",
          title: "What Lina saw",
          who: "Lina",
          role: "fourth grader in Room 12, picked tomatoes",
          said: "I was there the whole time. We picked 34 tomatoes! They were the best tomatoes ever.",
        },
        {
          id: "mateo",
          kind: "witness",
          title: "What Mateo heard",
          who: "Mateo",
          role: "third grader, came to the garden at lunch",
          said: "When I got there, the picking was over. A kid told me they picked about 50 tomatoes. Gardening looks like fun.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["talk", "chart", "lina", "mateo"],
          prompt: "Which source is the most reliable for how many tomatoes the club picked?",
          help: "Piensa en quién contó los tomates de verdad y cuándo. Una fuente confiable estaba allí y escribió los números en ese momento.",
          options: [
            {
              id: "a",
              text: "The Garden Club count sheet, filled in while they picked",
              ok: true,
              why: "Yes. The club wrote each number down while they picked.",
            },
            {
              id: "b",
              text: "Mateo, who came to the garden at lunch",
              why: "Mateo came after the picking was over. Did he count, or did someone tell him?",
            },
            {
              id: "c",
              text: "Kids talking about the harvest in the lunch line",
              why: "Talk in the lunch line passes from kid to kid. Nobody there says they counted.",
            },
            {
              id: "d",
              text: "A Garden Club poster that asks new kids to join",
              why: "A poster that wants new members has a reason to make the harvest sound bigger.",
            },
          ],
          rule: C(
            "The most reliable source was there, counted, and wrote it down at the time.",
            "La fuente más confiable estaba allí, contó y lo escribió en ese momento.",
          ),
          explain:
            "The count sheet was filled in while the club picked, so its numbers come straight from the counting.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["chart", "lina", "mateo"],
          prompt: "Lina and Mateo do not agree. Which detail is wrong?",
          help: "Compara el número de tomates que dice cada niño con la barra de Tomatoes en la gráfica.",
          options: [
            {
              id: "a",
              text: "Mateo says they picked about 50 tomatoes.",
              ok: true,
            },
            {
              id: "b",
              text: "Lina says they picked 34 tomatoes.",
              why: "Find the Tomatoes bar on the chart. Does Lina's number match it?",
            },
            {
              id: "c",
              text: "Lina says she was there the whole time.",
              why: "Lina picked tomatoes with Room 12. Nothing in the other sources says she left.",
            },
          ],
          rule: C(
            "When two people disagree, check the detail against a record that counted.",
            "Cuando dos personas no están de acuerdo, compara el dato con un registro que contó.",
          ),
          explain:
            "The chart shows 34 tomatoes. Mateo heard 50 from another kid after the picking was over, so his number is wrong.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "lina", "mateo"],
          prompt: "Sort each sentence. Is it a fact or an opinion?",
          help: "Un hecho se puede comprobar: puedes contarlo o mirarlo en un registro. Una opinión dice lo que alguien siente o piensa.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "The club picked 34 tomatoes.",
              cat: "fact",
              clue: C("Can you count this on the chart?", "¿Puedes contar esto en la gráfica?"),
            },
            {
              id: "i2",
              text: "They were the best tomatoes ever.",
              cat: "opinion",
              clue: C('Is there a way to check "best"?', '¿Hay una forma de comprobar "best"?'),
            },
            {
              id: "i3",
              text: "Twenty students from Room 12 helped.",
              cat: "fact",
              clue: C("Could you check a class list?", "¿Podrías revisar una lista de la clase?"),
            },
            {
              id: "i4",
              text: "Gardening looks like fun.",
              cat: "opinion",
              clue: C(
                "Is this a feeling about gardening?",
                "¿Es un sentimiento sobre la jardinería?",
              ),
            },
            {
              id: "i5",
              text: "The food goes to the salad bar on Monday.",
              cat: "fact",
              clue: C("Could you go and see it on Monday?", "¿Podrías ir a verlo el lunes?"),
            },
            {
              id: "i6",
              text: "Carrots taste better than peppers.",
              cat: "opinion",
              clue: C(
                "Would every person agree about taste?",
                "¿Todas las personas estarían de acuerdo sobre el sabor?",
              ),
            },
          ],
          rule: C(
            "A fact can be checked. An opinion tells what someone feels or thinks.",
            "Un hecho se puede comprobar. Una opinión dice lo que alguien siente o piensa.",
          ),
          explain:
            "Numbers, names and days can be checked. Words like best, fun and better show feelings, so those sentences are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["chart", "talk"],
          prompt: "Write a headline for your story. Keep it short and use only facts.",
          help: "Un titular es corto: 10 palabras o menos. Di de qué trata la noticia (el huerto, la cosecha) y no uses palabras de opinión como best o fun.",
          check: {
            min: 3,
            max: 10,
            ideas: [
              {
                any: ["garden*", "harvest*", "tomato*", "vegetable*", "pick*", "carrot*"],
                clue: C(
                  "Tell what the story is about: the garden or the harvest.",
                  "Di de qué trata la noticia: el huerto o la cosecha.",
                ),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline is short, tells the main event, and has no opinion words.",
            "Un titular es corto, cuenta el suceso principal y no tiene palabras de opinión.",
          ),
          frame: "School Garden ___ ___ Tomatoes",
          model: "School Garden Club Picks 34 Tomatoes in First Harvest",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart"],
          prompt: "Write the first sentence of your story. Tell who, what, when and where.",
          help: "La primera oración de una noticia responde: ¿quién? (los estudiantes), ¿qué? (lo que recogieron), ¿cuándo? (el día) y ¿dónde? (el lugar). Usa la entrevista y la gráfica.",
          check: {
            min: 15,
            ideas: [
              {
                any: [
                  "students",
                  "room 12",
                  "garden club",
                  "kids",
                  "club",
                  "mr. okoro",
                  "okoro",
                  "fourth grade*",
                ],
                clue: C("Say who did it.", "Di quién lo hizo."),
              },
              {
                any: ["pick*", "harvest*", "tomato*", "vegetable*", "grew", "collect*"],
                clue: C("Say what they did.", "Di qué hicieron."),
              },
              {
                any: ["friday"],
                clue: C("Say when it happened.", "Di cuándo pasó."),
              },
              {
                any: ["garden", "school", "maple street"],
                clue: C("Say where it happened.", "Di dónde pasó."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A news lead answers who, what, when and where in one sentence, with facts only.",
            "El comienzo de una noticia responde quién, qué, cuándo y dónde en una oración, solo con hechos.",
          ),
          frame: "On ___, ___ picked ___ in the ___.",
          model:
            "On Friday morning, twenty students from Room 12 picked 34 tomatoes and other vegetables in the Maple Street School garden.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["chart", "lina", "mateo"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Your draft says: "The club picked about 50 tomatoes." Where did that number come from? Check it before we print.',
          },
          prompt: "Rewrite the sentence with the right number. Name the source you checked.",
          help: "Busca el número de tomates en la gráfica. Escribe la oración otra vez con ese número y di dónde lo viste: The chart shows …",
          check: {
            min: 7,
            ideas: [
              {
                any: ["34", "thirty-four", "thirty four"],
                clue: C(
                  "Use the number of tomatoes from the chart.",
                  "Usa el número de tomates de la gráfica.",
                ),
              },
            ],
            avoid: [
              {
                any: ["50", "fifty"],
                clue: C(
                  "That number came from a kid who was not there. Use the counted number.",
                  "Ese número vino de un niño que no estaba allí. Usa el número contado.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Fix a wrong fact with the number from the record, and say where you found it.",
            "Corrige un dato equivocado con el número del registro y di dónde lo encontraste.",
          ),
          frame: "The chart shows that the club picked ___ tomatoes.",
          model: "The chart shows that the Garden Club picked 34 tomatoes on Friday.",
          keep: "Corrected sentence",
        },
      ],
    },
    {
      id: "nc35-readathon",
      title: "The Read-a-Thon",
      art: ["bg-classroom", "char-reporter"],
      intro:
        "The library wall is covered with paper leaves. Each leaf is one book a student read during read-a-thon week. Ms. Rivera wants to know: how many books, and which grade read the most?",
      introEs:
        "La pared de la biblioteca está cubierta de hojas de papel. Cada hoja es un libro que un estudiante leyó durante la semana del maratón de lectura. La Sra. Rivera quiere saber: ¿cuántos libros, y qué grado leyó más?",
      outro:
        'Your read-a-thon story is posted next to the Book Tree. Then the phone rings in the newsroom. "A lost dog was found at Cedar Park," Ms. Rivera says. "Grab your notebook."',
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with the librarian",
          who: "Ms. Chen, school librarian",
          qa: [
            {
              q: "When was the read-a-thon?",
              a: "Last week, from Monday to Friday, here in the school library.",
            },
            {
              q: "How many books did students read?",
              a: "Students in grades 3, 4 and 5 read 412 books in all.",
            },
            {
              q: "Why did you have a read-a-thon?",
              a: "We wanted to fill our new Book Tree. Each book is one paper leaf.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "Books read in the read-a-thon, by grade",
          unit: "books",
          bars: [
            { label: "Grade 3", value: 128 },
            { label: "Grade 4", value: 146 },
            { label: "Grade 5", value: 138 },
          ],
          source: "Library sign-in log, counted by Ms. Chen",
        },
        {
          id: "ava",
          kind: "witness",
          title: "What Ava said",
          who: "Ava",
          role: "fifth grader",
          said: "Fifth grade read the most books. We read 160! Our class is the smartest in the school.",
        },
        {
          id: "jay",
          kind: "witness",
          title: "What Jayden said",
          who: "Jayden",
          role: "fourth grader, library helper all week",
          said: "I helped Ms. Chen write in the log. My grade read 146 books. Reading on beanbags is the coolest thing ever.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["talk", "chart", "ava", "jay"],
          prompt: "Which source is the most reliable for how many books each grade read?",
          help: "Busca la fuente que contó los libros de cada grado y los escribió. Piensa también: ¿alguien tiene una razón para hacer ver a su grado mejor?",
          options: [
            {
              id: "a",
              text: "The library sign-in log, counted by the librarian",
              ok: true,
              why: "Yes. The librarian counted every book in the log.",
            },
            {
              id: "b",
              text: "Ava, a fifth grader",
              why: "Ava wants her own grade to win. Does she have a reason to make the number bigger?",
            },
            {
              id: "c",
              text: "Something a friend heard at recess",
              why: "Recess news passes from kid to kid. Who counted the books?",
            },
            {
              id: "d",
              text: "A student who came to the library only on Friday",
              why: "That student missed four days of the read-a-thon. Could they know the whole week's count?",
            },
          ],
          rule: C(
            "Trust the source that counted, not a person who wants one side to look good.",
            "Confía en la fuente que contó, no en una persona que quiere que un lado se vea bien.",
          ),
          explain:
            "The librarian wrote every book in the sign-in log all week, so the chart from that log is the most reliable count.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["chart", "ava", "jay"],
          prompt: "Ava and Jayden do not agree. Which detail is wrong?",
          help: "Mira las tres barras de la gráfica. ¿Qué grado tiene la barra más alta? ¿Cuántos libros leyó quinto grado?",
          options: [
            {
              id: "a",
              text: "Ava says fifth grade read the most, with 160 books.",
              ok: true,
            },
            {
              id: "b",
              text: "Jayden says his grade read 146 books.",
              why: "Find the Grade 4 bar. Does it match Jayden's number?",
            },
            {
              id: "c",
              text: "Ms. Chen says students read 412 books in all.",
              why: "Add the three bars: 128 + 146 + 138. What do you get?",
            },
          ],
          rule: C(
            'Check each number and each "most" against the chart.',
            'Compara cada número y cada "most" con la gráfica.',
          ),
          explain:
            "The chart shows Grade 5 read 138 books, not 160, and Grade 4 read the most with 146.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "ava", "jay"],
          prompt: "Sort each sentence. Is it a fact or an opinion?",
          help: "Pregúntate: ¿puedo comprobar esto en el registro o la gráfica? Si es lo que alguien siente o piensa, es una opinión.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "Students read 412 books in all.",
              cat: "fact",
              clue: C(
                "Can you add the bars to check it?",
                "¿Puedes sumar las barras para comprobarlo?",
              ),
            },
            {
              id: "i2",
              text: "Our class is the smartest in the school.",
              cat: "opinion",
              clue: C(
                'Is "smartest" something you can count?',
                '¿"Smartest" es algo que puedes contar?',
              ),
            },
            {
              id: "i3",
              text: "The read-a-thon was from Monday to Friday.",
              cat: "fact",
              clue: C("Could you check a calendar?", "¿Podrías revisar un calendario?"),
            },
            {
              id: "i4",
              text: "Reading on beanbags is the coolest thing ever.",
              cat: "opinion",
              clue: C("Is this how someone feels?", "¿Es lo que alguien siente?"),
            },
            {
              id: "i5",
              text: "Grade 3 read 128 books.",
              cat: "fact",
              clue: C("Is there a bar for this?", "¿Hay una barra para esto?"),
            },
            {
              id: "i6",
              text: "The Book Tree makes the library look beautiful.",
              cat: "opinion",
              clue: C(
                'Would everyone agree about "beautiful"?',
                '¿Todos estarían de acuerdo con "beautiful"?',
              ),
            },
          ],
          rule: C(
            "A fact can be checked. An opinion tells what someone feels or thinks.",
            "Un hecho se puede comprobar. Una opinión dice lo que alguien siente o piensa.",
          ),
          explain:
            "Numbers and days can be checked in the log. Smartest, coolest and beautiful are feelings, so those are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["chart", "talk"],
          prompt: "Write a headline about the read-a-thon. Keep it short and use only facts.",
          help: "Escribe 10 palabras o menos. Di qué pasó (los libros, el maratón de lectura) y usa un número si quieres. No uses palabras de opinión.",
          check: {
            min: 3,
            max: 10,
            ideas: [
              {
                any: ["read-a-thon", "read*", "book*", "librar*"],
                clue: C(
                  "Tell what the story is about: the books or the read-a-thon.",
                  "Di de qué trata la noticia: los libros o el maratón de lectura.",
                ),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline is short, tells the main event, and has no opinion words.",
            "Un titular es corto, cuenta el suceso principal y no tiene palabras de opinión.",
          ),
          frame: "Students Read ___ Books in ___",
          model: "Students Read 412 Books in Library Read-a-Thon",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart"],
          prompt: "Write the first sentence of your story. Tell who, what, when and where.",
          help: "Responde en una oración: ¿quién leyó? ¿qué hicieron (cuántos libros)? ¿cuándo fue? ¿dónde fue? Busca las respuestas en la entrevista con la Sra. Chen.",
          check: {
            min: 16,
            ideas: [
              {
                any: ["students", "grade*", "kids", "third", "fourth", "fifth", "readers"],
                clue: C("Say who read the books.", "Di quién leyó los libros."),
              },
              {
                any: ["412", "four hundred twelve", "books"],
                clue: C(
                  "Say what they did, with the number of books.",
                  "Di qué hicieron, con el número de libros.",
                ),
              },
              {
                any: ["last week", "monday", "friday", "this week", "all week", "one week", "week"],
                clue: C("Say when it happened.", "Di cuándo pasó."),
              },
              {
                any: ["librar*", "school"],
                clue: C("Say where it happened.", "Di dónde pasó."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A news lead answers who, what, when and where in one sentence, with facts only.",
            "El comienzo de una noticia responde quién, qué, cuándo y dónde en una oración, solo con hechos.",
          ),
          frame: "Last week, ___ read ___ books during the ___ in the ___.",
          model:
            "Last week, students in grades 3, 4 and 5 read 412 books during the read-a-thon in the school library.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["chart", "ava"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Your draft says: "Fifth graders read 160 books, more than any other grade." Ava told you that. Does the chart agree?',
          },
          prompt: "Rewrite the sentence so the facts match the chart. Name the source you checked.",
          help: "Mira la barra de Grade 5 y la barra más alta. Escribe cuántos libros leyó quinto grado y qué grado leyó más. Di dónde lo viste: The chart shows …",
          check: {
            min: 10,
            ideas: [
              {
                any: ["138", "one hundred thirty-eight", "146", "one hundred forty-six"],
                clue: C(
                  "Use a book number from the chart.",
                  "Usa un número de libros de la gráfica.",
                ),
              },
              {
                any: ["fourth", "grade 4", "4th", "grade four"],
                clue: C(
                  "Say which grade really read the most.",
                  "Di qué grado leyó más de verdad.",
                ),
              },
            ],
            avoid: [
              {
                any: ["160", "one hundred sixty"],
                clue: C(
                  "That number came from a fifth grader who wanted her grade to win. Use the log's number.",
                  "Ese número vino de una alumna de quinto que quería que su grado ganara. Usa el número del registro.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Fix a wrong fact with the number from the record, and say where you found it.",
            "Corrige un dato equivocado con el número del registro y di dónde lo encontraste.",
          ),
          frame:
            "The chart shows that fifth graders read ___ books, but ___ graders read the most.",
          model:
            "The chart shows that fifth graders read 138 books, but fourth graders read the most, with 146 books.",
          keep: "Corrected sentence",
        },
      ],
    },
    {
      id: "nc35-lostdog",
      title: "Found at Cedar Park",
      art: ["bg-park", "char-dog"],
      intro:
        "Pepper, a small brown dog, was lost for two days. Now she is home. People all over town are telling the story, but not everyone tells it the same way. This time you have more sources to check.",
      introEs:
        "Pepper, una perrita café pequeña, estuvo perdida dos días. Ahora está en casa. Toda la gente del pueblo cuenta la historia, pero no todos la cuentan igual. Esta vez tienes más fuentes que revisar.",
      outro:
        'Ms. Rivera reads your story twice. "Every fact checks out," she says, and pins it on the newsroom wall next to Pepper\'s photo. You are a real reporter now.',
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with Pepper's owner",
          who: "Mr. Alvarez, Pepper's owner",
          qa: [
            {
              q: "How did Pepper get lost?",
              a: "On Friday evening she slipped out of her leash near the Cedar Park gate.",
            },
            {
              q: "Who helped look for her?",
              a: "About 30 neighbors searched with me over three days.",
            },
            {
              q: "How did people know she was lost?",
              a: "My daughter hung flyers at the market and the library.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "Volunteers in the search, by day",
          unit: "people",
          bars: [
            { label: "Friday evening", value: 3 },
            { label: "Saturday", value: 11 },
            { label: "Sunday morning", value: 16 },
          ],
          source: "Cedar Park office sign-in sheet",
        },
        {
          id: "log",
          kind: "record",
          title: "Cedar Park office log",
          rows: [
            ["Friday, 6:30 p.m.", "Owner reports lost dog: Pepper, small, brown, red collar"],
            ["Saturday, 9:00 a.m.", "Search team meets at the park gate"],
            [
              "Sunday, 10:30 a.m.",
              "Park worker Ms. Gomez finds Pepper under the slide at the playground",
            ],
            ["Sunday, 11:00 a.m.", "Pepper goes home with her owner"],
          ],
        },
        {
          id: "nico",
          kind: "witness",
          title: "What Nico saw",
          who: "Nico",
          role: "third grader, at the playground on Sunday morning",
          said: "On Sunday morning I saw a park worker pull Pepper out from under the slide! Pepper is the cutest dog in town.",
        },
        {
          id: "banks",
          kind: "witness",
          title: "What Mrs. Banks heard",
          who: "Mrs. Banks",
          role: "walks in the park, came on Sunday afternoon",
          said: "I came in the afternoon, so I missed it. Someone told me Pepper was found by the pond on Saturday night.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["log", "nico", "banks"],
          prompt: "Which source is the most reliable for where and when Pepper was found?",
          help: "Busca la fuente que escribió la hora y el lugar en el momento en que pasó. Piensa en quién llegó tarde y quién solo escuchó la historia.",
          options: [
            {
              id: "a",
              text: "The park office log, written when it happened",
              ok: true,
              why: "Yes. The office wrote the time and the place right when Pepper was found.",
            },
            {
              id: "b",
              text: "Mrs. Banks, who came on Sunday afternoon",
              why: "Mrs. Banks says she missed it. Did she see it, or did someone tell her?",
            },
            {
              id: "c",
              text: "A story going around at the market",
              why: "A story at the market passes from person to person. Who there saw it?",
            },
            {
              id: "d",
              text: "A neighbor who wants to be in the newspaper and says he found Pepper",
              why: "This neighbor wants to be in the story. Does he have a reason to make his part bigger?",
            },
          ],
          rule: C(
            "The most reliable source wrote it down at the time, and has no reason to change the story.",
            "La fuente más confiable lo escribió en ese momento y no tiene razón para cambiar la historia.",
          ),
          explain:
            "The park office log has the exact time and place: Sunday at 10:30 a.m., under the slide at the playground.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["log", "nico", "banks"],
          prompt: "Nico and Mrs. Banks do not agree. Which detail is wrong?",
          help: "Lee la línea del registro del domingo a las 10:30. Compara el lugar y el día con lo que dice cada persona.",
          options: [
            {
              id: "a",
              text: "Mrs. Banks says Pepper was found by the pond on Saturday night.",
              ok: true,
            },
            {
              id: "b",
              text: "Nico says a park worker found Pepper under the slide.",
              why: "Read the Sunday 10:30 line in the log. Who found Pepper, and where?",
            },
            {
              id: "c",
              text: "Nico says it happened on Sunday morning.",
              why: "Check the day and time in the log. Do they match Nico?",
            },
          ],
          rule: C(
            "When two people disagree, check the place and the time against the record.",
            "Cuando dos personas no están de acuerdo, compara el lugar y la hora con el registro.",
          ),
          explain:
            "The log says Pepper was found under the slide at the playground on Sunday morning. Mrs. Banks only heard the story, and the pond and Saturday night are wrong.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "nico", "banks", "chart"],
          prompt: "Sort each sentence. Is it a fact or an opinion?",
          help: "Un hecho se puede comprobar en el registro, la gráfica o la entrevista. Una opinión dice lo que alguien siente o piensa.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "Pepper wears a red collar.",
              cat: "fact",
              clue: C("Could you look at her collar?", "¿Podrías mirar su collar?"),
            },
            {
              id: "i2",
              text: "Pepper is the cutest dog in town.",
              cat: "opinion",
              clue: C('Can "cutest" be counted?', '¿Se puede contar "cutest"?'),
            },
            {
              id: "i3",
              text: "Sixteen people searched on Sunday morning.",
              cat: "fact",
              clue: C("Is there a bar for this?", "¿Hay una barra para esto?"),
            },
            {
              id: "i4",
              text: "The flyers were wonderful.",
              cat: "opinion",
              clue: C(
                "Is this a feeling about the flyers?",
                "¿Es un sentimiento sobre los volantes?",
              ),
            },
            {
              id: "i5",
              text: "Pepper got lost on Friday evening.",
              cat: "fact",
              clue: C("Could you check the log?", "¿Podrías revisar el registro?"),
            },
            {
              id: "i6",
              text: "Dogs should never go to the park without a leash.",
              cat: "opinion",
              clue: C(
                'Does "should" tell what someone thinks?',
                '¿"Should" dice lo que alguien piensa?',
              ),
            },
          ],
          rule: C(
            "A fact can be checked. An opinion tells what someone feels or thinks should happen.",
            "Un hecho se puede comprobar. Una opinión dice lo que alguien siente o piensa que debe pasar.",
          ),
          explain:
            "The collar, the day and the number of people can be checked. Cutest, wonderful and should show feelings and ideas, so they are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["log", "talk"],
          prompt: "Write a headline about Pepper. Keep it short and use only facts.",
          help: "Escribe 10 palabras o menos. Di quién (la perrita) y qué pasó (la encontraron). No uses palabras de opinión.",
          check: {
            min: 3,
            max: 10,
            ideas: [
              {
                any: ["dog", "pepper", "puppy"],
                clue: C("Say who the story is about.", "Di de quién trata la noticia."),
              },
              {
                any: ["found", "finds", "home", "back", "safe", "rescued"],
                clue: C("Say what happened to her.", "Di qué le pasó."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline is short, tells who and what happened, and has no opinion words.",
            "Un titular es corto, dice quién y qué pasó y no tiene palabras de opinión.",
          ),
          frame: "Lost Dog ___ Found ___",
          model: "Lost Dog Pepper Found Under Playground Slide at Cedar Park",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart", "log"],
          prompt:
            "Write the first sentence of your story. Tell who, what, when and where. Add one more fact.",
          help: "Responde en una oración larga: ¿quién encontró a Pepper? ¿qué pasó? ¿cuándo? ¿dónde? Agrega un dato más, como cuántos vecinos ayudaron. Usa el registro y la gráfica.",
          check: {
            min: 18,
            ideas: [
              {
                any: ["ms. gomez", "gomez", "park worker", "worker", "pepper", "dog"],
                clue: C(
                  "Say who: the dog, or the person who found her.",
                  "Di quién: la perrita o la persona que la encontró.",
                ),
              },
              {
                any: ["found", "finds", "rescued", "pulled"],
                clue: C("Say what happened.", "Di qué pasó."),
              },
              {
                any: ["sunday"],
                clue: C("Say when she was found.", "Di cuándo la encontraron."),
              },
              {
                any: ["playground", "slide", "cedar park", "park"],
                clue: C("Say where she was found.", "Di dónde la encontraron."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A news lead answers who, what, when and where with facts only. A longer lead adds one more fact.",
            "El comienzo de una noticia responde quién, qué, cuándo y dónde solo con hechos. Uno más largo agrega otro dato.",
          ),
          frame: "On ___, ___ found ___ under the ___ at ___, after ___ neighbors helped search.",
          model:
            "On Sunday morning, park worker Ms. Gomez found Pepper, a small brown dog, under the slide at the Cedar Park playground after 30 neighbors helped search.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["log", "banks"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Your draft says: "Pepper was found by the pond on Saturday night." That came from someone who was not there. Fix it with the record.',
          },
          prompt:
            "Rewrite the sentence with the right place and time. Name the source you checked.",
          help: "Lee la línea del domingo en el registro del parque. Escribe el lugar correcto y el día correcto, y di dónde lo viste: The log says …",
          check: {
            min: 10,
            ideas: [
              {
                any: ["playground", "slide"],
                clue: C("Use the place from the log.", "Usa el lugar del registro."),
              },
              {
                any: ["sunday"],
                clue: C("Use the day from the log.", "Usa el día del registro."),
              },
            ],
            avoid: [
              {
                any: ["pond"],
                clue: C(
                  "That place came from someone who only heard the story. Use the log's place.",
                  "Ese lugar vino de alguien que solo escuchó la historia. Usa el lugar del registro.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Fix a wrong fact with the place and time from the record, and say where you found it.",
            "Corrige un dato equivocado con el lugar y la hora del registro y di dónde los encontraste.",
          ),
          frame: "The park log says Pepper was found under the ___ at the ___ on ___ morning.",
          model:
            "The park office log says Pepper was found under the slide at the playground on Sunday morning.",
          keep: "Corrected sentence",
        },
      ],
    },
  ],
};
