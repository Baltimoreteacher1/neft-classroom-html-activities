/* Stop 3 content: a short practice session between a parent and a child, in three grade bands. The parent chooses
 * what to say at three moments (a wrong answer, a stuck moment, a frustrated moment). Every option has the child's
 * reply and a plain reason it helps or hurts. kind: "best" | "ok" | "avoid". Advancing needs the "best" option, so the
 * finished conversation is always the model conversation. */
import { p } from "./core.js";

export const bandOf = (grade) => (grade <= 2 ? "a" : grade <= 5 ? "b" : "c");
export const BAND_NAME = {
  a: p("Grades 1–2", "Grados 1–2"),
  b: p("Grades 3–5", "Grados 3–5"),
  c: p("Grades 6–8", "Grados 6–8"),
};

const opt = (kind, say, reply, why) => ({ kind, say, reply, why });

export const SCENES = {
  a: {
    problem: p("8 + 6", "8 + 6"),
    answer: "14",
    model: { name: "tenFrame", props: { initial: { count: 8 }, showMissing: true } },
    steps: [
      {
        child: p("Sam says: “8 + 6 is 13.”", "Sam dice: «8 + 6 es 13»."),
        options: [
          opt(
            "avoid",
            p("No, it is 14.", "No, es 14."),
            p("“Oh. Okay.” Sam looks away.", "«Ah. Bueno». Sam mira hacia otro lado."),
            p(
              "Telling the answer ends the thinking. Sam learns to wait for you instead of checking.",
              "Dar la respuesta detiene el pensamiento. Sam aprende a esperar que ustedes le den la respuesta en lugar de comprobar.",
            ),
          ),
          opt(
            "best",
            p("Tell me how you got 13.", "Cuéntame cómo llegaste a 13."),
            p(
              "“I counted up from 8: 8, 9, 10, 11, 12, 13.”",
              "«Conté desde 8: 8, 9, 10, 11, 12, 13».",
            ),
            p(
              "A real question with no judgment. Sam's own steps show where the slip is: the 8 was counted as one of the six.",
              "Una pregunta sincera, sin juzgar. Los pasos de Sam muestran dónde está el error: el 8 se contó como uno de los seis.",
            ),
          ),
          opt(
            "ok",
            p("Let's use the ten-frame.", "Usemos el marco de diez."),
            p(
              "“Okay…” Sam waits for you to start.",
              "«Bueno…». Sam espera a que ustedes empiecen.",
            ),
            p(
              "A good tool, but ask first. Hearing Sam's thinking tells you what to fix.",
              "Es una buena herramienta, pero pregunten primero. Escuchar a Sam les dice qué corregir.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam: “I counted 8, 9, 10, 11, 12, 13. That is six numbers, right?”",
          "Sam: «Conté 8, 9, 10, 11, 12, 13. Son seis números, ¿no?»",
        ),
        options: [
          opt(
            "ok",
            p("Count again, slowly.", "Cuenta otra vez, despacio."),
            p(
              "“8, 9, 10, 11, 12, 13. I still get 13.”",
              "«8, 9, 10, 11, 12, 13. Me sigue dando 13».",
            ),
            p(
              "Counting the same way tends to repeat the same slip. Change the tool, not the speed.",
              "Contar de la misma manera suele repetir el mismo error. Cambien la herramienta, no la velocidad.",
            ),
          ),
          opt(
            "best",
            p(
              "Put 8 counters on the ten-frame. What do you see?",
              "Pon 8 fichas en el marco de diez. ¿Qué ves?",
            ),
            p(
              "“Two empty boxes. Two more fill it to 10.”",
              "«Dos casillas vacías. Con dos más se llena hasta 10».",
            ),
            p(
              "A picture lets Sam discover the slip. You asked a question and Sam did the thinking.",
              "Un dibujo deja que Sam descubra el error. Ustedes hicieron una pregunta y Sam pensó.",
            ),
          ),
          opt(
            "avoid",
            p("You have to start at 9, not 8.", "Tienes que empezar en 9, no en 8."),
            p("“Why?” Sam shrugs.", "«¿Por qué?». Sam se encoge de hombros."),
            p(
              "That is a rule to follow, not an idea to understand. Next time the rule will be forgotten.",
              "Eso es una regla que seguir, no una idea que entender. La próxima vez se olvidará la regla.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam sighs: “This is too hard. I'm just bad at math.”",
          "Sam suspira: «Esto es muy difícil. No se me dan bien las matemáticas».",
        ),
        options: [
          opt(
            "avoid",
            p("Don't say that. Just try harder.", "No digas eso. Solo esfuérzate más."),
            p("“I am trying.” Sam goes quiet.", "«Sí me estoy esforzando». Sam se queda en silencio."),
            p(
              "Waving a feeling away rarely stops it. Praise a strategy, not just effort.",
              "Ignorar un sentimiento rara vez lo detiene. Elogien una estrategia, no solo el esfuerzo.",
            ),
          ),
          opt(
            "ok",
            p("Let's take a short break and come back.", "Tomemos un descanso corto y volvamos."),
            p("“Okay.” Sam relaxes a little.", "«Bueno». Sam se relaja un poco."),
            p(
              "A break is fine when feelings are big. Promise one small step after, so the bad feeling does not stay.",
              "Un descanso está bien cuando los sentimientos son fuertes. Prometan un paso pequeño después, para que el malestar no se quede.",
            ),
          ),
          opt(
            "best",
            p(
              "That one is tricky, and tricky means your brain is working. Just the first step: how many more make 10 from 8?",
              "Ese es difícil, y difícil significa que tu cerebro está trabajando. Solo el primer paso: ¿cuánto le falta a 8 para llegar a 10?",
            ),
            p(
              "“Two. So 6 is 2 and 4 more… 10 and 4 is 14!”",
              "«Dos. Entonces 6 es 2 y 4 más… ¡10 y 4 es 14!»",
            ),
            p(
              "You named the feeling, made the task smaller, and left the thinking to Sam.",
              "Nombraron el sentimiento, hicieron la tarea más pequeña y dejaron que Sam pensara.",
            ),
          ),
        ],
      },
    ],
    finale: p(
      "Sam: “8 + 2 = 10, then 4 more is 14. I counted one number too few before.”",
      "Sam: «8 + 2 = 10, y 4 más es 14. Antes conté un número de menos».",
    ),
    afterQ: p(
      "What helped you finish?",
      "¿Qué te ayudó a terminar?",
    ),
    questions: [
      p("How did you get that?", "¿Cómo lo hiciste?"),
      p("What does the picture show?", "¿Qué muestra el dibujo?"),
      p("How many more to make 10?", "¿Cuántos más se necesitan para llegar a 10?"),
      p("Can you show me with counters?", "¿Puedes mostrármelo con fichas?"),
      p("How could you check it?", "¿Cómo podrías comprobarlo?"),
      p("What is one part you are sure about?", "¿Qué parte sabes con seguridad?"),
    ],
  },
  b: {
    problem: p("6 × 7", "6 × 7"),
    answer: "42",
    model: { name: "arrayModel", props: { initial: { rows: 6, cols: 8 } } },
    steps: [
      {
        child: p("Sam says: “6 × 7 is 48.”", "Sam dice: «6 × 7 es 48»."),
        options: [
          opt(
            "avoid",
            p("Wrong. It is 42.", "Mal. Es 42."),
            p("“Oh.” Sam copies 42 without a word.", "«Ah». Sam copia 42 sin decir nada."),
            p(
              "Sam gets the answer but not the idea, and will mix up the sevens again.",
              "Sam obtiene la respuesta pero no la idea, y volverá a confundir los sietes.",
            ),
          ),
          opt(
            "best",
            p("What did you think about to get 48?", "¿En qué pensaste para llegar a 48?"),
            p(
              "“I know 6 × 8 is 48, and 7 is next to 8.”",
              "«Sé que 6 × 8 es 48, y el 7 está junto al 8».",
            ),
            p(
              "Sam used a real fact. The slip is small and fixable, and now you can see it.",
              "Sam usó un dato real. El error es pequeño y se puede corregir, y ahora lo ven.",
            ),
          ),
          opt(
            "ok",
            p("Draw an array and count it.", "Dibuja un arreglo y cuéntala."),
            p("“That will take forever…”", "«Eso va a tardar una eternidad…»"),
            p(
              "Arrays are great, but ask first. This slip needs a thinking fix, not a long count.",
              "Las matrices son excelentes, pero pregunten primero. Este error necesita una corrección de razonamiento, no un conteo largo.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam: “So 48… and 6 × 7 is just one less?”",
          "Sam: «Entonces 48… ¿y 6 × 7 es solo uno menos?»",
        ),
        options: [
          opt(
            "avoid",
            p("Just memorize your sevens tonight.", "Solo memoriza los sietes esta noche."),
            p("“Ugh.” Sam groans.", "«Uf». Sam se queja."),
            p(
              "Memorizing under pressure builds dread. Facts stick when they connect to facts you know.",
              "Memorizar bajo presión crea ansiedad. Los datos se quedan cuando se conectan con datos que ya conoces.",
            ),
          ),
          opt(
            "best",
            p(
              "One less of what? Look at the array: 6 rows of 8 and 6 rows of 7.",
              "¿Uno menos de qué? Mira el arreglo: 6 filas de 8 y 6 filas de 7.",
            ),
            p(
              "“One less in every row. That is 6 fewer. 48 − 6 = 42!”",
              "«Uno menos en cada fila. Son 6 menos. ¡48 − 6 = 42!»",
            ),
            p(
              "Sam noticed how the near fact changes. That reasoning works on every fact, not just this one.",
              "Sam notó cómo cambia el dato cercano. Ese razonamiento sirve para todos los datos, no solo este.",
            ),
          ),
          opt(
            "ok",
            p("Close. Think about it again.", "Casi. Piénsalo otra vez."),
            p(
              "“One less… one less what?” Sam is unsure.",
              "«Uno menos… ¿uno menos de qué?» Sam duda.",
            ),
            p(
              "Encouraging, but vague. A specific question gives Sam something to hold onto.",
              "Alentador, pero vago. Una pregunta concreta le da a Sam algo a lo que aferrarse.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam: “I always mess up the sevens. I'm bad at this.”",
          "Sam: «Siempre me equivoco con los sietes. No se me da bien esto».",
        ),
        options: [
          opt(
            "avoid",
            p("You're good at math. Don't be silly.", "Eres bueno en matemáticas. No digas tonterías."),
            p("“No I'm not.” Sam crosses their arms.", "«No lo soy». Sam se cruza de brazos."),
            p(
              "Disagreeing with a feeling starts an argument. Show a small success instead.",
              "Contradecir un sentimiento empieza una discusión. Mejor muestren un pequeño éxito.",
            ),
          ),
          opt(
            "best",
            p(
              "You just used 6 × 8 to build 6 × 7. That's a strategy. Want to try 6 × 6 the same way?",
              "Acabas de usar 6 × 8 para armar 6 × 7. Eso es una estrategia. ¿Quieres probar 6 × 6 de la misma manera?",
            ),
            p(
              "“6 × 6 is one less 6 than 6 × 7, so 42 − 6 = 36.”",
              "«6 × 6 es un 6 menos que 6 × 7, así que 42 − 6 = 36».",
            ),
            p(
              "You pointed to real evidence of skill and gave Sam a fresh win right away.",
              "Señalaron evidencia real de habilidad y le dieron a Sam un nuevo logro enseguida.",
            ),
          ),
          opt(
            "ok",
            p("Let's stop for tonight.", "Paremos por esta noche."),
            p("“Okay.” Sam still feels bad.", "«Bueno». Sam todavía se siente mal."),
            p(
              "Stopping can help, but ending on a mistake leaves it as the memory. End on a win when you can.",
              "Parar puede ayudar, pero terminar con un error deja ese recuerdo. Terminen con un logro cuando puedan.",
            ),
          ),
        ],
      },
    ],
    finale: p(
      "Sam: “6 × 8 is 48. Take away one 6 and I get 42.”",
      "Sam: «6 × 8 es 48. Si quito un 6, me da 42».",
    ),
    afterQ: p(
      "Which fact will you build from next time?",
      "¿Desde qué dato vas a construir la próxima vez?",
    ),
    questions: [
      p("How did you get that?", "¿Cómo lo hiciste?"),
      p(
        "Is there a fact you already know that could help?",
        "¿Hay un dato que ya sepas que pueda ayudar?",
      ),
      p("What does the array show?", "¿Qué muestra el arreglo?"),
      p("Can you break it into two easier pieces?", "¿Puedes descomponerlo en dos partes más fáciles?"),
      p("How could you check it another way?", "¿Cómo podrías comprobarlo de otra manera?"),
      p("What would 6 × 6 be?", "¿Cuánto sería 6 × 6?"),
    ],
  },
  c: {
    problem: p("12 ÷ ¾", "12 ÷ ¾"),
    answer: "16",
    model: { name: "arrayModel", props: { initial: { rows: 16, cols: 3 }, maxR: 16, maxC: 4 } },
    steps: [
      {
        child: p("Sam says: “12 ÷ ¾ is 9.”", "Sam dice: «12 ÷ ¾ es 9»."),
        options: [
          opt(
            "avoid",
            p(
              "No. You flip the second fraction and multiply.",
              "No. Se invierte la segunda fracción y se multiplica.",
            ),
            p("“Flip… which one?” Sam looks lost.", "«Invertir… ¿cuál?» Sam no sabe por dónde empezar."),
            p(
              "A trick without a reason is easy to mix up. Sam needs to see why dividing makes the answer bigger.",
              "Un truco sin razón se confunde fácil. Sam necesita ver por qué dividir hace la respuesta más grande.",
            ),
          ),
          opt(
            "best",
            p("Walk me through your steps.", "Explícame tus pasos."),
            p(
              "“I did 12 × ¾ because dividing by a fraction is the same as multiplying.”",
              "«Hice 12 × ¾ porque dividir entre una fracción es lo mismo que multiplicar».",
            ),
            p(
              "Sam half-remembers a rule. Now you know exactly what to untangle.",
              "Sam recuerda la regla a medias. Ahora saben exactamente qué desenredar.",
            ),
          ),
          opt(
            "ok",
            p("Check it with a calculator.", "Compruébalo con una calculadora."),
            p("“It says 16. Why?” Sam frowns.", "«Dice 16. ¿Por qué?» Sam frunce el ceño."),
            p(
              "The number is right but the idea is missing. Understanding the 'why' is the goal.",
              "El número es correcto, pero falta la idea. Entender el «porqué» es la meta.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam: “But I thought dividing makes things smaller?”",
          "Sam: «Pero ¿no se supone que dividir hace las cosas más pequeñas?»",
        ),
        options: [
          opt(
            "ok",
            p("Not always. Think more about it.", "No siempre. Piensa más."),
            p("“…I don't know how to think harder.”", "«…No sé cómo pensar más»."),
            p(
              "True, but “think more” gives no handle. Offer a way in, like a question or a picture.",
              "Es cierto, pero «piensa más» no da por dónde empezar. Ofrezcan una entrada, como una pregunta o un dibujo.",
            ),
          ),
          opt(
            "best",
            p(
              "Let's ask a different way: how many groups of ¾ fit in 12?",
              "Preguntémoslo de otra manera: ¿cuántos grupos de ¾ caben en 12?",
            ),
            p(
              "“Twelve wholes is 48 fourths. Groups of 3 fourths… 16 groups!”",
              "«Doce enteros son 48 cuartos. Grupos de 3 cuartos… ¡16 grupos!»",
            ),
            p(
              "Re-asking the question as “how many fit?” makes dividing meaningful, and Sam finds that the answer gets bigger.",
              "Volver a preguntar «¿cuántos caben?» da sentido a la división, y Sam descubre que la respuesta crece.",
            ),
          ),
          opt(
            "avoid",
            p(
              "Dividing by a number less than 1 gives a bigger answer.",
              "Dividir entre un número menor que 1 da una respuesta más grande.",
            ),
            p("“Okay…” Sam nods without understanding.", "«Bueno…» Sam asiente sin entender."),
            p(
              "A correct statement said as a fact is easy to nod along to. Let Sam discover it instead.",
              "Una afirmación correcta dicha como dato es fácil de aceptar sin entender. Dejen que Sam lo descubra.",
            ),
          ),
        ],
      },
      {
        child: p(
          "Sam: “Fractions never make sense. I give up.”",
          "Sam: «Las fracciones nunca tienen sentido. Me rindo».",
        ),
        options: [
          opt(
            "ok",
            p(
              "Let's do it tomorrow when you're calm.",
              "Lo hacemos mañana cuando te sientas con calma.",
            ),
            p("“Fine.”", "«Está bien»."),
            p(
              "A pause can help. Name one thing that went well so tomorrow starts with a win.",
              "Una pausa puede ayudar. Mencionen algo que salió bien para que mañana empiece con un logro.",
            ),
          ),
          opt(
            "avoid",
            p(
              "Everyone has trouble with fractions. Just push through.",
              "A todos les cuestan las fracciones. Sigue adelante.",
            ),
            p("“That doesn't help.” Sam sighs.", "«Eso no ayuda». Sam suspira."),
            p(
              "Comparing to “everyone” does not help Sam take the next step.",
              "Compararlo con «todos» no ayuda a Sam a dar el siguiente paso.",
            ),
          ),
          opt(
            "best",
            p(
              "You just found 48 fourths on your own. That's real fraction thinking. What was the first thing that worked?",
              "Acabas de encontrar 48 cuartos por tu cuenta. Eso es pensar de verdad con fracciones. ¿Qué fue lo primero que funcionó?",
            ),
            p(
              "“Changing 12 into fourths. Then it was just 48 ÷ 3.”",
              "«Convertir 12 en cuartos. Después solo era 48 ÷ 3».",
            ),
            p(
              "You pointed to evidence of success and asked Sam to name the strategy, so Sam owns it.",
              "Señalaron evidencia de éxito y pidieron a Sam que nombrara la estrategia, y así Sam se la apropia.",
            ),
          ),
        ],
      },
    ],
    finale: p(
      "Sam: “12 is 48 fourths, and 48 ÷ 3 = 16. So 12 ÷ ¾ = 16.”",
      "Sam: «12 son 48 cuartos, y 48 ÷ 3 = 16. Entonces 12 ÷ ¾ = 16».",
    ),
    afterQ: p(
      "How can you tell, before you calculate, whether the answer will be bigger or smaller?",
      "¿Cómo puedes saber, antes de calcular, si la respuesta será más grande o más pequeña?",
    ),
    questions: [
      p("Walk me through your steps.", "Explícame tus pasos."),
      p("What does this number mean in the problem?", "¿Qué significa este número en el problema?"),
      p(
        "Should the answer be bigger or smaller? Why?",
        "¿La respuesta debe ser más grande o más pequeña? ¿Por qué?",
      ),
      p("Can you draw it or use a model?", "¿Puedes dibujarlo o usar un modelo?"),
      p("How could you check it?", "¿Cómo podrías comprobarlo?"),
      p(
        "What is a simpler problem that works the same way?",
        "¿Cuál es un problema más sencillo que funcione igual?",
      ),
    ],
  },
};

/** When a child is stuck or frustrated: five moves, in order. */
export const STUCK = [
  [
    p("Pause", "Hagan una pausa"),
    p(
      "Take one slow breath together. A calm start beats a fast one.",
      "Respiren hondo juntos una vez. Un comienzo tranquilo vale más que uno rápido.",
    ),
  ],
  [
    p("Name the feeling", "Pongan nombre al sentimiento"),
    p(
      "“This is frustrating.” Naming it helps it get smaller.",
      "«Esto da frustración». Ponerle nombre ayuda a que se haga más pequeño.",
    ),
  ],
  [
    p("Make it smaller", "Háganlo más pequeño"),
    p(
      "Ask for just the first step, or try an easier number first.",
      "Pidan solo el primer paso, o prueben primero con un número más fácil.",
    ),
  ],
  [
    p("Switch to a picture", "Cambien a un dibujo"),
    p(
      "Use counters, a ten-frame, a sketch or the Lab's visual lesson.",
      "Usen fichas, un marco de diez, un dibujo o la lección visual del Laboratorio.",
    ),
  ],
  [
    p("End on a win", "Terminen con un logro"),
    p(
      "Finish with one problem your child can do, then stop. Come back tomorrow.",
      "Terminen con un problema que su hijo o hija sepa hacer, y paren. Vuelvan mañana.",
    ),
  ],
];
