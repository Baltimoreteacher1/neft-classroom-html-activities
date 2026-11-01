// Spanish strings for the Moby per-fact model and daily fact sessions. English text is the key. Student lines use
// tú; adult lines (teachers, families) use ustedes. Placeholders such as {n} are kept exactly.
export const ES_MOBY_FACTS = {
  // Statuses, speed readings and session phases
  "Not yet": "Todavía no",
  Developing: "En desarrollo",
  Secure: "Seguro",
  Retained: "Recordado",
  Quick: "Rápido",
  Steady: "Constante",
  Building: "Construyendo",
  "Warm-up": "Calentamiento",
  Review: "Repaso",
  "Learn it": "Aprende la idea",
  Stretch: "Reto",

  // What each status means (always filled from the real thresholds)
  "No answers yet.": "Todavía no hay respuestas.",
  "Some answers so far, but not enough to call it secure.":
    "Hay algunas respuestas, pero no bastan para decir que está seguro.",
  "Right on the first try, on your own, at least {n} times in your last {window} tries (at least {pct}% right), on at least {days} different days.":
    "Correcto al primer intento, por tu cuenta, al menos {n} veces en tus últimos {window} intentos (al menos {pct}% correcto), en al menos {days} días distintos.",
  "Secure, then right on the first try after {gap} or more days away.":
    "Seguro y luego correcto al primer intento después de {gap} días o más sin verlo.",
  "Tricky: {misses} or more misses in the last {window} tries, or a miss after the fact was secure.":
    "Difícil: {misses} o más errores en los últimos {window} intentos, o un error cuando la operación ya estaba segura.",
  "Speed is only noted for facts you chose to practice timed, and it is never needed for any status.":
    "La rapidez solo se anota en las operaciones que elegiste practicar con tiempo, y nunca hace falta para ningún estado.",

  // Strategy names (the fixed vocabulary)
  "Count on": "Cuenta hacia adelante",
  Doubles: "Dobles",
  "Near doubles": "Casi dobles",
  "Make a ten": "Haz una decena",
  "Break apart": "Descomponer",
  "Skip-count": "Conteo salteado",
  "Array model": "Modelo de arreglo",
  "Ones and zeros": "Unos y ceros",
  "Fives and tens": "Cincos y dieces",
  "Nines pattern": "Patrón de los nueves",
  "Square facts": "Operaciones cuadradas",
  "Fact family": "Familia de operaciones",
  "Half and double": "Mitad y doble",
  "Distributive property": "Propiedad distributiva",

  // Grade bands in the progress map
  "Add within 5": "Suma hasta 5",
  "Subtract within 5": "Resta hasta 5",
  "Add within 10": "Suma hasta 10",
  "Subtract within 10": "Resta hasta 10",
  "Add within 20": "Suma hasta 20",
  "Subtract within 20": "Resta hasta 20",
  "Add tens within 100": "Suma decenas hasta 100",
  "Subtract tens within 100": "Resta decenas hasta 100",
  "Multiply to 10 × 10": "Multiplica hasta 10 × 10",
  "Divide within 100": "Divide dentro de 100",
  "Multiply to 12 × 12": "Multiplica hasta 12 × 12",
  "Divide within 144": "Divide dentro de 144",

  // Strategy hints (they never give the answer)
  "Adding 0 changes nothing.": "Sumar 0 no cambia nada.",
  "Ten and {small} more. Say ten, then the ones.":
    "Diez y {small} más. Di diez y luego las unidades.",
  "This is a double: {a} and {a}. Say the double you know.":
    "Es un doble: {a} y {a}. Di el doble que conoces.",
  "Start at {big}. Count on {small}.": "Empieza en {big}. Cuenta {small} hacia adelante.",
  "Use the double {small} + {small}. Then add 1 more.":
    "Usa el doble {small} + {small}. Luego suma 1 más.",
  "Make a ten first. {big} needs {need} more to make 10. Take {need} from {small}.":
    "Primero forma una decena. A {big} le faltan {need} para llegar a 10. Toma {need} de {small}.",
  "Break a number into parts that are easy to add, like tens and ones.":
    "Descompón un número en partes fáciles de sumar, como decenas y unidades.",
  "Taking away 0, or taking away everything, is quick. Think about what is left.":
    "Quitar 0, o quitarlo todo, es rápido. Piensa en lo que queda.",
  "Take away one ten. Think in tens and ones.": "Quita una decena. Piensa en decenas y unidades.",
  "Think in tens: {sTens} tens take away {bTens} tens.":
    "Piensa en decenas: {sTens} decenas menos {bTens} decenas.",
  "Think of a double: what number plus itself makes {s}?":
    "Piensa en un doble: ¿qué número más él mismo da {s}?",
  "Start at {b}. Count up to {s}. How many counts did you make?":
    "Empieza en {b}. Cuenta hacia arriba hasta {s}. ¿Cuántos conteos hiciste?",
  "Go back to 10 first. Take away {down}. Then take away {rest} more.":
    "Primero regresa a 10. Quita {down}. Luego quita {rest} más.",
  "Think addition: {b} + ? = {s}.": "Piensa en la suma: {b} + ? = {s}.",
  "Zero groups, or zero in each group, makes 0.": "Cero grupos, o cero en cada grupo, da 0.",
  "One group of a number is that number.": "Un grupo de un número es ese número.",
  "Double {big}. Think {big} + {big}.": "Duplica {big}. Piensa {big} + {big}.",
  "This is a square fact: {a} rows of {a}. Picture a {a} by {a} array.":
    "Es una operación cuadrada: {a} filas de {a}. Imagina una matriz de {a} por {a}.",
  "Count by 5s, {other} times, or use half of a ten fact.":
    "Cuenta de 5 en 5, {other} veces, o usa la mitad de una operación del diez.",
  "Each group is ten. Say how many tens, then add a zero.":
    "Cada grupo es diez. Di cuántas decenas y luego agrega un cero.",
  "Start with 10 × {other} = {ten}. Then take away one group of {other}.":
    "Empieza con 10 × {other} = {ten}. Luego quita un grupo de {other}.",
  "Break {big} into 10 + {rest}. Multiply {small} by each part, then add.":
    "Descompón {big} en 10 + {rest}. Multiplica {small} por cada parte y luego suma.",
  "Draw {a} rows of {b}. Count all the dots.": "Dibuja {a} filas de {b}. Cuenta todos los puntos.",
  "Times 4 is double, then double again. Start with {other}.":
    "Por 4 es duplicar y volver a duplicar. Empieza con {other}.",
  "Times 8 is double three times. Start with {other}.":
    "Por 8 es duplicar tres veces. Empieza con {other}.",
  "Skip-count by {big}, {small} times.": "Cuenta saltando de {big}, {small} veces.",
  "Use 5 × {other} first. Then add 1 more group of {other}.":
    "Usa primero 5 × {other}. Luego suma 1 grupo más de {other}.",
  "Dividing by 1 keeps the number. A number divided by itself is 1. 0 divided by a number is 0.":
    "Dividir entre 1 deja el número igual. Un número dividido entre sí mismo es 1. 0 dividido entre un número es 0.",
  "Think halves: what number plus itself makes {p}?":
    "Piensa en mitades: ¿qué número más él mismo da {p}?",
  "Think multiplication: what number times itself makes {p}?":
    "Piensa en la multiplicación: ¿qué número por sí mismo da {p}?",
  "Count by 5s until you reach {p}. How many counts?":
    "Cuenta de 5 en 5 hasta llegar a {p}. ¿Cuántos conteos hiciste?",
  "Think in tens: how many tens make {p}?": "Piensa en decenas: ¿cuántas decenas forman {p}?",
  "Think multiplication: {d} × ? = {p}.": "Piensa en la multiplicación: {d} × ? = {p}.",

  // Why each fact is in today's session
  "You have answered this right on your own {right} times. A good way to warm up.":
    "Has respondido esta bien por tu cuenta {right} veces. Una buena forma de calentar.",
  "An easy starter from your grade's facts. You have not practiced it here yet.":
    "Una operación fácil para empezar, de las de tu grado. Todavía no la has practicado aquí.",
  "You answered this right before, and it has been {days} days. Time to check it still sticks.":
    "Antes la respondiste bien y han pasado {days} días. Es hora de ver si todavía la recuerdas.",
  "Still developing, and it has been {days} days since you saw it. Another look helps.":
    "Sigue en desarrollo y han pasado {days} días desde que la viste. Otro vistazo ayuda.",
  "Still developing: {right} right on your own out of {n} first tries so far.":
    "Sigue en desarrollo: {right} correctas por tu cuenta de {n} primeros intentos hasta ahora.",
  "A fact you know, mixed in to keep it fresh.":
    "Una operación que ya sabes, mezclada para mantenerla fresca.",
  "A second look later in this session, to help it stick.":
    "Un segundo vistazo más adelante en esta sesión, para que se te quede.",
  "This one has been tricky: {misses} misses in your last {n} tries. Look at the strategy first.":
    "Esta ha sido difícil: {misses} errores en tus últimos {n} intentos. Mira primero la estrategia.",
  "A new fact in your grade's set. Look at the strategy first.":
    "Una operación nueva de las de tu grado. Mira primero la estrategia.",
  "A partner fact: it uses the same numbers as the one before. Look at the strategy first.":
    "Una operación compañera: usa los mismos números que la anterior. Mira primero la estrategia.",
  "A small stretch from the next set of facts. Try the strategy.":
    "Un pequeño reto del siguiente grupo de operaciones. Prueba la estrategia.",
  "Still developing: one more look, with the strategy in mind.":
    "Sigue en desarrollo: una mirada más, con la estrategia en mente.",

  // Session summary (counted numbers only)
  "Facts today: {n}, about {minutes} minutes. That is an estimate of {seconds} seconds a fact, not a measure of you.":
    "Operaciones de hoy: {n}, unos {minutes} minutos. Es un cálculo de {seconds} segundos por operación, no una medida de ti.",
  "Warm-up facts you already answered right on your own: {n}":
    "Operaciones de calentamiento que ya respondiste bien por tu cuenta: {n}",
  "Easy starter facts you have not practiced here yet: {n}":
    "Operaciones fáciles para empezar que todavía no has practicado aquí: {n}",
  "Facts due for a check because it has been a while: {n}":
    "Operaciones que toca revisar porque ha pasado un tiempo: {n}",
  "Facts still developing, for another look: {n}":
    "Operaciones que siguen en desarrollo, para volver a mirar: {n}",
  "Tricky facts (2 or more misses in your last 5 tries), each with a strategy shown first: {n}":
    "Operaciones difíciles (2 o más errores en tus últimos 5 intentos), cada una con una estrategia al principio: {n}",
  "New facts, with partners from the same fact family: {n}":
    "Operaciones nuevas, con compañeras de la misma familia: {n}",
  "Stretch facts from the next set: {n}": "Operaciones de reto del siguiente grupo: {n}",
  "Second looks later in the session, to help facts stick: {n}":
    "Segundos vistazos más adelante en la sesión, para que se queden: {n}",
  "New facts are limited to {n} because {m} facts are still developing.":
    "Las operaciones nuevas se limitan a {n} porque {m} operaciones siguen en desarrollo.",
  "Timed practice is on. Your time is kept as a separate note and is never needed to master a fact.":
    "La práctica con tiempo está activada. Tu tiempo se guarda como una nota aparte y nunca hace falta para dominar una operación.",

  // Receipt after a session
  "Facts you practiced: {n}": "Operaciones que practicaste: {n}",
  "Answered right on the first try: {n} of {total}":
    "Respondidas bien al primer intento: {n} de {total}",
  "Facts that became secure: {n}": "Operaciones que quedaron seguras: {n}",
  "Facts you kept after time away: {n}": "Operaciones que recordaste después de un tiempo: {n}",
  "Facts worth another look: {n}": "Operaciones que vale la pena volver a mirar: {n}",
  "Answers where you used a strategy: {n}": "Respuestas en las que usaste una estrategia: {n}",
};
