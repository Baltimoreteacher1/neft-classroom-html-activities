// Newsroom Challenge, grades 6-8: "The Eastbrook Ledger". Content only (schema: engine.js).
// Every assignment runs the same newsroom routine: judge source reliability, resolve a conflict between witnesses with
// the data, sort fact from opinion, write a headline, write a 5W lead, and correct a draft sentence the editor flags.
import { TRANSIT_68 } from "./newsroom-challenge-transit.js";

const C = (en, es) => [en, es];

const FACT = { id: "fact", label: C("Fact: can be checked", "Hecho: se puede comprobar") };
const OPINION = {
  id: "opinion",
  label: C("Opinion: a feeling or judgment", "Opinión: un sentimiento o juicio"),
};
const EDITOR = "Mr. Haddad, editor";

export const BAND_68 = {
  premise:
    "You just joined The Eastbrook Ledger, the community newspaper that student reporters help write. Your editor, Mr. Haddad, has one rule: a story is not finished until every fact is checked against a source you can trust. Four assignments are waiting, and the last one follows a city bus route.",
  premiseEs:
    "Acabas de entrar a The Eastbrook Ledger, el periódico comunitario que ayudan a escribir reporteros estudiantes. Tu editor, el Sr. Haddad, tiene una regla: una noticia no está terminada hasta que cada dato se compara con una fuente confiable. Cuatro encargos te esperan, y el último sigue una ruta de autobús de la ciudad.",
  chapters: [
    {
      id: "nc68-crosswalk",
      title: "The Linden Avenue Crosswalk",
      art: ["bg-city", "char-reporter"],
      intro:
        'For months, parents complained about cars speeding past Eastbrook Middle School. This week the city opened a new crosswalk on Linden Avenue. Mr. Haddad hands you the file: "People are already arguing about the numbers. Find out which ones are true."',
      introEs:
        'Durante meses, las familias se quejaron de los carros que pasan rápido frente a la Escuela Intermedia Eastbrook. Esta semana la ciudad abrió un nuevo cruce peatonal en la avenida Linden. El Sr. Haddad te da la carpeta: "La gente ya discute por los números. Averigua cuáles son ciertos."',
      outro:
        'Your crosswalk story runs on the front page, and nobody writes in to complain about the numbers. Mr. Haddad nods. "Next: the community food drive just ended. Two sites both say they collected the most."',
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with the city traffic engineer",
          who: "Ruth Ibarra, city traffic engineer",
          qa: [
            {
              q: "Why did the city add a crosswalk here?",
              a: "The school safety team recorded 28 near-misses at Linden Avenue and 4th Street this fall. A near-miss is when a car almost hits a person.",
            },
            {
              q: "When did it open?",
              a: "On Monday, December 1, at 7:00 a.m., before students arrived.",
            },
            {
              q: "What is new at the corner?",
              a: "Painted stripes, two flashing yellow signs, and a crossing guard from 7:30 to 8:15 each school morning.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "Near-misses at Linden Ave. and 4th St., by month",
          unit: "near-misses",
          bars: [
            { label: "September", value: 6 },
            { label: "October", value: 9 },
            { label: "November", value: 13 },
          ],
          source: "Eastbrook Middle School safety team log, checked by the city",
        },
        {
          id: "notice",
          kind: "record",
          title: "City notice: new crosswalk",
          rows: [
            ["Location", "Linden Avenue and 4th Street"],
            ["Approved", "City council vote, 5 to 2"],
            ["Cost", "$14,000"],
            ["Opening", "Monday, December 1, 7:00 a.m."],
          ],
        },
        {
          id: "tran",
          kind: "witness",
          title: "Statement from a shop owner",
          who: "Mr. Tran",
          role: "owns the bakery on the corner, opens at 6:00 a.m. every day",
          said: "I watch that corner every morning. The safety team told me they counted 13 near-misses in November alone. The new signs look terrific.",
        },
        {
          id: "lowe",
          kind: "witness",
          title: "Statement from a parent",
          who: "Ms. Lowe",
          role: "parent who led the campaign for the crosswalk",
          said: "There were at least 50 near-misses this fall. Drivers on Linden Avenue are careless, and the city waited far too long.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["chart", "tran", "lowe"],
          prompt: "Which source is the most reliable for how many near-misses happened this fall?",
          help: "Busca la fuente que contó los casos mientras pasaban y que otra persona revisó. Piensa si alguna persona tiene una razón para hacer el número más grande, o si llegó después.",
          options: [
            {
              id: "a",
              text: "The safety team log, checked by the city",
              ok: true,
              why: "Yes. The team recorded each near-miss as it happened, and the city checked the log.",
            },
            {
              id: "b",
              text: "Ms. Lowe, who led the campaign for the crosswalk",
              why: "Ms. Lowe worked hard to win the crosswalk. Does she have a reason to make the problem sound bigger?",
            },
            {
              id: "c",
              text: "A post shared in a neighborhood group chat",
              why: "A shared post can travel far without anyone checking it. Who counted, and how?",
            },
            {
              id: "d",
              text: "A driver who first used Linden Avenue in December",
              why: "The near-misses happened from September to November. Was this driver there to see them?",
            },
          ],
          rule: C(
            "A reliable source recorded the facts at the time, was checked by someone else, and has no reason to exaggerate.",
            "Una fuente confiable registró los hechos en el momento, otra persona la revisó y no tiene razón para exagerar.",
          ),
          explain:
            "The safety team log recorded each near-miss as it happened, and the city checked it, so its count of 28 is the most reliable.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["chart", "tran", "lowe"],
          prompt: "Mr. Tran and Ms. Lowe give different numbers. Which detail is wrong?",
          help: "Suma las tres barras de la gráfica para tener el total del otoño. Luego compara ese total y la barra de noviembre con lo que dice cada persona.",
          options: [
            {
              id: "a",
              text: "Ms. Lowe says there were at least 50 near-misses this fall.",
              ok: true,
            },
            {
              id: "b",
              text: "Mr. Tran says there were 13 near-misses in November.",
              why: "Find the November bar. Does it match Mr. Tran's number?",
            },
            {
              id: "c",
              text: "Mr. Tran says he watches the corner every morning.",
              why: "His bakery is on that corner and opens at 6:00 a.m. Is anything in the sources against that?",
            },
          ],
          rule: C(
            "Resolve a conflict between witnesses with the data: add up or read the record, then compare.",
            "Resuelve un conflicto entre testigos con los datos: suma o lee el registro y luego compara.",
          ),
          explain:
            "The chart adds up to 6 + 9 + 13 = 28 near-misses this fall, not 50. Mr. Tran's November number, 13, matches the chart.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "notice", "tran", "lowe"],
          prompt: "Sort each statement from the sources. Is it a fact or an opinion?",
          help: "Un hecho se puede comprobar con un registro, una medida o un documento. Una opinión es un juicio: dice si algo es bueno, malo, suficiente o lo que debería pasar.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "The crosswalk cost $14,000.",
              cat: "fact",
              clue: C(
                "Could you check the city notice?",
                "¿Podrías revisarlo en el aviso de la ciudad?",
              ),
            },
            {
              id: "i2",
              text: "Drivers on Linden Avenue are careless.",
              cat: "opinion",
              clue: C(
                'Is "careless" a measurement or a judgment?',
                '¿"Careless" es una medida o un juicio?',
              ),
            },
            {
              id: "i3",
              text: "The city council approved the crosswalk 5 to 2.",
              cat: "fact",
              clue: C("Is there a record of the vote?", "¿Hay un registro de la votación?"),
            },
            {
              id: "i4",
              text: "The city waited far too long.",
              cat: "opinion",
              clue: C('Who decides what is "too long"?', '¿Quién decide qué es "too long"?'),
            },
            {
              id: "i5",
              text: "A crossing guard works from 7:30 to 8:15.",
              cat: "fact",
              clue: C("Could you go and see it?", "¿Podrías ir a verlo?"),
            },
            {
              id: "i6",
              text: "The new signs look terrific.",
              cat: "opinion",
              clue: C(
                "Would everyone agree about how they look?",
                "¿Todos estarían de acuerdo sobre cómo se ven?",
              ),
            },
          ],
          rule: C(
            "A fact can be checked in a record or by observation. An opinion is a judgment someone could disagree with.",
            "Un hecho se puede comprobar en un registro u observando. Una opinión es un juicio con el que alguien podría no estar de acuerdo.",
          ),
          explain:
            "Costs, votes and times can be checked. Careless, too long and terrific are judgments, so those statements are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["talk", "chart", "notice"],
          prompt: "Write a headline for the crosswalk story. Use facts only.",
          help: "Escribe 12 palabras o menos. Nombra el tema (el cruce peatonal) y lo que pasó. Puedes agregar un dato, como el lugar o el número de casos. No uses palabras de opinión como best o should.",
          check: {
            min: 3,
            max: 12,
            ideas: [
              {
                any: ["crosswalk*", "crossing", "cross walk"],
                clue: C("Name the topic of the story.", "Nombra el tema de la noticia."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline names the main event in a few words, with a strong verb and no opinion.",
            "Un titular nombra el suceso principal en pocas palabras, con un verbo fuerte y sin opinión.",
          ),
          frame: "New Crosswalk ___ on ___ After ___",
          model: "New Crosswalk Opens on Linden Avenue After 28 Near-Misses",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart", "notice"],
          prompt: "Write the lead for your story. Answer who, what, when, where and why.",
          help: "El primer párrafo de una noticia responde las 5 preguntas: ¿quién? (la ciudad), ¿qué? (abrió el cruce), ¿cuándo? (el día), ¿dónde? (las calles) y ¿por qué? (los casos de casi accidentes). Usa la entrevista, la gráfica y el aviso.",
          check: {
            min: 18,
            ideas: [
              {
                any: ["city", "council", "workers", "safety team", "students", "eastbrook"],
                clue: C(
                  "Say who: who opened it, or who it is for.",
                  "Di quién: quién lo abrió o para quién es.",
                ),
              },
              {
                any: ["crosswalk*", "crossing", "flashing sign*"],
                clue: C("Say what is new.", "Di qué hay de nuevo."),
              },
              {
                any: ["monday", "december", "this week"],
                clue: C("Say when it opened.", "Di cuándo abrió."),
              },
              {
                any: ["linden", "4th street", "fourth street", "middle school"],
                clue: C("Say where it is.", "Di dónde está."),
              },
              {
                any: [
                  "near miss*",
                  "near-miss*",
                  "almost hit",
                  "nearly hit",
                  "safety",
                  "safe*",
                  "accident*",
                ],
                clue: C("Say why the city added it.", "Di por qué la ciudad lo agregó."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A news lead packs who, what, when, where and why into the first sentence or two, with facts only.",
            "El comienzo de una noticia pone quién, qué, cuándo, dónde y por qué en la primera o segunda oración, solo con hechos.",
          ),
          frame: "On ___, the city opened a new crosswalk at ___, outside ___, because ___.",
          model:
            "On Monday, December 1, the city opened a new crosswalk with two flashing signs at Linden Avenue and 4th Street, outside Eastbrook Middle School, because the school safety team recorded 28 near-misses this fall.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["chart", "lowe"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Paragraph three of your draft says: "Neighbors say there were more than 50 near-misses on Linden Avenue this fall." Is that what the record shows?',
          },
          prompt: "Rewrite the sentence so it is accurate. Name the source of your number.",
          help: "Suma las barras de la gráfica para encontrar el total del otoño. Escribe la oración con ese número y nombra la fuente: The safety team log shows …",
          check: {
            min: 10,
            ideas: [
              {
                any: ["28", "twenty-eight", "twenty eight"],
                clue: C(
                  "Use the fall total from the data.",
                  "Usa el total del otoño que dan los datos.",
                ),
              },
            ],
            avoid: [
              {
                any: ["50", "fifty"],
                clue: C(
                  "That number came from someone with a reason to exaggerate. Use the recorded total.",
                  "Ese número vino de alguien con una razón para exagerar. Usa el total registrado.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Correct a wrong fact with the number from the most reliable source, and attribute it.",
            "Corrige un dato equivocado con el número de la fuente más confiable y di de dónde viene.",
          ),
          frame: "The ___ shows ___ near-misses on Linden Avenue from ___ to ___.",
          model:
            "The safety team log shows 28 near-misses on Linden Avenue from September to November.",
          keep: "Corrected sentence",
        },
      ],
    },
    {
      id: "nc68-fooddrive",
      title: "The Food Drive Results",
      art: ["bg-market", "char-reporter"],
      intro:
        "For two weeks, bins at four drop-off sites filled up with cans, rice and pasta for the Eastbrook Community Pantry. Now the drive is over, and two sites both claim first place. Mr. Haddad wants the real totals.",
      introEs:
        "Durante dos semanas, las cajas de cuatro lugares de donación se llenaron de latas, arroz y pasta para la Despensa Comunitaria de Eastbrook. Ahora la colecta terminó y dos lugares dicen que quedaron en primer lugar. El Sr. Haddad quiere los totales reales.",
      outro:
        'The pantry director calls the newsroom to thank you for getting the totals right. Then the sky goes dark. By morning, the news is everywhere: a storm has flooded the community center. "This is your biggest story yet," Mr. Haddad says.',
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with the pantry coordinator",
          who: "Samuel Reyes, volunteer coordinator, Eastbrook Community Pantry",
          qa: [
            {
              q: "How long did the food drive last?",
              a: "Two weeks. It ended on Saturday, when we weighed everything.",
            },
            {
              q: "Did you reach your goal?",
              a: "Our goal was 2,000 pounds. We collected 2,450 pounds.",
            },
            {
              q: "Why does the pantry need food now?",
              a: "We serve about 300 families each month, and our shelves are usually emptiest in winter.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "Food collected by drop-off site",
          unit: "pounds",
          bars: [
            { label: "Eastbrook Middle School", value: 1120 },
            { label: "Public library", value: 610 },
            { label: "Fire Station 3", value: 440 },
            { label: "Community center", value: 280 },
          ],
          source: "Pantry scale records, everything weighed on Saturday",
        },
        {
          id: "poster",
          kind: "record",
          title: "Pantry thank-you poster",
          rows: [
            ["Goal", "2,000 pounds"],
            ["Total collected", "2,450 pounds"],
            ["Drop-off sites", "4"],
            ["Top site", "Eastbrook Middle School"],
          ],
        },
        {
          id: "priya",
          kind: "witness",
          title: "Statement from a student",
          who: "Priya",
          role: "eighth grader on the student council, helped weigh the food",
          said: "I helped at the scale on Saturday. Our school brought in 1,120 pounds, more than any other site. Everyone in Eastbrook should donate next year.",
        },
        {
          id: "daniels",
          kind: "witness",
          title: "Statement from a volunteer",
          who: "Mr. Daniels",
          role: "ran the library drop-off site, left before the weighing",
          said: "The library was the top site. We collected about 1,200 pounds. Our bins were full every single day.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["chart", "priya", "daniels"],
          prompt: "Which source is the most reliable for how much food each site collected?",
          help: "Busca la fuente que pesó la comida de cada lugar y lo anotó. Piensa si alguien quiere que su propio lugar se vea mejor, o si no estaba cuando se pesó todo.",
          options: [
            {
              id: "a",
              text: "The pantry scale records from Saturday",
              ok: true,
              why: "Yes. Every bin was weighed on one scale and written down.",
            },
            {
              id: "b",
              text: "Mr. Daniels, who ran the library site",
              why: "Mr. Daniels ran one of the sites, and he left before the weighing. Could he know the real weights, and does he want his site to win?",
            },
            {
              id: "c",
              text: "A neighbor who guessed from how full the bins looked",
              why: "A full-looking bin can hold light boxes or heavy cans. Was anything weighed?",
            },
            {
              id: "d",
              text: "A shopper who walked by on the last afternoon",
              why: "The drive lasted two weeks. What could one afternoon show about the totals?",
            },
          ],
          rule: C(
            "Measured data recorded at the time beats a guess, a late look, or a person with a stake in the result.",
            "Los datos medidos y registrados en el momento valen más que una suposición, una mirada tardía o una persona interesada en el resultado.",
          ),
          explain:
            "The pantry weighed every site's food on Saturday and recorded it, so the scale records are the most reliable.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["chart", "poster", "priya", "daniels"],
          prompt:
            "Priya and Mr. Daniels both say their site collected the most. Which detail is wrong?",
          help: 'Mira la barra más alta de la gráfica y la línea "Top site" del cartel. Compara el número de la biblioteca con lo que dice cada persona.',
          options: [
            {
              id: "a",
              text: "Mr. Daniels says the library was the top site, with about 1,200 pounds.",
              ok: true,
            },
            {
              id: "b",
              text: "Priya says her school brought in 1,120 pounds.",
              why: "Find the Eastbrook Middle School bar. Does it match Priya's number?",
            },
            {
              id: "c",
              text: "Priya says she helped at the scale on Saturday.",
              why: "The interview says everything was weighed on Saturday. Is anything in the sources against her being there?",
            },
          ],
          rule: C(
            "Resolve a conflict with the data: compare each claim to the measured numbers.",
            "Resuelve un conflicto con los datos: compara cada afirmación con los números medidos.",
          ),
          explain:
            "The scale records show the library collected 610 pounds, and the school was the top site with 1,120 pounds, which the poster also lists.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "priya", "daniels", "poster"],
          prompt: "Sort each statement from the sources. Is it a fact or an opinion?",
          help: "Pregúntate: ¿se puede comprobar con una báscula, un registro o un documento? Si dice lo que alguien piensa que debería pasar o cómo se siente, es una opinión.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "The drive collected 2,450 pounds of food.",
              cat: "fact",
              clue: C("Was this weighed and recorded?", "¿Esto se pesó y se registró?"),
            },
            {
              id: "i2",
              text: "Everyone in Eastbrook should donate next year.",
              cat: "opinion",
              clue: C(
                'Does "should" state a fact or a belief?',
                '¿"Should" dice un hecho o una creencia?',
              ),
            },
            {
              id: "i3",
              text: "The pantry serves about 300 families each month.",
              cat: "fact",
              clue: C(
                "Could the pantry's records check this?",
                "¿Los registros de la despensa podrían comprobarlo?",
              ),
            },
            {
              id: "i4",
              text: "Canned soup is the most useful thing to give.",
              cat: "opinion",
              clue: C(
                'Could people disagree about "most useful"?',
                '¿La gente podría no estar de acuerdo con "most useful"?',
              ),
            },
            {
              id: "i5",
              text: "The goal was 2,000 pounds.",
              cat: "fact",
              clue: C("Is it written on the poster?", "¿Está escrito en el cartel?"),
            },
            {
              id: "i6",
              text: "The volunteers did an incredible job.",
              cat: "opinion",
              clue: C(
                'Is "incredible" a measurement or a judgment?',
                '¿"Incredible" es una medida o un juicio?',
              ),
            },
          ],
          rule: C(
            "A fact can be checked in a record or by measuring. An opinion is a belief or judgment.",
            "Un hecho se puede comprobar en un registro o midiendo. Una opinión es una creencia o un juicio.",
          ),
          explain:
            "Weights, goals and the number of families can be checked. Should, most useful and incredible show beliefs and judgments, so those are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["talk", "chart", "poster"],
          prompt: "Write a headline for the food drive story. Use facts only.",
          help: "Escribe 12 palabras o menos. Nombra el tema (la colecta de comida) y el resultado más importante, como el total o la meta. Sin palabras de opinión.",
          check: {
            min: 3,
            max: 12,
            ideas: [
              {
                any: ["food drive", "food", "pantry", "donation*", "pound*"],
                clue: C("Name the topic of the story.", "Nombra el tema de la noticia."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline names the main result in a few words, with a strong verb and no opinion.",
            "Un titular nombra el resultado principal en pocas palabras, con un verbo fuerte y sin opinión.",
          ),
          frame: "Food Drive ___ ___ Pounds, ___ Its Goal",
          model: "Food Drive Collects 2,450 Pounds, Passing Its Goal",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart", "poster"],
          prompt: "Write the lead for your story. Answer who, what, when, where and why.",
          help: "Responde las 5 preguntas en una o dos oraciones: ¿quién donó? ¿qué (cuánta comida)? ¿cuándo terminó? ¿dónde (los lugares)? ¿por qué (para qué es la comida)? Usa la entrevista con el Sr. Reyes.",
          check: {
            min: 20,
            ideas: [
              {
                any: [
                  "students",
                  "neighbors",
                  "residents",
                  "volunteers",
                  "families",
                  "donors",
                  "people",
                  "community",
                ],
                clue: C("Say who gave the food.", "Di quién dio la comida."),
              },
              {
                any: ["2,450", "2450", "pounds", "food"],
                clue: C("Say what was collected, with the amount.", "Di qué se juntó y cuánto."),
              },
              {
                any: ["saturday", "two weeks", "2 weeks", "this week", "last week"],
                clue: C(
                  "Say when the drive happened or ended.",
                  "Di cuándo fue o terminó la colecta.",
                ),
              },
              {
                any: ["eastbrook", "drop-off", "drop off", "sites", "four sites", "4 sites"],
                clue: C("Say where people gave the food.", "Di dónde la gente dejó la comida."),
              },
              {
                any: ["pantry", "families", "winter", "shelves", "hungry", "hunger"],
                clue: C("Say why the food was collected.", "Di por qué se juntó la comida."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A news lead packs who, what, when, where and why into the first sentence or two, with facts only.",
            "El comienzo de una noticia pone quién, qué, cuándo, dónde y por qué en la primera o segunda oración, solo con hechos.",
          ),
          frame: "Over ___, ___ donated ___ pounds of food at ___ to ___.",
          model:
            "Over two weeks ending Saturday, Eastbrook students and neighbors donated 2,450 pounds of food at four drop-off sites, passing the 2,000-pound goal, to refill the Community Pantry before winter.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["chart", "daniels"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Your draft says: "The public library collected the most food, about 1,200 pounds." Mr. Daniels told you that, but he left before the weighing. Check it.',
          },
          prompt: "Rewrite the sentence so it is accurate. Name the source of your numbers.",
          help: "Busca la barra de la biblioteca y la barra más alta. Escribe cuánto juntó la biblioteca y qué lugar juntó más, y nombra la fuente: The scale records show …",
          check: {
            min: 12,
            ideas: [
              {
                any: ["610", "six hundred ten"],
                clue: C(
                  "Use the library's weight from the data.",
                  "Usa el peso de la biblioteca que dan los datos.",
                ),
              },
              {
                any: ["middle school", "school", "1,120", "1120"],
                clue: C(
                  "Say which site really collected the most.",
                  "Di qué lugar juntó más de verdad.",
                ),
              },
            ],
            avoid: [
              {
                any: ["1,200", "1200", "twelve hundred"],
                clue: C(
                  "That number came from someone who left before the weighing. Use the scale records.",
                  "Ese número vino de alguien que se fue antes de pesar. Usa los registros de la báscula.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Correct a wrong fact with the numbers from the most reliable source, and attribute them.",
            "Corrige un dato equivocado con los números de la fuente más confiable y di de dónde vienen.",
          ),
          frame:
            "The scale records show that the library collected ___ pounds, while ___ collected the most.",
          model:
            "The pantry scale records show that the library collected 610 pounds, while Eastbrook Middle School collected the most, 1,120 pounds.",
          keep: "Corrected sentence",
        },
      ],
    },
    {
      id: "nc68-flood",
      title: "The Night the Center Flooded",
      art: ["bg-night", "char-reporter"],
      intro:
        "On Tuesday night, a storm dumped rain on Eastbrook for hours. By Wednesday morning, water filled part of the community center. Rumors are spreading faster than the water did. This time you have five sources, and Mr. Haddad wants a full, accurate lead.",
      introEs:
        "El martes por la noche, una tormenta dejó caer lluvia sobre Eastbrook durante horas. El miércoles por la mañana, el agua llenó parte del centro comunitario. Los rumores corren más rápido que el agua. Esta vez tienes cinco fuentes, y el Sr. Haddad quiere un comienzo completo y preciso.",
      outro:
        "Your flood story goes out that evening. The next day, families know exactly where tutoring has moved and when the center will reopen, because every number in your story was right. Mr. Haddad adds your name to the Ledger's staff list.",
      docs: [
        {
          id: "talk",
          kind: "interview",
          title: "Interview with the center director",
          who: "Amara Lewis, director, Eastbrook Community Center",
          qa: [
            {
              q: "What happened?",
              a: "Rain came in through the basement doors on Tuesday night. The basement and the gym flooded.",
            },
            {
              q: "How long will the center be closed?",
              a: "About three weeks, while the city dries the building and repairs the gym floor.",
            },
            {
              q: "What happens to the programs?",
              a: "After-school tutoring moves to the public library starting Thursday.",
            },
          ],
        },
        {
          id: "chart",
          kind: "chart",
          title: "Rainfall on Tuesday night, by hour",
          unit: "inches",
          bars: [
            { label: "8 to 9 p.m.", value: 0.4 },
            { label: "9 to 10 p.m.", value: 1.6 },
            { label: "10 to 11 p.m.", value: 1.2 },
            { label: "11 p.m. to midnight", value: 0.3 },
          ],
          source: "City weather station at Eastbrook Park",
        },
        {
          id: "report",
          kind: "record",
          title: "City facilities report, Wednesday 8:00 a.m.",
          rows: [
            ["Measured by", "City building inspector"],
            ["Deepest water (basement)", "14 inches"],
            ["Rooms damaged", "Basement storage room, gym"],
            ["Rooms not damaged", "Front office, kitchen, art room"],
            ["Expected reopening", "In about three weeks"],
          ],
        },
        {
          id: "ellis",
          kind: "witness",
          title: "Statement from the night custodian",
          who: "Mr. Ellis",
          role: "night custodian, in the building all night",
          said: "The heaviest rain came between 9 and 10. By morning, the basement water was about 14 inches deep. It was the worst night of my job.",
        },
        {
          id: "tasha",
          kind: "witness",
          title: "Statement from a teen",
          who: "Tasha",
          role: "goes to the teen program, came by on Wednesday afternoon",
          said: "My friend said the water got four feet deep and the whole building is ruined. The city should have fixed those doors years ago.",
        },
      ],
      steps: [
        {
          id: "source",
          type: "choose",
          docs: ["report", "ellis", "tasha"],
          prompt: "Which source is the most reliable for how deep the water got?",
          help: "Busca la fuente que midió el agua de verdad y lo escribió. Piensa en quién llegó tarde y solo escuchó, y en quién podría ganar algo si el daño parece mayor.",
          options: [
            {
              id: "a",
              text: "The city facilities report, measured by an inspector",
              ok: true,
              why: "Yes. An inspector measured the water on Wednesday morning and wrote it down.",
            },
            {
              id: "b",
              text: "Tasha, who came by on Wednesday afternoon",
              why: "Tasha came the next afternoon, and she is repeating what a friend said. Did anyone in her story measure?",
            },
            {
              id: "c",
              text: "A dramatic photo caption shared online",
              why: "A caption online can be written by anyone, from anywhere. Who measured the water?",
            },
            {
              id: "d",
              text: "A company that sells flood pumps",
              why: "This company sells more pumps when floods sound worse. Does it have a reason to exaggerate?",
            },
          ],
          rule: C(
            "A measurement recorded by an official at the scene beats a secondhand report, a rumor, or a source that profits from the story.",
            "Una medida registrada por un funcionario en el lugar vale más que un relato de segunda mano, un rumor o una fuente que gana con la noticia.",
          ),
          explain:
            "The building inspector measured the water on Wednesday morning, so the facilities report's 14 inches is the most reliable depth.",
        },
        {
          id: "conflict",
          type: "choose",
          docs: ["report", "ellis", "tasha"],
          prompt: "Mr. Ellis and Tasha describe the flood differently. Which detail is wrong?",
          help: "Lee la profundidad y la lista de salas en el informe de la ciudad. Compara esos datos con lo que dice cada persona.",
          options: [
            {
              id: "a",
              text: "Tasha says the water got four feet deep and ruined the whole building.",
              ok: true,
            },
            {
              id: "b",
              text: "Mr. Ellis says the basement water was about 14 inches deep.",
              why: "Find the depth in the facilities report. Does it match Mr. Ellis?",
            },
            {
              id: "c",
              text: "Mr. Ellis says the heaviest rain came between 9 and 10.",
              why: "Find the tallest bar on the rainfall chart. Which hour is it?",
            },
          ],
          rule: C(
            "Resolve a conflict with measured data: compare each detail to the record and the chart.",
            "Resuelve un conflicto con datos medidos: compara cada detalle con el registro y la gráfica.",
          ),
          explain:
            "The report measured 14 inches, not four feet, and lists the front office, kitchen and art room as not damaged, so the whole building was not ruined.",
        },
        {
          id: "sort",
          type: "sort",
          docs: ["talk", "chart", "report", "ellis", "tasha"],
          prompt: "Sort each statement from the sources. Is it a fact or an opinion?",
          help: "Un hecho se puede comprobar con una medida, un registro o una visita. Una opinión es un juicio o dice lo que alguien piensa que debería pasar.",
          cats: [FACT, OPINION],
          items: [
            {
              id: "i1",
              text: "The basement water was 14 inches deep.",
              cat: "fact",
              clue: C("Was this measured?", "¿Esto se midió?"),
            },
            {
              id: "i2",
              text: "It was the worst night of my job.",
              cat: "opinion",
              clue: C(
                'Is "worst" a measurement or a feeling?',
                '¿"Worst" es una medida o un sentimiento?',
              ),
            },
            {
              id: "i3",
              text: "1.6 inches of rain fell between 9 and 10 p.m.",
              cat: "fact",
              clue: C("Is there a bar for this?", "¿Hay una barra para esto?"),
            },
            {
              id: "i4",
              text: "The city should have fixed those doors years ago.",
              cat: "opinion",
              clue: C(
                'Does "should" state a fact or a judgment?',
                '¿"Should" dice un hecho o un juicio?',
              ),
            },
            {
              id: "i5",
              text: "Tutoring moves to the public library on Thursday.",
              cat: "fact",
              clue: C(
                "Could you go and check on Thursday?",
                "¿Podrías ir a comprobarlo el jueves?",
              ),
            },
            {
              id: "i6",
              text: "The center is the most important building in Eastbrook.",
              cat: "opinion",
              clue: C(
                'Could people disagree about "most important"?',
                '¿La gente podría no estar de acuerdo con "most important"?',
              ),
            },
            {
              id: "i7",
              text: "The kitchen was not damaged.",
              cat: "fact",
              clue: C("Is it in the facilities report?", "¿Está en el informe de la ciudad?"),
            },
          ],
          rule: C(
            "A fact can be checked by measuring, a record, or a visit. An opinion is a feeling, belief or judgment.",
            "Un hecho se puede comprobar midiendo, con un registro o con una visita. Una opinión es un sentimiento, una creencia o un juicio.",
          ),
          explain:
            "Depths, rainfall, dates and damaged rooms can be checked. Worst, should and most important are feelings and judgments, so those statements are opinions.",
        },
        {
          id: "headline",
          type: "write",
          docs: ["talk", "chart", "report"],
          prompt: "Write a headline for the flood story. Use facts only.",
          help: "Escribe 12 palabras o menos. Nombra qué pasó (la tormenta, la inundación) y dónde (el centro comunitario). Puedes agregar un dato medido. Sin palabras de opinión.",
          check: {
            min: 3,
            max: 12,
            ideas: [
              {
                any: ["flood*", "storm*", "rain*", "water"],
                clue: C("Name what happened.", "Nombra qué pasó."),
              },
              {
                any: ["community center", "center", "eastbrook", "gym", "basement"],
                clue: C("Name where it happened.", "Nombra dónde pasó."),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A headline names what happened and where, in a few words, with no opinion.",
            "Un titular nombra qué pasó y dónde, en pocas palabras y sin opinión.",
          ),
          frame: "Storm ___ Eastbrook Community Center ___",
          model: "Storm Floods Eastbrook Community Center Basement With 14 Inches of Water",
          keep: "Headline",
        },
        {
          id: "lead",
          type: "write",
          docs: ["talk", "chart", "report"],
          prompt:
            "Write a two-sentence lead. The first sentence answers who, what, when, where and why. The second tells readers what happens next.",
          help: "Primera oración: ¿qué pasó?, ¿cuándo?, ¿dónde?, ¿por qué? (cuánta lluvia). Segunda oración: ¿qué pasa ahora? (cuánto tiempo estará cerrado, a dónde va la tutoría). Usa la entrevista, la gráfica y el informe.",
          check: {
            min: 22,
            ideas: [
              {
                any: [
                  "community center",
                  "center",
                  "director",
                  "custodian",
                  "city",
                  "families",
                  "students",
                  "eastbrook",
                ],
                clue: C("Say who or what was affected.", "Di a quién o a qué le afectó."),
              },
              {
                any: ["flood*", "water"],
                clue: C("Say what happened.", "Di qué pasó."),
              },
              {
                any: ["tuesday", "night"],
                clue: C("Say when it happened.", "Di cuándo pasó."),
              },
              {
                any: ["basement", "gym"],
                clue: C(
                  "Say where in the building the water went.",
                  "Di a qué parte del edificio llegó el agua.",
                ),
              },
              {
                any: ["rain*", "storm*", "3.5", "inches of rain"],
                clue: C("Say why it flooded.", "Di por qué se inundó."),
              },
              {
                any: ["three weeks", "3 weeks", "closed", "reopen*", "tutoring", "library"],
                clue: C(
                  "In your second sentence, tell what happens next.",
                  "En tu segunda oración, di qué pasa ahora.",
                ),
              },
            ],
            noOpinion: true,
          },
          rule: C(
            "A full lead gives who, what, when, where and why first, then the most useful next fact, with no opinion.",
            "Un comienzo completo da primero quién, qué, cuándo, dónde y por qué, y luego el dato siguiente más útil, sin opinión.",
          ),
          frame:
            "On ___ night, a storm dropped ___ of rain, and water flooded the ___ of the ___. The center will ___, and ___ will move to ___.",
          model:
            "On Tuesday night, a storm dropped 3.5 inches of rain on Eastbrook, and water flooded the basement and gym of the Eastbrook Community Center. The center will be closed for about three weeks, and after-school tutoring will move to the public library.",
          keep: "Lead",
        },
        {
          id: "revise",
          type: "write",
          docs: ["report", "tasha"],
          npc: {
            who: EDITOR,
            art: "char-teacher",
            line: 'Your draft says: "Water four feet deep ruined the whole community center." Families will panic if we print that. What does the official report say?',
          },
          prompt: "Rewrite the sentence so it is accurate. Name the source of your facts.",
          help: "Lee la profundidad y la lista de salas dañadas en el informe de la ciudad. Escribe la oración con la medida correcta y las salas correctas, y nombra la fuente: The facilities report says …",
          check: {
            min: 12,
            ideas: [
              {
                any: ["14", "fourteen"],
                clue: C("Use the measured depth.", "Usa la profundidad medida."),
              },
              {
                any: ["basement", "gym"],
                clue: C(
                  "Name the rooms that were really damaged.",
                  "Nombra las salas que de verdad se dañaron.",
                ),
              },
            ],
            avoid: [
              {
                any: ["four feet", "4 feet", "4 ft", "four foot", "4-foot"],
                clue: C(
                  "That depth came from a secondhand story. Use the inspector's measurement.",
                  "Esa profundidad vino de un relato de segunda mano. Usa la medida del inspector.",
                ),
              },
              {
                any: [
                  "whole building",
                  "whole center",
                  "whole community center",
                  "entire building",
                ],
                clue: C(
                  "The report lists rooms that were not damaged. Name only the damaged ones.",
                  "El informe nombra salas que no se dañaron. Nombra solo las dañadas.",
                ),
              },
            ],
            evidence: true,
          },
          rule: C(
            "Correct a wrong fact with the official measurement, and attribute it.",
            "Corrige un dato equivocado con la medida oficial y di de dónde viene.",
          ),
          frame:
            "The city facilities report says the water was ___ deep and damaged the ___ and the ___.",
          model:
            "The city facilities report says the water was 14 inches deep and damaged only the basement storage room and the gym.",
          keep: "Corrected sentence",
        },
      ],
    },
    TRANSIT_68,
  ],
};
