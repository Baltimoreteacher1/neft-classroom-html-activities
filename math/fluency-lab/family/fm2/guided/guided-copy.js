// Every word the guided session adds, written as EN/ES pairs. The child is addressed as tu, adults as ustedes.
// Parent lines never contain a digit and never state or hint at an answer (the test sweeps them).
const c = (en, es) => ({ en, es });

export const STEP_IDS = ["choose", "learn", "try", "play", "explain", "celebrate", "continue"];

export const G = {
  pageTitle: c(
    "Tonight's math · Family Math · EduWonderLab",
    "Matemáticas de hoy · Matemáticas en familia · EduWonderLab",
  ),
  skip: c("Skip to tonight's session", "Saltar a la sesión de hoy"),
  brand: c("Family Math", "Matemáticas en familia"),
  brandAria: c("Family Math home", "Inicio de Matemáticas en familia"),
  langLabel: c("Language", "Idioma"),
  stepsLabel: c("Tonight's steps", "Pasos de hoy"),
  stepOf: c("Step {n} of {total}: {name}", "Paso {n} de {total}: {name}"),
  done: c("done", "hecho"),
  steps: {
    choose: c("Choose", "Elegir"),
    learn: c("Learn", "Aprender"),
    try: c("Try", "Probar"),
    play: c("Play", "Jugar"),
    explain: c("Explain", "Explicar"),
    celebrate: c("Celebrate", "Celebrar"),
    continue: c("Continue", "Seguir"),
  },
  saved: c(
    "Your place is saved on this device. No account, nothing is sent anywhere.",
    "Su avance se guarda en este dispositivo. Sin cuenta y sin enviar nada a ningún lado.",
  ),
  noStorage: c(
    "This browser cannot save progress. You can keep going, but it will not be remembered.",
    "Este navegador no puede guardar el avance. Pueden seguir, pero no se recordará.",
  ),
  loading: c("Getting tonight's math ready…", "Preparando las matemáticas de hoy…"),
  errorTitle: c("We could not start tonight's session", "No pudimos empezar la sesión de hoy"),
  errorText: c(
    "Go back to family math and try again.",
    "Vuelvan a matemáticas en familia e inténtenlo otra vez.",
  ),
  home: c("Back to family math", "Volver a matemáticas en familia"),
  stop: c("Stop for now", "Parar por ahora"),
  stopNote: c(
    "Your place stays saved. Come back any time.",
    "Su lugar queda guardado. Vuelvan cuando quieran.",
  ),
  readAloud: c("Read aloud", "Leer en voz alta"),

  chooseTitle: c("What grade is your child in?", "¿En qué grado está su hijo o hija?"),
  chooseLead: c(
    "Tap a grade. We pick a good skill for tonight. You can change it.",
    "Toquen un grado. Nosotros elegimos una buena destreza para hoy. Pueden cambiarla.",
  ),
  grade: c("Grade {g}", "Grado {g}"),
  gradeK: c("Kindergarten", "Kínder"),
  pickSkill: c("Or pick a different skill", "O elijan otra destreza"),
  recommended: c("Recommended for tonight", "Recomendada para hoy"),
  changeSkill: c("Change skill", "Cambiar destreza"),
  useSkill: c("Use this skill", "Usar esta destreza"),
  tonightWord: c("Tonight", "Hoy"),
  fiveMin: c("About 5 minutes", "Unos 5 minutos"),
  tenMin: c("About 10 minutes", "Unos 10 minutos"),
  length: c("How much time do you have?", "¿Cuánto tiempo tienen?"),

  learnTitle: c("Tonight's idea", "La idea de hoy"),
  learnLead: c(
    "Read this together. One idea, one example.",
    "Léanlo juntos. Una idea y un ejemplo.",
  ),
  ideaLabel: c("The idea", "La idea"),
  exampleLabel: c("A worked example", "Un ejemplo resuelto"),
  parentLabel: c("For the grown-up", "Para el adulto"),
  parentNoMath: c(
    "You do not need to know the math. Ask, listen and wait.",
    "No necesitan saber la matemática. Pregunten, escuchen y esperen.",
  ),
  sayLabel: c("You can say", "Pueden decir"),
  avoidLabel: c("Try not to say", "Eviten decir"),
  askLabel: c("Ask", "Pregunten"),
  startTry: c("Let's try it", "Vamos a probar"),
  tryLead: c(
    "Three short rounds. Hints are always free.",
    "Unas rondas cortas. Las pistas siempre son gratis.",
  ),

  playTitle: c("Now play!", "¡Ahora a jugar!"),
  playLead: c("A different game, the same idea.", "Un juego distinto, la misma idea."),
  playGo: c("Start the game", "Empezar el juego"),
  playTogether: c("Play together", "Jugar juntos"),

  explainTitle: c("Tell us how you thought", "Cuéntanos cómo pensaste"),
  explainLead: c(
    "Say it out loud to your grown-up. Then tap what helped. There is no wrong answer, and nothing is recorded.",
    "Dilo en voz alta a tu adulto. Luego toca lo que te ayudó. No hay respuesta incorrecta y no se graba nada.",
  ),
  helpedLabel: c("What helped you most?", "¿Qué te ayudó más?"),
  helped: {
    idea: c("I used tonight's idea.", "Usé la idea de hoy."),
    model: c(
      "I used a picture, objects or the game's tools.",
      "Usé un dibujo, objetos o las herramientas del juego.",
    ),
    known: c("I used a fact I already know.", "Usé algo que ya sé."),
    check: c("I checked my answer a second way.", "Revisé mi respuesta de otra manera."),
    unsure: c(
      "I am still not sure. Show me this again.",
      "Todavía no estoy seguro o segura. Muéstrame esto otra vez.",
    ),
  },
  explainDone: c("Thank you for explaining.", "Gracias por explicar."),
  explainNext: c("Finish", "Terminar"),
  pickOne: c("Tap one to go on.", "Toca una para seguir."),

  celebrateTitle: c("You finished tonight's math!", "¡Terminaste las matemáticas de hoy!"),
  celebrateLead: c("Here is what you did together.", "Esto es lo que hicieron juntos."),
  didLearn: c("You learned one idea: {skill}.", "Aprendiste una idea: {skill}."),
  didTry: c("You tried {correct} of {total} rounds.", "Probaste {correct} de {total} rondas."),
  didPlay: c("You played {game}.", "Jugaste {game}."),
  didExplain: c("You explained your thinking.", "Explicaste tu manera de pensar."),
  calmNote: c(
    "Every try helps your brain grow. There are no grades here.",
    "Cada intento ayuda a que tu cerebro crezca. Aquí no hay calificaciones.",
  ),
  toContinue: c("What next?", "¿Y ahora qué?"),

  continueTitle: c("Next time", "La próxima vez"),
  continueAgain: c(
    "Come back to this idea soon, with a little more help.",
    "Vuelvan pronto a esta idea, con un poco más de ayuda.",
  ),
  continueKeep: c(
    "Keep practicing this skill. You are close.",
    "Sigan practicando esta destreza. Ya casi.",
  ),
  continueNext: c("You are ready for a new skill.", "Están listos para una destreza nueva."),
  continueGo: c("Start the next session", "Empezar la siguiente sesión"),
  continueLater: c("Not tonight. Save it for next time.", "Hoy no. Guárdenla para la próxima."),
  seeProgress: c("See my progress", "Ver mi progreso"),
  savedNext: c("We saved this plan on this device.", "Guardamos este plan en este dispositivo."),

  resumeTitle: c(
    "Welcome back. Your session is saved.",
    "Bienvenidos de nuevo. Su sesión está guardada.",
  ),
  resumeGo: c("Continue where you left off", "Seguir donde quedaron"),
  startOver: c("Start a new session", "Empezar una sesión nueva"),
};

// One say / avoid pair per strand. The strand keys come from coach.js so the two stay in step.
export const PARENT = {
  "counting-place-value": {
    say: c("“Show me how you counted.”", "«Muéstrame cómo contaste.»"),
    avoid: c("“It is easy, just count.”", "«Es fácil, solo cuenta.»"),
  },
  "addition-subtraction": {
    say: c("“How did you put them together?”", "«¿Cómo los juntaste?»"),
    avoid: c("“No, that is wrong, do it again.”", "«No, está mal, hazlo otra vez.»"),
  },
  "multiplication-division": {
    say: c("“How many groups do you see?”", "«¿Cuántos grupos ves?»"),
    avoid: c("“Just memorize your facts.”", "«Solo memoriza las tablas.»"),
  },
  fractions: {
    say: c("“Are the pieces the same size?”", "«¿Las partes son del mismo tamaño?»"),
    avoid: c("“Just flip it and multiply.”", "«Solo voltea y multiplica.»"),
  },
  decimals: {
    say: c(
      "“Where would this land on a number line?”",
      "«¿Dónde caería esto en una recta numérica?»",
    ),
    avoid: c("“Just move the dot.”", "«Solo mueve el punto.»"),
  },
  "ratios-percents": {
    say: c("“What stays the same each time?”", "«¿Qué se mantiene igual cada vez?»"),
    avoid: c("“Cross multiply, that is the trick.”", "«Multiplica en cruz, ese es el truco.»"),
  },
  "patterns-algebra": {
    say: c("“What do you notice changing?”", "«¿Qué notas que cambia?»"),
    avoid: c("“The rule is obvious.”", "«La regla es obvia.»"),
  },
  "geometry-measure": {
    say: c("“Can you draw it or build it?”", "«¿Puedes dibujarlo o armarlo?»"),
    avoid: c("“Use the formula.”", "«Usa la fórmula.»"),
  },
  money: {
    say: c("“What would you pay with?”", "«¿Con qué pagarías?»"),
    avoid: c("“Just do the sum in your head, quick.”", "«Haz la suma de cabeza, rápido.»"),
  },
  "number-line": {
    say: c("“Which way do you move, and why?”", "«¿Hacia dónde te mueves y por qué?»"),
    avoid: c("“Everybody knows that one.”", "«Eso lo sabe todo el mundo.»"),
  },
  equations: {
    say: c(
      "“What would keep both sides balanced?”",
      "«¿Qué mantendría los dos lados en equilibrio?»",
    ),
    avoid: c("“Move it over and change the sign.”", "«Pásalo al otro lado y cambia el signo.»"),
  },
  data: {
    say: c("“What does the picture tell us?”", "«¿Qué nos dice el dibujo?»"),
    avoid: c("“Just read off the number.”", "«Solo lee el número.»"),
  },
};

export const FALLBACK_PARENT = {
  say: c("“Show me how you started.”", "«Muéstrame cómo empezaste.»"),
  avoid: c("“That is easy.”", "«Eso es fácil.»"),
};
