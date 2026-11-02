// Spanish for the Moby error-diagnosis and intervention engine. English text is the key (see i18n.js).
// Learner lines use tú; teacher and family lines use ustedes/usted. Placeholders such as {skill} are kept as written.
export const ES_MOBY_INTERVENTION = {
  // Stages, modes, representations, supports
  "Mission ready": "Misión lista",
  "Mini-lesson": "Minilección",
  "Practice with help": "Practica con ayuda",
  "Practice on your own": "Practica por tu cuenta",
  "Show what you know": "Muestra lo que sabes",
  Mastered: "Dominado",
  "Your teacher will help": "Tu docente te ayudará",
  Paused: "En pausa",
  "Start with a picture or model": "Empieza con un dibujo o un modelo",
  "Study a worked example, then check each step": "Estudia un ejemplo resuelto y revisa cada paso",
  "Practise a strategy for the fact": "Practica una estrategia para la operación",
  "Build it": "Constrúyelo",
  "Draw it": "Dibújalo",
  "Numbers and symbols": "Números y símbolos",
  "Try it on your own": "Inténtalo por tu cuenta",
  "Fresh check, no help": "Revisión nueva, sin ayuda",
  "Fix it, then try a new one": "Corrígelo y prueba uno nuevo",
  "Keep it strong": "Mantenlo firme",
  "Model and steps showing": "Con modelo y pasos a la vista",
  "Hint when you ask": "Pista cuando la pidas",
  "No help": "Sin ayuda",
  "Look at the repair, then try": "Mira la corrección y luego inténtalo",
  // Messages to the learner
  "Let's work on {skill} together. First, a short lesson.":
    "Vamos a trabajar {skill} juntos. Primero, una lección corta.",
  "That is not part of this step right now.": "Eso no forma parte de este paso ahora.",
  "Nice. Now practice with help. The help fades as you go.":
    "Muy bien. Ahora practica con ayuda. La ayuda va disminuyendo poco a poco.",
  "Take a little more time with the lesson. Read each part, then continue.":
    "Tómate un poco más de tiempo con la lección. Lee cada parte y luego continúa.",
  "Right. {done} of {total} so far.": "Correcto. Llevas {done} de {total}.",
  "You are ready to try on your own, with little or no help.":
    "Ya estás listo para intentarlo por tu cuenta, con poca ayuda o sin ella.",
  "Right. That is {done} of {total} on your own.": "Correcto. Son {done} de {total} por tu cuenta.",
  "Great work. One last check with brand-new problems and no help.":
    "Buen trabajo. Una última revisión con problemas nuevos y sin ayuda.",
  "Not yet. Look at the repair, then try a fresh one like it.":
    "Todavía no. Mira la corrección y prueba uno nuevo parecido.",
  "That repair worked. Keep going.": "Esa corrección funcionó. Sigue así.",
  "Close. Look at the repair once more, then try one more.":
    "Casi. Mira la corrección otra vez y prueba uno más.",
  "We will keep working on this idea. Keep going.":
    "Seguiremos trabajando esta idea. Sigue adelante.",
  "Slow down a little. Read the problem and take your time. Very quick answers do not count toward the mission.":
    "Ve un poco más despacio. Lee el problema y tómate tu tiempo. Las respuestas muy rápidas no cuentan para la misión.",
  "Let's take a break and come back. Your teacher can see where you are.":
    "Hagamos una pausa y volvamos. Tu docente puede ver en qué parte vas.",
  "You have already seen that problem. A new one is coming.":
    "Ya viste ese problema. Viene uno nuevo.",
  "Answer saved. {done} of {total}.": "Respuesta guardada. {done} de {total}.",
  "You did it! You showed this on your own with new problems. It is mastered. We will check again later so it stays strong.":
    "¡Lo lograste! Lo mostraste por tu cuenta con problemas nuevos. Ya lo dominas. Lo revisaremos otra vez más adelante para que siga firme.",
  "Not quite yet, and that is okay. Let's look at it a different way.":
    "Todavía no, y está bien. Vamos a verlo de otra manera.",
  "You have worked hard on this. Your teacher will help with the next step.":
    "Trabajaste mucho en esto. Tu docente te ayudará con el siguiente paso.",
  "This skill is mastered. Its next check is not due yet.":
    "Esta destreza ya está dominada. Su próxima revisión todavía no toca.",
  "Still strong! See you again on a later day.": "¡Sigues firme! Nos vemos otra vez otro día.",
  "You kept this skill strong over a whole month. Wonderful.":
    "Mantuviste esta destreza firme durante todo un mes. Maravilloso.",
  "This one slipped a little. A short refresher will bring it back.":
    "Esta se te escapó un poco. Un repaso corto la traerá de vuelta.",
  "Let's go back to practice with help for a bit, then try on your own again.":
    "Volvamos a practicar con ayuda un rato y luego inténtalo otra vez por tu cuenta.",
  "Let's go back and try a different way in.":
    "Volvamos y busquemos otra manera de entrar en la idea.",
  "Paused. Come back when you are ready.": "En pausa. Vuelve cuando estés listo.",
  "Welcome back. Let's keep going.": "Qué bueno verte de nuevo. Sigamos.",
  "Back to the mission.": "De vuelta a la misión.",
  "A fresh start with your teacher's plan. First, a short lesson.":
    "Un nuevo comienzo con el plan de tu docente. Primero, una lección corta.",
  // Teacher-readable reasons
  "Started because {misses} of the last {window} independent answers were misses and the main cause looks like: {cause}.":
    "Se inició porque {misses} de las últimas {window} respuestas independientes fueron errores y la causa principal parece ser: {cause}.",
  "Started because only {correct} of {total} independent answers were right (the dashboard's stuck rule).":
    "Se inició porque solo {correct} de {total} respuestas independientes fueron correctas (la regla de atasco del panel).",
  "Started because this skill was missed on the learner's checkup and practice has not shown it is working.":
    "Se inició porque esta destreza falló en el chequeo del estudiante y la práctica aún no muestra que funcione.",
  "Started because a teacher assigned it.": "Se inició porque un docente la asignó.",
  "Route: {mode}, beginning at the {rep} level.": "Ruta: {mode}, comenzando en el nivel: {rep}.",
  "Learner accepted the mission.": "El estudiante aceptó la misión.",
  "Mini-lesson finished.": "Minilección terminada.",
  "Guided practice complete: {correct} of {answered} right, with the last {last} right and at most {hinted} needing a hint.":
    "Práctica guiada completa: {correct} de {answered} correctas, con las últimas {last} correctas y como máximo {hinted} con pista.",
  "Independent practice complete: {correct} of {answered} right with no help ({percent}%), {supported} answer(s) with help.":
    "Práctica independiente completa: {correct} de {answered} correctas sin ayuda ({percent}%), {supported} respuesta(s) con ayuda.",
  "{supported} answers needed help; promotion allows at most {max}. Returned to guided practice at a more concrete level.":
    "{supported} respuestas necesitaron ayuda; para avanzar se permite como máximo {max}. Volvió a la práctica guiada en un nivel más concreto.",
  "Guided practice reached {max} problems without meeting its exit rule.":
    "La práctica guiada llegó a {max} problemas sin cumplir su regla de salida.",
  "Independent practice reached {max} answers at {percent}%, below the {need}% needed.":
    "La práctica independiente llegó a {max} respuestas con {percent}%, por debajo del {need}% necesario.",
  "Wrong answer on {skill}: {reason}": "Respuesta incorrecta en {skill}: {reason}",
  "Revised successfully after the repair ({done} of {total} repairs so far).":
    "Se corrigió con éxito después de la reparación ({done} de {total} reparaciones hasta ahora).",
  "The same idea was missed again after {tries} repairs; recorded as unresolved.":
    "La misma idea falló otra vez después de {tries} reparaciones; queda registrada como no resuelta.",
  "{n} answer(s) in a row were very fast or repeated, so they were not counted.":
    "{n} respuesta(s) seguidas fueron muy rápidas o repetidas, por eso no se contaron.",
  "Paused: {n} answers in a row were very fast or repeated. Check whether the learner is rushing or stuck.":
    "En pausa: {n} respuestas seguidas fueron muy rápidas o repetidas. Revisen si el estudiante va con prisa o está atascado.",
  "A problem the learner had already seen was shown again; it was not counted.":
    "Se mostró otra vez un problema que el estudiante ya había visto; no se contó.",
  "Reassessment on {size} fresh problems: {correct} right with no help (needs {need}). Mastery recorded; retention checks scheduled on the 1, 3, 7, 14 and 30 day ladder.":
    "Reevaluación con {size} problemas nuevos: {correct} correctos sin ayuda (se necesitan {need}). Dominio registrado; las revisiones de retención quedan programadas en la escala de 1, 3, 7, 14 y 30 días.",
  "Reassessment on {size} fresh problems: only {correct} right with no help (needs {need}). Failed reassessments: {failures} of {max}. Teaching again at a more concrete level.":
    "Reevaluación con {size} problemas nuevos: solo {correct} correctos sin ayuda (se necesitan {need}). Reevaluaciones no superadas: {failures} de {max}. Se vuelve a enseñar en un nivel más concreto.",
  "Failed reassessment {failures} of {max}: only {correct} of {size} right with no help.":
    "Reevaluación no superada {failures} de {max}: solo {correct} de {size} correctas sin ayuda.",
  "Retention check {step} of {total} passed ({correct} of {answered} right). Next check in {days} days.":
    "Revisión de retención {step} de {total} superada ({correct} de {answered} correctas). Próxima revisión en {days} días.",
  "Retention check {step} of {total} passed. The ladder is complete.":
    "Revisión de retención {step} de {total} superada. La escala está completa.",
  "Retention check {step} failed ({correct} of {answered} right). Mastery relapse {relapses} of {max}; practice resumes with help.":
    "Revisión de retención {step} no superada ({correct} de {answered} correctas). Recaída del dominio {relapses} de {max}; la práctica se retoma con ayuda.",
  "Retention check failed again (relapse {relapses} of {max}).":
    "La revisión de retención volvió a fallar (recaída {relapses} de {max}).",
  "The mission stepped back more than {max} times.": "La misión retrocedió más de {max} veces.",
  "Paused.": "En pausa.",
  "Resumed.": "Reanudada.",
  "Prerequisite rescue finished: {outcome}.": "El repaso del prerrequisito terminó: {outcome}.",
  "Restarted by the teacher.": "Reiniciada por el docente.",
  // Exit criteria and progress
  "Start the mission": "Empezar la misión",
  "Finish the short lesson": "Terminar la lección corta",
  "At least {n} guided problems": "Al menos {n} problemas guiados",
  "At least {n} of them right": "Al menos {n} correctos",
  "The last {n} right, with at most {hinted} needing a hint":
    "Los últimos {n} correctos, con como máximo {hinted} que necesiten una pista",
  "At least {n} answers with no help": "Al menos {n} respuestas sin ayuda",
  "At least {percent}% of them right": "Al menos {percent}% correctas",
  "No more than {n} answer needing help": "No más de {n} respuesta con ayuda",
  "{n} brand-new problems, no help": "{n} problemas nuevos, sin ayuda",
  "At least {n} of {size} right": "Al menos {n} de {size} correctos",
  "Retention checks after 1, 3, 7, 14 and 30 days ({done} of {total} passed)":
    "Revisiones de retención después de 1, 3, 7, 14 y 30 días ({done} de {total} superadas)",
  Lesson: "Lección",
  "{done} of {total}": "{done} de {total}",
  // Teacher summary
  "This is a short screening of the learner's own answers, not a validated or standardized assessment. Observed counts are separate from suggestions.":
    "Esto es un breve sondeo de las respuestas del propio estudiante, no una evaluación validada ni estandarizada. Los conteos observados se mantienen separados de las sugerencias.",
  "No single cause yet": "Todavía no hay una causa única",
  "Suggested from patterns in wrong answers and the skill map. It is not measured.":
    "Sugerido a partir de patrones en las respuestas incorrectas y del mapa de destrezas. No está medido.",
  "Offer the mission. Reteach idea: {tip}": "Ofrezcan la misión. Idea para volver a enseñar: {tip}",
  "Let the mission run. Check in after the next stage. Reteach idea if the learner stalls: {tip}":
    "Dejen que la misión avance. Revisen después de la siguiente etapa. Idea para volver a enseñar si el estudiante se detiene: {tip}",
  "Let the learner finish the fresh check without help.":
    "Dejen que el estudiante termine la revisión nueva sin ayuda.",
  "A retention check is due now (step {step} of {total}).":
    "Hay una revisión de retención pendiente ahora (paso {step} de {total}).",
  "Next retention check on {date} (step {step} of {total}).":
    "Próxima revisión de retención el {date} (paso {step} de {total}).",
  "All five retention checks passed. Keep the skill in regular review.":
    "Se superaron las cinco revisiones de retención. Mantengan la destreza en repaso regular.",
  "Talk with the learner, then resume. Ask whether they are rushing, tired or stuck.":
    "Hablen con el estudiante y luego reanuden. Pregunten si va con prisa, está cansado o atascado.",
  "The learner is right only with help. Work a few problems together and remove one support at a time: {tip}":
    "El estudiante acierta solo con ayuda. Resuelvan algunos problemas juntos y quiten un apoyo a la vez: {tip}",
  "Meet with the learner for a short one-to-one, then repeat the check. Reteach idea: {tip}":
    "Reúnanse con el estudiante en una sesión breve y luego repitan la revisión. Idea para volver a enseñar: {tip}",
  "The learner stepped back several times. Check the prerequisite ({prereq}) before returning to this skill. Reteach idea: {tip}":
    "El estudiante retrocedió varias veces. Revisen el prerrequisito ({prereq}) antes de volver a esta destreza. Idea para volver a enseñar: {tip}",
  "The skill was mastered and then slipped twice. Plan spaced review and ask what they do when it slips: {tip}":
    "La destreza se dominó y luego se les escapó dos veces. Planifiquen un repaso espaciado y pregunten qué hace cuando se le escapa: {tip}",
  "The lab ran out of new problems for this skill. Use a teacher-made set for the check.":
    "El laboratorio se quedó sin problemas nuevos para esta destreza. Usen un conjunto hecho por el docente para la revisión.",
  "Use a concrete or pictorial model of the idea before any symbols.":
    "Usen un modelo concreto o con dibujos de la idea antes de los símbolos.",
  "Have the learner write each step and check it against an estimate.":
    "Pidan al estudiante que escriba cada paso y lo compare con una estimación.",
  "Practise one strategy for the fact without a timer, then check recall on a later day.":
    "Practiquen una estrategia para la operación sin cronómetro y revisen el recuerdo otro día.",
  "Ask the learner to explain their first step out loud.":
    "Pidan al estudiante que explique en voz alta su primer paso.",
  "none found": "ninguno encontrado",
  // Diagnosis: categories and reasons
  "Idea or method": "Idea o método",
  "Calculation slip": "Error de cálculo",
  "Recall and speed": "Memoria y rapidez",
  "Not sure yet": "Todavía no se sabe",
  "Answer {submitted} fits an idea mix-up: {label}. Check: {facts}.":
    "La respuesta {submitted} encaja con una confusión de idea: {label}. Comprobación: {facts}.",
  "Answer {submitted} fits the right method with a slip: {label}. Check: {facts}.":
    "La respuesta {submitted} encaja con el método correcto con un descuido: {label}. Comprobación: {facts}.",
  "You answered this exact basic fact correctly {count} time(s) before, so {submitted} looks like a recall slip.":
    "Respondiste esta misma operación básica correctamente {count} vez/veces antes, así que {submitted} parece un descuido de memoria.",
  "This is a basic fact and {correct} of {total} independent answers on this skill were right, so {submitted} looks like a recall slip, not a missing idea.":
    "Esta es una operación básica y {correct} de {total} respuestas independientes en esta destreza fueron correctas, así que {submitted} parece un descuido de memoria y no una idea que falta.",
  "You usually answer in about {median} seconds and this one took {seconds} seconds, on a skill you mostly get right.":
    "Normalmente respondes en unos {median} segundos y esta tardó {seconds} segundos, en una destreza que casi siempre aciertas.",
  "There is not enough evidence to say why. No common slip matches {submitted}.":
    "No hay evidencia suficiente para decir por qué. Ningún error común coincide con {submitted}.",
  "Two different explanations fit {submitted}, so we do not guess.":
    "Dos explicaciones distintas encajan con {submitted}, así que no adivinamos.",
  "No usable answer was entered, so there is nothing to diagnose.":
    "No se escribió una respuesta utilizable, así que no hay nada que diagnosticar.",
  "Very fast answers are often guesses, so we do not label this one.":
    "Las respuestas muy rápidas suelen ser adivinanzas, así que no etiquetamos esta.",
  "{submitted} is far from the size of the answer, which looks like a typing slip rather than a method.":
    "{submitted} está muy lejos del tamaño de la respuesta, lo que parece un error al escribir y no un método.",
  "Not enough labelled mistakes yet to name a main cause.":
    "Todavía no hay suficientes errores etiquetados para nombrar una causa principal.",
  "The mistakes have different causes, so there is no single main cause yet.":
    "Los errores tienen causas distintas, así que todavía no hay una causa principal.",
  "{count} of {labelled} labelled mistakes look like: {name}.":
    "{count} de {labelled} errores etiquetados parecen ser: {name}.",
  // Targeted hints for each category
  "Name the operation first. What is the problem asking you to do with the numbers?":
    "Nombra primero la operación. ¿Qué te pide el problema que hagas con los números?",
  "Your method looks right. Estimate first, then check each step.":
    "Tu método parece correcto. Estima primero y luego revisa cada paso.",
  "Use a strategy you know for this fact, then check it another way.":
    "Usa una estrategia que conozcas para esta operación y compruébala de otra manera.",
  "Try the first step again and say out loud what each number means.":
    "Intenta el primer paso otra vez y di en voz alta qué significa cada número.",
  // Targeted hints for each named slip
  "This problem puts the numbers together. Join the two amounts.":
    "Este problema junta los números. Une las dos cantidades.",
  "Check that every number in the problem was used.":
    "Comprueba que usaste todos los números del problema.",
  "This problem asks how much is left or how far apart. Start with the whole and take a part away.":
    "Este problema pregunta cuánto queda o qué tan separados están. Empieza con el total y quita una parte.",
  "The whole goes first. Start with the larger amount and take the smaller one away.":
    "El total va primero. Empieza con la cantidad mayor y quita la menor.",
  "Multiplying counts equal groups. Say how many groups and how many in each group.":
    "Multiplicar cuenta grupos iguales. Di cuántos grupos hay y cuántos hay en cada uno.",
  "You are one group away. Check how many groups there are and how many are in each.":
    "Te falta o te sobra un grupo. Revisa cuántos grupos hay y cuántos hay en cada uno.",
  "Division asks how many equal groups fit, not what is left after taking one away.":
    "Dividir pregunta cuántos grupos iguales caben, no lo que queda después de quitar uno.",
  "Division splits a total into equal groups. The answer is smaller than the total.":
    "Dividir reparte un total en grupos iguales. La respuesta es menor que el total.",
  "Division splits a total into equal groups. Do not join the numbers.":
    "Dividir reparte un total en grupos iguales. No juntes los números.",
  "The bottom number names the size of the pieces. Make equal-size pieces before you count them.":
    "El número de abajo nombra el tamaño de las partes. Haz partes del mismo tamaño antes de contarlas.",
  "A factor divides into both numbers. A multiple is something both numbers divide into. Which does the question ask for?":
    "Un factor divide a los dos números. Un múltiplo es algo que los dos números dividen. ¿Cuál pide la pregunta?",
  "Move along the x-axis first, then up or down for y.":
    "Muévete primero por el eje x y luego sube o baja para y.",
  "This problem joins the numbers. Add them; do not multiply.":
    "Este problema junta los números. Suma; no multipliques.",
  "This problem takes an amount away. Subtract; do not multiply.":
    "Este problema quita una cantidad. Resta; no multipliques.",
  "Multiplying counts equal groups. Do not take the numbers apart.":
    "Multiplicar cuenta grupos iguales. No separes los números.",
  "Multiplying makes equal groups bigger. Count the total in all the groups.":
    "Multiplicar junta grupos iguales. Cuenta el total de todos los grupos.",
  "Check the sign. Which direction does each step move on the number line?":
    "Revisa el signo. ¿Hacia dónde mueve cada paso en la recta numérica?",
  "Estimate the size first. Check that every digit is in the right place.":
    "Estima primero el tamaño. Comprueba que cada dígito esté en su lugar.",
  "The box is the missing part. Take the part you know away from the total.":
    "La casilla es la parte que falta. Quita la parte que conoces del total.",
  "The total is the whole. The box holds the missing part, which is smaller.":
    "El total es el todo. La casilla guarda la parte que falta, que es menor.",
  "Undo each step with its opposite: add with subtract, multiply with divide.":
    "Deshaz cada paso con su opuesto: suma con resta, multiplicación con división.",
  "After you undo the add or subtract, the variable is still multiplied. Divide both sides.":
    "Después de deshacer la suma o la resta, la variable sigue multiplicada. Divide los dos lados.",
  "The exponent counts how many times the base is a factor.":
    "El exponente cuenta cuántas veces la base es un factor.",
  "A square root is the number that multiplies by itself to make the given number.":
    "Una raíz cuadrada es el número que, multiplicado por sí mismo, da el número dado.",
  "The bottom number names the piece size. Make equal-size pieces first; do not subtract them.":
    "El número de abajo nombra el tamaño de las partes. Haz primero partes iguales; no los restes.",
  "When the pieces change size, the tops change by the same factor as the bottoms.":
    "Cuando las partes cambian de tamaño, los números de arriba cambian por el mismo factor que los de abajo.",
  "To multiply fractions, multiply the tops together and the bottoms together.":
    "Para multiplicar fracciones, multiplica los números de arriba entre sí y los de abajo entre sí.",
  "Dividing by a fraction means multiplying by its flip.":
    "Dividir entre una fracción significa multiplicar por su inversa.",
  "Only the fraction you divide by gets flipped.":
    "Solo se invierte la fracción entre la que divides.",
  "Smaller units mean more of them; bigger units mean fewer. Decide which way you are going.":
    "Con unidades más pequeñas hay más; con unidades más grandes hay menos. Decide hacia dónde vas.",
  "A unit rate is the amount for ONE item: divide the amount by the number of items.":
    "Una tasa unitaria es la cantidad para UNO: divide la cantidad entre el número de objetos.",
  "Equal ratios multiply or divide both parts by the same number. Adding changes the ratio.":
    "Las razones iguales multiplican o dividen las dos partes por el mismo número. Sumar cambia la razón.",
  "To keep a fraction the same size, multiply the top and bottom by the same number.":
    "Para que una fracción valga lo mismo, multiplica arriba y abajo por el mismo número.",
  "Slope is rise over run: the change in y goes on top.":
    "La pendiente es subida sobre avance: el cambio en y va arriba.",
  "Area counts the squares inside. Perimeter is the distance around the edge.":
    "El área cuenta los cuadrados de adentro. El perímetro es la distancia alrededor del borde.",
  "A triangle is half of a rectangle with the same base and height.":
    "Un triángulo es la mitad de un rectángulo con la misma base y la misma altura.",
  "A radius squared means radius times radius.": "Un radio al cuadrado significa radio por radio.",
  "Check what the question asks: the percent itself, not what remains.":
    "Revisa qué pide la pregunta: el porcentaje mismo, no lo que queda.",
  "Check each place from right to left. Did a ten move to the next place?":
    "Revisa cada lugar de derecha a izquierda. ¿Pasó una decena al lugar siguiente?",
  "You are very close. Check your last step.": "Estás muy cerca. Revisa tu último paso.",
  "Read your answer back, digit by digit, against your work.":
    "Lee tu respuesta dígito por dígito y compárala con tu trabajo.",
  // Named slip labels added by the Moby layer
  "Multiplied instead of adding": "Multiplicó en lugar de sumar",
  "Multiplied instead of subtracting": "Multiplicó en lugar de restar",
  "Subtracted instead of multiplying": "Restó en lugar de multiplicar",
  "Divided instead of multiplying": "Dividió en lugar de multiplicar",
  "Right size, wrong sign": "Tamaño correcto, signo equivocado",
  "Place value shifted by a ten, a hundred or more":
    "El valor posicional se corrió una decena, una centena o más",
  "Added where the missing number needs subtracting":
    "Sumó donde el número que falta se halla restando",
  "Wrote the total in the box": "Escribió el total en la casilla",
  "Undid the step with the wrong operation": "Deshizo el paso con la operación equivocada",
  "Stopped before dividing by the coefficient": "Se detuvo antes de dividir entre el coeficiente",
  "Multiplied the base by the exponent": "Multiplicó la base por el exponente",
  "Halved or squared instead of finding the square root":
    "Sacó la mitad o elevó al cuadrado en lugar de hallar la raíz cuadrada",
  "Subtracted the denominators": "Restó los denominadores",
  "Found a common denominator but kept the old tops":
    "Halló un denominador común pero dejó los numeradores anteriores",
  "Added the tops and the bottoms when multiplying": "Sumó arriba y abajo al multiplicar",
  "Did not flip the second fraction": "No invirtió la segunda fracción",
  "Flipped the first fraction": "Invirtió la primera fracción",
  "Converted in the wrong direction": "Convirtió en el sentido equivocado",
  "Flipped the rate": "Invirtió la tasa",
  "Added or subtracted instead of scaling": "Sumó o restó en lugar de escalar",
  "Added to the top instead of multiplying": "Sumó arriba en lugar de multiplicar",
  "Flipped the slope: run over rise": "Invirtió la pendiente: avance sobre subida",
  "Used the area idea for perimeter, or the reverse":
    "Usó la idea de área para el perímetro, o al revés",
  "Forgot to take half": "Olvidó tomar la mitad",
  "Doubled the radius instead of squaring it": "Duplicó el radio en lugar de elevarlo al cuadrado",
  "Found the part left over instead of the percent":
    "Halló la parte que queda en lugar del porcentaje",
  "A ten (or hundred) was carried or borrowed wrongly":
    "Se llevó o se prestó mal una decena (o centena)",
  "Off by one": "Se pasó o se quedó corto por uno",
  "Two neighbouring digits swapped": "Dos dígitos vecinos intercambiados",
};
