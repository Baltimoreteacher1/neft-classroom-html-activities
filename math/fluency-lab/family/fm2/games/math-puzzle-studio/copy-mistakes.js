// Wrong-answer feedback. Every message names the likely mistake and says what to look at next; none prints the
// answer. Lookup order: "<skill>:<key>", then "<key>", then the skill's own fallback in RECHECK.
// Placeholders such as {sum} or {label} are filled from the diagnosis. English and Spanish side by side. @fm2 FM-020 FM-063
import { fmt } from "../../lang.js";

const T = (en, es) => ({ en, es });

export const MISTAKES = {
  // ---- shared
  incomplete: T(
    "Fill every empty spot first, then check.",
    "Primero llena todos los lugares vacíos y luego comprueba.",
  ),
  "reused-tile": T(
    "A tile can be used only once here. Take it off its other spot first, or choose a different tile.",
    "Aquí cada ficha se usa una sola vez. Quítala de su otro lugar o elige otra ficha.",
  ),
  "wrong-kind": T(
    "Numbers go in the number spots and operations go in the operation spots.",
    "Los números van en los lugares de números y las operaciones en los lugares de operaciones.",
  ),
  "off-one": T(
    "So close! You are one away. Look again at the spot you just filled.",
    "¡Casi! Te falta o te sobra una unidad. Mira otra vez el lugar que acabas de llenar.",
  ),
  "off-ten": T(
    "Close, but the tens are off by one ten. Check the tens digit.",
    "Casi, pero las decenas se pasan o se quedan cortas por una decena. Revisa el dígito de las decenas.",
  ),
  "slot-pan-heavy": T(
    "The pan with your number is too heavy. Try a smaller number.",
    "El platillo con tu número pesa demasiado. Prueba con un número menor.",
  ),
  "slot-pan-light": T(
    "The pan with your number is too light. Try a bigger number.",
    "El platillo con tu número pesa muy poco. Prueba con un número mayor.",
  ),
  // ---- number bonds
  "bond-parts:copied-whole": T(
    "That is the whole. A part is smaller than the whole: the parts together make the whole.",
    "Ese es el total. Una parte es menor que el total: las partes juntas forman el total.",
  ),
  "bond-parts:copied-part": T(
    "You used a number that is already in the bond. Think: what do the parts make together, and what is still missing?",
    "Usaste un número que ya está en el enlace. Piensa: ¿qué forman las partes juntas y qué falta todavía?",
  ),
  "bond-parts:subtracted": T(
    "You took one part away from the other. The whole is both parts put together, so add them.",
    "Quitaste una parte de la otra. El total son las dos partes juntas, así que súmalas.",
  ),
  "bond-parts:parts-too-much": T(
    "These parts make {sum}, which is more than the whole. Choose smaller parts.",
    "Estas partes forman {sum}, que es más que el total. Elige partes menores.",
  ),
  "bond-parts:parts-too-little": T(
    "These parts make {sum}, which is less than the whole. Choose bigger parts.",
    "Estas partes forman {sum}, que es menos que el total. Elige partes mayores.",
  ),
  // ---- same amount, equal sign, missing number
  "balance-same:copied-total": T(
    "That is the weight of the whole other pan. This pan already holds some weight, so add only the difference.",
    "Ese es el peso de todo el otro platillo. Este platillo ya tiene algo de peso, así que agrega solo la diferencia.",
  ),
  "balance-same:copied-fixed": T(
    "That repeats the number already on this pan. You need the amount that makes the two pans equal.",
    "Eso repite el número que ya está en este platillo. Necesitas la cantidad que iguala los dos platillos.",
  ),
  "equal-sign:added-all": T(
    "You added everything on the left. The equal sign says both sides are the same amount, and the right side already has some of it.",
    "Sumaste todo lo del lado izquierdo. El signo igual dice que los dos lados son la misma cantidad, y el lado derecho ya tiene una parte.",
  ),
  "equal-sign:copied-fixed": T(
    "You copied a number that is already on the other side. Ask what that side still needs to match.",
    "Copiaste un número que ya está del otro lado. Pregunta qué le falta a ese lado para igualar.",
  ),
  "equal-sign:copied-total": T(
    "That is the whole other side. This side already has some of it, so it needs only the rest.",
    "Ese es todo el otro lado. Este lado ya tiene una parte, así que solo necesita lo que falta.",
  ),
  "missing-addend:copied-total": T(
    "That is the total in the equation. The missing number is a part of that total.",
    "Ese es el total de la ecuación. El número que falta es una parte de ese total.",
  ),
  "missing-addend:added-all": T(
    "You added the numbers you can see. Put your number in the blank and read the equation: is it true?",
    "Sumaste los números que se ven. Pon tu número en el espacio y lee la ecuación: ¿es verdadera?",
  ),
  "missing-addend:subtracted-wrong": T(
    "Here the missing number is what you started with, so it is bigger than both numbers shown. Taking away goes the wrong way.",
    "Aquí el número que falta es con el que empezaste, así que es mayor que los dos números que se ven. Quitar va en el sentido equivocado.",
  ),
  // ---- grids
  "grid-sums:row-off": T(
    "A row does not add up to its number. Add each row and compare.",
    "Una fila no suma su número. Suma cada fila y compara.",
  ),
  "grid-sums:col-off": T(
    "A column does not add up to its number. Add each column and compare.",
    "Una columna no suma su número. Suma cada columna y compara.",
  ),
  "grid-sums:both-off": T(
    "Both rows and columns miss their totals. Start with a row or column that has only one empty square.",
    "Las filas y las columnas fallan en sus totales. Empieza por una fila o columna que tenga un solo cuadro vacío.",
  ),
  "magic-triangle:side-off": T(
    "One side does not add up to the target. Add the three numbers on every side.",
    "Un lado no suma la meta. Suma los tres números de cada lado.",
  ),
  "magic-triangle:repeat": T(
    "A number is used twice. Every spot gets its own number.",
    "Un número se usa dos veces. Cada lugar lleva un número distinto.",
  ),
  "magic-square:row-off": T(
    "A row does not add up to the magic sum. Add each row.",
    "Una fila no suma la suma mágica. Suma cada fila.",
  ),
  "magic-square:col-off": T(
    "A column does not add up to the magic sum. Add each column.",
    "Una columna no suma la suma mágica. Suma cada columna.",
  ),
  "magic-square:diag-off": T(
    "The rows and columns work, but a diagonal does not add up to the magic sum.",
    "Las filas y columnas están bien, pero una diagonal no suma la suma mágica.",
  ),
  "magic-square:repeat": T(
    "A number is used twice. Every square gets its own number.",
    "Un número se usa dos veces. Cada cuadro lleva un número distinto.",
  ),
  "factor-grid:wrong-product": T(
    "A product in the grid does not match its two factors. Multiply the row factor by the column factor again.",
    "Un producto de la cuadrícula no coincide con sus dos factores. Vuelve a multiplicar el factor de la fila por el de la columna.",
  ),
  "factor-grid:added-not-multiplied": T(
    "You added the two factors. A square in the grid is its two factors multiplied.",
    "Sumaste los dos factores. Un cuadro de la cuadrícula es el producto de sus dos factores.",
  ),
  "factor-grid:wrong-factor": T(
    "A missing factor does not fit its product. Divide the product by the factor you know.",
    "Un factor que falta no encaja con su producto. Divide el producto entre el factor que conoces.",
  ),
  "factor-grid:factor-mismatch": T(
    "The factors and the product disagree. Check a square that has both of its factors showing.",
    "Los factores y el producto no concuerdan. Revisa un cuadro que muestre sus dos factores.",
  ),
  "kenken:repeat-row": T(
    "A number repeats in a row. Every row has each number exactly once.",
    "Un número se repite en una fila. Cada fila tiene cada número exactamente una vez.",
  ),
  "kenken:repeat-col": T(
    "A number repeats in a column. Every column has each number exactly once.",
    "Un número se repite en una columna. Cada columna tiene cada número exactamente una vez.",
  ),
  "kenken:cage-add": T(
    "The cage {label} must add up to its number. Add the numbers in that cage.",
    "La jaula {label} debe sumar su número. Suma los números de esa jaula.",
  ),
  "kenken:cage-sub": T(
    "The cage {label} needs a difference: the bigger number minus the smaller one.",
    "La jaula {label} necesita una diferencia: el número mayor menos el menor.",
  ),
  "kenken:cage-mul": T(
    "The cage {label} must multiply to its number. Multiply the numbers in that cage.",
    "La jaula {label} debe dar su número al multiplicar. Multiplica los números de esa jaula.",
  ),
  "kenken:cage-div": T(
    "The cage {label} needs a quotient: the bigger number divided by the smaller one.",
    "La jaula {label} necesita un cociente: el número mayor dividido entre el menor.",
  ),
  "factor-pairs:only-sum": T(
    "These fit the sum or difference clue, but they do not multiply to the product.",
    "Estos cumplen la pista de la suma o la diferencia, pero no dan el producto al multiplicarse.",
  ),
  "factor-pairs:only-product": T(
    "These multiply to the right product, but they miss the other clue.",
    "Estos dan el producto correcto, pero no cumplen la otra pista.",
  ),
  "factor-pairs:neither-pair": T(
    "These miss both clues. List the factor pairs of the product, then test each pair against the other clue.",
    "Estos no cumplen ninguna pista. Haz una lista de los pares de factores del producto y prueba cada par con la otra pista.",
  ),
  // ---- operations and forms
  "target-ops:order-of-ops": T(
    "Multiplication and division happen before addition and subtraction. Work the expression in that order, not just left to right.",
    "La multiplicación y la división se hacen antes que la suma y la resta. Resuelve la expresión en ese orden, no solo de izquierda a derecha.",
  ),
  "target-ops:parens-ignored": T(
    "Parentheses go first. Work what is inside the parentheses before the rest.",
    "Los paréntesis van primero. Resuelve lo que está dentro de los paréntesis antes de lo demás.",
  ),
  "target-ops:over-target": T(
    "Your expression makes {got}, which is more than the target. Try a different arrangement.",
    "Tu expresión da {got}, que es más que la meta. Prueba otro acomodo.",
  ),
  "target-ops:under-target": T(
    "Your expression makes {got}, which is less than the target. Try a different arrangement.",
    "Tu expresión da {got}, que es menos que la meta. Prueba otro acomodo.",
  ),
  "target-ops:not-whole": T(
    "That arrangement does not make a whole number you can use. Try a different arrangement.",
    "Ese acomodo no da un número entero que sirva. Prueba otro acomodo.",
  ),
  "equal-forms:decimal-shift": T(
    "Same digits, but the decimal point is in the wrong place. Which size is closer to the other pan?",
    "Los mismos dígitos, pero el punto decimal está mal puesto. ¿Qué tamaño se acerca más al otro platillo?",
  ),
  "equal-forms:percent-slip": T(
    "A percent is a number out of 100. Check how many places the decimal point has to move.",
    "Un porcentaje es un número sobre 100. Revisa cuántos lugares debe moverse el punto decimal.",
  ),
  "equal-forms:add-across": T(
    "You added the tops and added the bottoms. Fractions must have pieces of the same size before you add them.",
    "Sumaste los numeradores y sumaste los denominadores. Las fracciones deben tener partes del mismo tamaño antes de sumarse.",
  ),
  "equal-forms:inverted": T(
    "That fraction is upside down. Keep the part on top and the whole on the bottom.",
    "Esa fracción está al revés. Deja la parte arriba y el todo abajo.",
  ),
  "equal-forms:close-not-equal": T(
    "Close, but not equal. Equal values must match exactly, not just be near each other.",
    "Cerca, pero no es igual. Los valores iguales deben coincidir exactamente, no solo estar cerca.",
  ),
  "equal-forms:slot-pan-heavy": T(
    "Your weight is worth more than the other pan. Choose a smaller value.",
    "Tu pesa vale más que el otro platillo. Elige un valor menor.",
  ),
  "equal-forms:slot-pan-light": T(
    "Your weight is worth less than the other pan. Choose a bigger value.",
    "Tu pesa vale menos que el otro platillo. Elige un valor mayor.",
  ),
  "inequality-scale:equal-not-tip": T(
    "The pans weigh exactly the same, so the scale stays level. It has to tip.",
    "Los platillos pesan exactamente lo mismo, así que la balanza queda nivelada. Tiene que inclinarse.",
  ),
  "inequality-scale:wrong-way": T(
    "The scale tips the other way. Try a number that tilts it toward the side the puzzle asks for.",
    "La balanza se inclina hacia el otro lado. Prueba un número que la incline hacia el lado que pide el reto.",
  ),
  "equiv-expr:distribute-first": T(
    "You multiplied only the first term. The number outside the parentheses multiplies every term inside.",
    "Multiplicaste solo el primer término. El número de afuera de los paréntesis multiplica todos los términos de adentro.",
  ),
  "equiv-expr:dropped-multiplier": T(
    "The number outside the parentheses multiplies the x as well.",
    "El número de afuera de los paréntesis también multiplica a la x.",
  ),
  "equiv-expr:added-not-multiplied": T(
    "You added where you should multiply. Multiply the outside number by each term inside.",
    "Sumaste donde debías multiplicar. Multiplica el número de afuera por cada término de adentro.",
  ),
  "equiv-expr:combined-unlike": T(
    "x-boxes and plain weights are different kinds of things. Combine only like terms.",
    "Las cajas x y las pesas sueltas son cosas distintas. Combina solo términos semejantes.",
  ),
  "equiv-expr:dropped-constant": T(
    "Your expression lost some plain weights. Count them again.",
    "A tu expresión se le perdieron algunas pesas sueltas. Cuéntalas otra vez.",
  ),
  "equiv-expr:multiplied-coefficients": T(
    "The groups of x should be added together, not multiplied. Combine like terms.",
    "Los grupos de x se suman, no se multiplican. Combina términos semejantes.",
  ),
  "equiv-expr:same-here": T(
    "It balances for this x, but try another x with the x buttons. Equivalent expressions balance for every x.",
    "Se equilibra con esta x, pero prueba otra x con los botones. Las expresiones equivalentes se equilibran con cualquier x.",
  ),
  // ---- two scales and squares
  "scale-system:one-scale-only": T(
    "Scale {which} balances but scale {other} does not. Both scales must balance with the same two weights.",
    "La balanza {which} se equilibra pero la balanza {other} no. Las dos deben equilibrarse con los mismos dos pesos.",
  ),
  "scale-system:swapped-weights": T(
    "Those weights would balance both scales if you swapped them. The cube and the ball are mixed up.",
    "Esos pesos equilibrarían las dos balanzas si los cambiaras de lugar. Confundiste el cubo con la pelota.",
  ),
  "scale-system:neither-scale": T(
    "Neither scale balances. Compare the two scales to see what changes from one to the other.",
    "Ninguna balanza se equilibra. Compara las dos balanzas para ver qué cambia de una a la otra.",
  ),
  "pythag-squares:added-sides": T(
    "You added the side lengths. It is the areas that balance, so square each side first.",
    "Sumaste las longitudes de los lados. Lo que se equilibra son las áreas, así que primero eleva al cuadrado cada lado.",
  ),
  "pythag-squares:area-not-side": T(
    "That number is an area. The tile asks for a side length, so find the side of a square with that area.",
    "Ese número es un área. La ficha pide la longitud de un lado, así que busca el lado de un cuadrado con esa área.",
  ),
  "pythag-squares:subtracted-sides": T(
    "You subtracted side lengths. Subtract the areas instead, then find the side.",
    "Restaste longitudes de lados. Resta las áreas y luego busca el lado.",
  ),
  // ---- equation scales
  tipped: T(
    "The scale is tipped, so a move was done to one pan only. Undo it, or do the same to the other pan.",
    "La balanza está inclinada, así que un movimiento se hizo en un solo platillo. Deshazlo o haz lo mismo en el otro platillo.",
  ),
  "loose-weights": T(
    "There are still loose weights on the pan with the x-boxes. Take off the same amount from both pans.",
    "Todavía hay pesas sueltas en el platillo con las cajas x. Quita la misma cantidad de los dos platillos.",
  ),
  "needs-split": T(
    "More than one x-box is left on the pan. Split both pans into equal groups until one x-box is alone.",
    "Queda más de una caja x en el platillo. Divide los dos platillos en grupos iguales hasta que quede una caja x sola.",
  ),
  "x-both-pans": T(
    "There are x-boxes on both pans. Take off the same number of x-boxes from both pans.",
    "Hay cajas x en los dos platillos. Quita la misma cantidad de cajas x de los dos platillos.",
  ),
  "bad-move": T(
    "That move cannot be made. Choose an amount and a move again.",
    "Ese movimiento no se puede hacer. Elige otra vez una cantidad y un movimiento.",
  ),
};

// A move the scale refuses. These are shown at once and change nothing.
export const MOVE_MISTAKES = {
  "too-few-weights": T(
    "The {pan} pan has only {have} loose weights, so you cannot take off {n}.",
    "El platillo {pan} solo tiene {have} pesas sueltas, así que no puedes quitar {n}.",
  ),
  "too-few-boxes": T(
    "The {pan} pan has only {have} x-boxes, so you cannot take off {n}.",
    "El platillo {pan} solo tiene {have} cajas x, así que no puedes quitar {n}.",
  ),
  "x-one-pan": T(
    "Taking x-boxes off one pan only would tip the scale. Take the same number off both pans.",
    "Quitar cajas x de un solo platillo inclinaría la balanza. Quita la misma cantidad de los dos platillos.",
  ),
  "split-one-pan": T(
    "Splitting only one pan would tip the scale. Split both pans into the same number of groups.",
    "Dividir un solo platillo inclinaría la balanza. Divide los dos platillos en el mismo número de grupos.",
  ),
  "split-uneven": T(
    "The {pan} pan has {have} x-boxes, and they cannot make {n} equal groups.",
    "El platillo {pan} tiene {have} cajas x y no pueden formar {n} grupos iguales.",
  ),
  "split-loose": T(
    "Splitting now would cut the loose weights on the {pan} pan into pieces. Take the loose weights off first, then split.",
    "Dividir ahora cortaría en pedazos las pesas sueltas del platillo {pan}. Quita primero las pesas sueltas y luego divide.",
  ),
  "bad-move": T("That move cannot be made.", "Ese movimiento no se puede hacer."),
  "none-to-undo": T("There is nothing to undo.", "No hay nada que deshacer."),
};

// The fallback for a wrong board when no more specific mistake applies, one per skill.
export const RECHECK = {
  "bond-parts": T(
    "Check the bond: the two parts together must make the whole.",
    "Revisa el enlace: las dos partes juntas deben formar el total.",
  ),
  "balance-same": T(
    "The two pans do not weigh the same yet. Look at the tilt and change your number.",
    "Los dos platillos todavía no pesan lo mismo. Mira la inclinación y cambia tu número.",
  ),
  "equal-sign": T(
    "The two sides are not the same amount yet. Find what the scale needs.",
    "Los dos lados todavía no son la misma cantidad. Busca lo que necesita la balanza.",
  ),
  "missing-addend": T(
    "Put your number in the blank and read the equation. Do both sides name the same amount?",
    "Pon tu número en el espacio y lee la ecuación. ¿Los dos lados representan la misma cantidad?",
  ),
  "grid-sums": T(
    "Some rows or columns miss their totals. Check each one.",
    "Algunas filas o columnas no llegan a su total. Revisa cada una.",
  ),
  "magic-triangle": T(
    "Some side misses the target. Add the numbers along each side.",
    "Algún lado no llega a la meta. Suma los números de cada lado.",
  ),
  "magic-square": T(
    "Some line misses the magic sum. Add every row, column and diagonal.",
    "Alguna línea no llega a la suma mágica. Suma cada fila, columna y diagonal.",
  ),
  "factor-grid": T(
    "Some square disagrees with its factors. Check the multiplication in each square.",
    "Algún cuadro no concuerda con sus factores. Revisa la multiplicación de cada cuadro.",
  ),
  kenken: T(
    "Something breaks a rule. Check the rows, the columns and each cage.",
    "Algo rompe una regla. Revisa las filas, las columnas y cada jaula.",
  ),
  "factor-pairs": T(
    "These numbers miss a clue. Test your pair against both clues.",
    "Estos números no cumplen una pista. Prueba tu pareja con las dos pistas.",
  ),
  "target-ops": T(
    "The expression does not make the target. Try a different arrangement.",
    "La expresión no da la meta. Prueba otro acomodo.",
  ),
  "equal-forms": T(
    "That weight is not equal to the other pan. Compare the values, not the look of the numbers.",
    "Esa pesa no es igual al otro platillo. Compara los valores, no el aspecto de los números.",
  ),
  "scale-onestep": T(
    "Keep going until one x-box is alone on a pan, doing the same thing to both pans.",
    "Sigue hasta que quede una caja x sola en un platillo, haciendo lo mismo en los dos platillos.",
  ),
  "inequality-scale": T(
    "The scale does not tip the way the puzzle asks. Try a different number.",
    "La balanza no se inclina como pide el reto. Prueba con otro número.",
  ),
  "scale-twostep": T(
    "Keep going until one x-box is alone on a pan, doing the same thing to both pans.",
    "Sigue hasta que quede una caja x sola en un platillo, haciendo lo mismo en los dos platillos.",
  ),
  "equiv-expr": T(
    "That expression is not the same as the one on the left. Check each term.",
    "Esa expresión no es igual a la de la izquierda. Revisa cada término.",
  ),
  "scale-system": T(
    "The weights do not balance both scales. Check each scale separately.",
    "Los pesos no equilibran las dos balanzas. Revisa cada balanza por separado.",
  ),
  "scale-both-sides": T(
    "Keep going until one x-box is alone on a pan, doing the same thing to both pans.",
    "Sigue hasta que quede una caja x sola en un platillo, haciendo lo mismo en los dos platillos.",
  ),
  "pythag-squares": T(
    "The areas do not balance. Find the area of each square, then compare.",
    "Las áreas no se equilibran. Calcula el área de cada cuadrado y luego compara.",
  ),
};

// The feedback object for a diagnosed mistake in a skill.
export function feedbackText(skillId, key, vars = {}) {
  const base = MISTAKES[`${skillId}:${key}`] || MISTAKES[key] || RECHECK[skillId];
  return { en: fmt(base.en, vars), es: fmt(base.es, vars) };
}

export const hasSpecificFeedback = (skillId, key) =>
  Boolean(MISTAKES[`${skillId}:${key}`] || MISTAKES[key]);
