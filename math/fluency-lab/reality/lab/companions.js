// Family companions for the flagship experiences. Each companion answers the eight questions a family needs: what we are
// learning, why it matters, the model to try, what to talk about, a short practice, the common mix-up to watch for, one
// independent problem, and what comes next. Every line is bilingual (English and Spanish). Nothing here states the answer
// to a practice problem, and every "next" points at a real experience in the catalog (checked by the tests).
import { L } from "./kernel.js";

export const COMPANIONS = {
  "fraction-transform": {
    goal: L(
      "Know that different fractions can name the same amount.",
      "Saber que fracciones diferentes pueden nombrar la misma cantidad.",
    ),
    why: L(
      "Equal fractions let you compare, add and simplify. Recipes, maps and money all use them.",
      "Las fracciones iguales te permiten comparar, sumar y simplificar. Las recetas, los mapas y el dinero las usan.",
    ),
    talk: [
      L(
        "What changed about the pieces? What stayed the same?",
        "¿Qué cambió en las piezas? ¿Qué se quedó igual?",
      ),
      L(
        "If you cut every piece in two, how many pieces are shaded now?",
        "Si cortas cada pieza en dos, ¿cuántas piezas están sombreadas ahora?",
      ),
      L(
        "Can you find another fraction that is the same amount?",
        "¿Puedes encontrar otra fracción que sea la misma cantidad?",
      ),
    ],
    practice: L(
      "Shade 1/2 of a bar. Cut every part in two and count the shaded parts again.",
      "Sombrea 1/2 de una barra. Corta cada parte en dos y vuelve a contar las partes sombreadas.",
    ),
    watch: L(
      "More pieces does not always mean a bigger fraction. Ask: is each piece smaller now?",
      "Más piezas no siempre significa una fracción más grande. Pregunta: ¿cada pieza es más pequeña ahora?",
    ),
    independent: L(
      "Show 2/3 and then a different fraction that is equal to it.",
      "Muestra 2/3 y luego otra fracción diferente que sea igual.",
    ),
    next: "balance-equation",
  },
  "balance-equation": {
    goal: L(
      "Understand that whatever you do to one side of an equation, you do to the other.",
      "Entender que lo que haces a un lado de una ecuación, lo haces también al otro.",
    ),
    why: L(
      "This is how every equation is solved, from money problems to science formulas.",
      "Así se resuelve toda ecuación, desde problemas de dinero hasta fórmulas de ciencias.",
    ),
    talk: [
      L(
        "What happened to the scale when you took away from only one side?",
        "¿Qué le pasó a la balanza cuando quitaste solo de un lado?",
      ),
      L(
        "What did you have to do to make it balance again?",
        "¿Qué tuviste que hacer para que volviera a equilibrarse?",
      ),
      L(
        "Why does doing the same thing to both sides keep it fair?",
        "¿Por qué hacer lo mismo en ambos lados la mantiene justa?",
      ),
    ],
    practice: L(
      "Write x + 3 = 8. Take 3 away from both sides. What is x?",
      "Escribe x + 3 = 8. Quita 3 de ambos lados. ¿Cuánto vale x?",
    ),
    watch: L(
      "Changing only one side breaks the balance. Ask: did both sides change the same way?",
      "Cambiar solo un lado rompe el equilibrio. Pregunta: ¿los dos lados cambiaron igual?",
    ),
    independent: L(
      "Solve 2x + 1 = 9 with the scale, then check your x by putting it back in.",
      "Resuelve 2x + 1 = 9 con la balanza, y luego comprueba tu x volviéndola a poner en la ecuación.",
    ),
    next: "reverse-equation",
  },
  "discover-area": {
    goal: L(
      "Find out how changing one side of a rectangle changes its area.",
      "Descubrir cómo cambia el área de un rectángulo cuando cambias uno de sus lados.",
    ),
    why: L(
      "Area tells you how much floor, paint or grass covers a space.",
      "El área te dice cuánto piso, pintura o pasto cubre un espacio.",
    ),
    talk: [
      L(
        "Before you stretched it, what did you predict? Was it right?",
        "Antes de estirarlo, ¿qué predijiste? ¿Acertaste?",
      ),
      L(
        "Does the rule still work when the height is different?",
        "¿La regla sigue funcionando cuando el alto es diferente?",
      ),
      L(
        "How could you check the area without multiplying?",
        "¿Cómo podrías comprobar el área sin multiplicar?",
      ),
    ],
    practice: L(
      "Draw a 3 by 4 rectangle, then make it 6 by 4. How many times bigger is the area?",
      "Dibuja un rectángulo de 3 por 4, luego hazlo de 6 por 4. ¿Cuántas veces más grande es el área?",
    ),
    watch: L(
      "Doubling one side does not add the same number to the area. Ask: is the area multiplied, or added to?",
      "Duplicar un lado no suma el mismo número al área. Pregunta: ¿el área se multiplica o se le suma algo?",
    ),
    independent: L(
      "Make a rectangle with area 12 and one with area 24. What changed?",
      "Haz un rectángulo con área 12 y otro con área 24. ¿Qué cambió?",
    ),
    next: "build-area-24",
  },
  "xray-division": {
    goal: L(
      "See that dividing by a fraction asks how many of that fraction fit.",
      "Ver que dividir entre una fracción pregunta cuántas veces cabe esa fracción.",
    ),
    why: L(
      "Dividing fractions answers questions like how many half-cups fill a bowl.",
      "Dividir fracciones responde preguntas como cuántas medias tazas llenan un tazón.",
    ),
    talk: [
      L(
        "How many eighths are in three quarters? How do you know?",
        "¿Cuántos octavos hay en tres cuartos? ¿Cómo lo sabes?",
      ),
      L("Why did we cut the bar into eighths?", "¿Por qué cortamos la barra en octavos?"),
      L(
        "What would change if the groups were bigger?",
        "¿Qué cambiaría si los grupos fueran más grandes?",
      ),
    ],
    practice: L(
      "Cut a bar into eighths. How many eighths fit in one half?",
      "Corta una barra en octavos. ¿Cuántos octavos caben en una mitad?",
    ),
    watch: L(
      "Dividing by a fraction does not always make a smaller answer. Ask: how many groups fit?",
      "Dividir entre una fracción no siempre da una respuesta más pequeña. Pregunta: ¿cuántos grupos caben?",
    ),
    independent: L("How many thirds fit in two wholes?", "¿Cuántos tercios caben en dos enteros?"),
    next: "mistake-decimal",
  },
  "mistake-decimal": {
    goal: L(
      "Check a decimal sum with place value, and repair it with a model.",
      "Revisar una suma de decimales con valor posicional y repararla con un modelo.",
    ),
    why: L(
      "Money is decimal. Place value makes sure 0.40 and 0.04 are not confused.",
      "El dinero es decimal. El valor posicional asegura que 0.40 y 0.04 no se confundan.",
    ),
    talk: [
      L(
        "Is the answer bigger than each number you added? Should it be?",
        "¿La respuesta es mayor que cada número que sumaste? ¿Debería serlo?",
      ),
      L(
        "Which place is the 4 in 0.4? What about the 4 in 0.04?",
        "¿En qué lugar está el 4 en 0.4? ¿Y el 4 en 0.04?",
      ),
      L(
        "What did the tenths look like when you traded them?",
        "¿Cómo se vieron los décimos cuando los cambiaste?",
      ),
    ],
    practice: L(
      "Try 0.5 + 0.25 on paper, lining up the decimal points. Then check with a model.",
      "Prueba 0.5 + 0.25 en papel, alineando los puntos decimales. Luego comprueba con un modelo.",
    ),
    watch: L(
      "Lining numbers up from the right is only right when the decimal points line up. Ask: where is each point?",
      "Alinear los números desde la derecha solo es correcto cuando los puntos decimales coinciden. Pregunta: ¿dónde está cada punto?",
    ),
    independent: L(
      "Find 0.6 + 0.27 and say why your answer is reasonable.",
      "Calcula 0.6 + 0.27 y di por qué tu respuesta es razonable.",
    ),
    next: "build-decimal-fraction",
  },
  "build-area-24": {
    goal: L(
      "Build rectangles with the same area and compare their perimeters.",
      "Construir rectángulos con la misma área y comparar sus perímetros.",
    ),
    why: L(
      "Fencing, framing and packaging all trade off the area and the distance around.",
      "Las cercas, los marcos y los empaques equilibran el área y la distancia alrededor.",
    ),
    talk: [
      L(
        "Which rectangle used the least fence? Why do you think so?",
        "¿Qué rectángulo usó menos cerca? ¿Por qué lo crees?",
      ),
      L(
        "What do the closest sides have in common?",
        "¿Qué tienen en común los lados más parecidos?",
      ),
      L(
        "Can you find a rectangle with area 24 that is not on the list?",
        "¿Puedes encontrar un rectángulo con área 24 que no esté en la lista?",
      ),
    ],
    practice: L(
      "List every pair of whole numbers that multiplies to 12.",
      "Haz una lista de todos los pares de números enteros que multiplicados den 12.",
    ),
    watch: L(
      "Same area does not mean same perimeter. Ask: what happens to the sides when one gets longer?",
      "Misma área no significa mismo perímetro. Pregunta: ¿qué les pasa a los lados cuando uno se alarga?",
    ),
    independent: L(
      "Make a rectangle with area 36 and the smallest perimeter you can.",
      "Haz un rectángulo con área 36 y el menor perímetro posible.",
    ),
    next: "reverse-36",
  },
  "recipe-scaling": {
    goal: L(
      "See that scaling a recipe multiplies every amount by the same number.",
      "Ver que escalar una receta multiplica cada cantidad por el mismo número.",
    ),
    why: L(
      "Cooking for more people, or less, is proportional reasoning.",
      "Cocinar para más o menos personas es razonamiento proporcional.",
    ),
    talk: [
      L(
        "If the recipe doubles, what happens to every amount?",
        "Si la receta se duplica, ¿qué pasa con cada cantidad?",
      ),
      L(
        "Does the flour go up by the same amount as the eggs?",
        "¿La harina sube lo mismo que los huevos?",
      ),
      L(
        "Where do the table, the graph and the equation show the same idea?",
        "¿Dónde muestran la misma idea la tabla, la gráfica y la ecuación?",
      ),
    ],
    practice: L(
      "A recipe for 2 people uses 1 cup of rice. How much rice for 6 people?",
      "Una receta para 2 personas usa 1 taza de arroz. ¿Cuánto arroz para 6 personas?",
    ),
    watch: L(
      "Adding the same amount to each ingredient is not scaling. Ask: is each amount multiplied?",
      "Sumar la misma cantidad a cada ingrediente no es escalar. Pregunta: ¿cada cantidad se multiplica?",
    ),
    independent: L(
      "A smoothie uses 3 cups of juice for 4 servings. How much juice for 10 servings?",
      "Un licuado usa 3 tazas de jugo para 4 porciones. ¿Cuánto jugo para 10 porciones?",
    ),
    next: "reverse-36",
  },
  "reverse-36": {
    goal: L(
      "Build expressions that equal 36 in different ways, using exactly three operations.",
      "Construir expresiones que valgan 36 de diferentes maneras, con exactamente tres operaciones.",
    ),
    why: L(
      "Working backwards from an answer shows you how operations fit together.",
      "Trabajar hacia atrás desde una respuesta muestra cómo encajan las operaciones.",
    ),
    talk: [
      L(
        "How did you count the operations in your expression?",
        "¿Cómo contaste las operaciones en tu expresión?",
      ),
      L("Can you make 36 another way?", "¿Puedes hacer 36 de otra manera?"),
      L(
        "Which of your expressions did you find by starting from a fact you knew?",
        "¿Cuál de tus expresiones encontraste empezando con un dato que ya sabías?",
      ),
    ],
    practice: L(
      "Make 24 with exactly two operations. Then make it another way.",
      "Haz 24 con exactamente dos operaciones. Luego hazlo de otra manera.",
    ),
    watch: L(
      "Brackets change the order. Ask: which part did you do first?",
      "Los paréntesis cambian el orden. Pregunta: ¿qué parte hiciste primero?",
    ),
    independent: L(
      "Make 20 with exactly three operations.",
      "Haz 20 con exactamente tres operaciones.",
    ),
    next: "fraction-transform",
  },
};
