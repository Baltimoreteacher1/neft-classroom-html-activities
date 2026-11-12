// "Another way" for every Grade 6–8 skill: a second road into the problem, in English and Spanish, offered beside
// help (shell/content.js anotherWay). It names a strategy, never a result, so it is safe on any problem of the
// skill; g68.test.mjs checks it never states a practice answer. Skills whose engine has a second representation
// show that first; this text is the bilingual fallback everywhere else.
import { L } from "./kit-68.js";

const way = (en, es) => ({ text: L(en, es) });

export const ANOTHER_68 = {
  "6:gcf": way(
    "Write each number as a product of primes. Circle the primes the two lists share, and multiply only the shared ones.",
    "Escribe cada número como producto de primos. Encierra los primos que comparten las dos listas y multiplica solo los compartidos.",
  ),
  "6:lcm": way(
    "List the multiples of the larger number one at a time, and stop at the first one the smaller number divides exactly.",
    "Escribe los múltiplos del número mayor uno por uno y detente en el primero que el número menor divida exactamente.",
  ),
  "6:divide-fractions": way(
    "Rewrite both fractions with a common denominator. Then the question is just how many of the second numerator fit into the first: divide the numerators.",
    "Reescribe las dos fracciones con un denominador común. Así la pregunta es cuántas veces cabe el segundo numerador en el primero: divide los numeradores.",
  ),
  "6:decimal-ops": way(
    "Ignore the decimal points and work with whole numbers first. Then use an estimate with rounded numbers to place the decimal point.",
    "Ignora los puntos decimales y trabaja primero con números enteros. Luego usa una estimación con números redondeados para colocar el punto decimal.",
  ),
  "6:unit-rates": way(
    "Make a two-row table: the count on top, the amount below. Divide both entries by the count so the top entry becomes 1.",
    "Haz una tabla de dos filas: la cantidad de artículos arriba y el total abajo. Divide las dos entradas entre la cantidad para que la de arriba sea 1.",
  ),
  "6:percent": way(
    "Find ten percent first by dividing the whole by ten. Then build the percent you need from ten-percent and five-percent pieces, adding the matching amounts.",
    "Halla primero el diez por ciento dividiendo el total entre diez. Luego forma el porcentaje que necesitas con partes de diez y de cinco por ciento, sumando las cantidades que les corresponden.",
  ),
  "6:percent-whole": way(
    "Scale the known pair down to one percent or ten percent, then up to the whole: whatever you do to the percent, do to the amount.",
    "Escala la pareja conocida hacia abajo hasta el uno o el diez por ciento y luego hacia arriba hasta el total: lo que hagas al porcentaje, hazlo a la cantidad.",
  ),
  "6:evaluate": way(
    "Rewrite the expression with the value in parentheses where the variable was, then underline the operation to do first before computing anything.",
    "Reescribe la expresión con el valor entre paréntesis donde estaba la variable y subraya la operación que va primero antes de calcular.",
  ),
  "6:one-step": way(
    "Guess and check: substitute a value for x, see whether the sides match, and adjust. Then confirm with the inverse operation.",
    "Prueba y comprueba: sustituye un valor por x, mira si los lados coinciden y ajusta. Luego confirma con la operación inversa.",
  ),
  "6:integers": way(
    "Sketch a quick number line or grid, place the point, and count units to the axis or to the other point instead of computing.",
    "Dibuja una recta numérica o una cuadrícula rápida, coloca el punto y cuenta unidades hasta el eje o hasta el otro punto en lugar de calcular.",
  ),
  "6:triangle-area": way(
    "Draw the rectangle around the triangle with the same base and height. Find the rectangle's area, then take half.",
    "Dibuja el rectángulo alrededor del triángulo con la misma base y altura. Halla el área del rectángulo y luego toma la mitad.",
  ),
  "6:multi-digit-division": way(
    "Use partial quotients: subtract big friendly chunks of the divisor (hundreds of it, then tens, then ones) and add up how many of each you took.",
    "Usa cocientes parciales: resta partes cómodas grandes del divisor (centenas de él, luego decenas, luego unidades) y suma cuántas de cada una tomaste.",
  ),
  "6:order-rational": way(
    "Change every number to a decimal, sort the negatives and the positives separately, then put all the negatives first.",
    "Convierte cada número a decimal, ordena los negativos y los positivos por separado y luego pon todos los negativos primero.",
  ),
  "6:equivalent-expressions": way(
    "Draw the expression as an area: a rectangle split into parts. Each part's area is one term; adding the parts gives the expanded form.",
    "Dibuja la expresión como un área: un rectángulo dividido en partes. El área de cada parte es un término; sumar las partes da la forma desarrollada.",
  ),
  "6:write-inequalities": way(
    "Test the boundary number and one number on each side of it against the words. Keep the side that fits, and decide whether the boundary itself fits.",
    "Prueba el número límite y un número a cada lado con las palabras. Quédate con el lado que cumple y decide si el límite mismo cumple.",
  ),
  "6:data-displays": way(
    "Make tally marks for each value or category as you read the list, then count the tallies in the group you need.",
    "Haz marcas de conteo para cada valor o categoría mientras lees la lista y luego cuenta las marcas del grupo que necesitas.",
  ),
  "6:center-spread": way(
    "Rewrite the data in order on a number line first. Center and spread are much easier to see once the values are ordered.",
    "Reescribe primero los datos en orden en una recta numérica. El centro y la dispersión se ven mucho mejor cuando los valores están ordenados.",
  ),
  "6:surface-area-nets": way(
    "Sketch the net and write each face's area inside it. Matching faces have matching areas, so you only compute the different ones.",
    "Dibuja la red y escribe el área de cada cara dentro de ella. Las caras iguales tienen áreas iguales, así que solo calculas las distintas.",
  ),
  "6:volume-fractional": way(
    "Count half-unit cubes: double each edge to get the number of half-cubes along it, multiply, then divide by 8.",
    "Cuenta cubitos de media unidad: duplica cada arista para obtener cuántos cubitos caben a lo largo, multiplica y luego divide entre 8.",
  ),
  "7:integer-add": way(
    "Use a thermometer: start at the first number, go up for adding a positive or subtracting a negative, and down otherwise.",
    "Usa un termómetro: empieza en el primer número, sube al sumar un positivo o restar un negativo, y baja en los demás casos.",
  ),
  "7:integer-mul": way(
    "Multiply or divide the sizes as whole numbers, then count the negative signs: an even count gives a positive result, an odd count a negative one.",
    "Multiplica o divide los tamaños como números enteros y luego cuenta los signos negativos: una cantidad par da un resultado positivo y una impar, uno negativo.",
  ),
  "7:fraction-ops": way(
    "Decide the sign of the answer first with the integer rules, then work with the fractions as if both were positive.",
    "Decide primero el signo de la respuesta con las reglas de los enteros y luego trabaja con las fracciones como si las dos fueran positivas.",
  ),
  "7:unit-rate": way(
    "Make both numbers whole first: multiply the total and the count by 10 or 100, which does not change the rate, then divide.",
    "Convierte primero los dos números en enteros: multiplica el total y la cantidad por 10 o 100, lo que no cambia la tasa, y luego divide.",
  ),
  "7:proportions": way(
    "Find the unit rate of the known ratio (the numerator for 1 in the denominator), then multiply it by the new denominator.",
    "Halla la tasa unitaria de la razón conocida (el numerador por cada 1 del denominador) y luego multiplícala por el nuevo denominador.",
  ),
  "7:percent-change": way(
    "Use one multiplier: an increase of p% multiplies the original by the whole plus p percent, and a decrease by the whole minus p percent.",
    "Usa un solo multiplicador: un aumento del p % multiplica el original por el total más el p por ciento, y una disminución por el total menos el p por ciento.",
  ),
  "7:scale-drawing": way(
    "Make a ratio table with drawing length on top and real length below, and scale the first column to the drawing length you have.",
    "Haz una tabla de razones con la longitud del dibujo arriba y la longitud real abajo, y escala la primera columna hasta la longitud del dibujo que tienes.",
  ),
  "7:equations": way(
    "Work backwards with a flow chart: write what is done to x in order, then undo each step from the end, starting with the result.",
    "Trabaja hacia atrás con un diagrama: escribe en orden lo que se le hace a x y luego deshaz cada paso desde el final, empezando por el resultado.",
  ),
  "7:inequalities": way(
    "Mark the boundary and the number to test on a number line. The picture shows at once which is greater.",
    "Marca el límite y el número que pruebas en una recta numérica. El dibujo muestra enseguida cuál es mayor.",
  ),
  "7:circle-area": way(
    "Picture the square built on the radius: its area is r × r. The circle holds a little more than three of those squares, which is why A = πr².",
    "Imagina el cuadrado construido sobre el radio: su área es r × r. El círculo contiene un poco más de tres de esos cuadrados; por eso A = πr².",
  ),
  "7:probability": way(
    "List or count every equally likely outcome first; that count is always the denominator. For center and spread, order the data first.",
    "Haz primero la lista o el conteo de todos los resultados igualmente probables; ese número siempre es el denominador. Para centro y dispersión, ordena primero los datos.",
  ),
  "7:like-terms": way(
    "Rewrite every subtraction as adding the opposite, then sort the terms into two groups, x-terms and constants, and add each group.",
    "Reescribe cada resta como sumar el opuesto, ordena los términos en dos grupos, términos con x y constantes, y suma cada grupo.",
  ),
  "7:circumference": way(
    "Before using the formula, sketch the circle and label the length you are given as a radius or a diameter; change it to a diameter if needed.",
    "Antes de usar la fórmula, dibuja el círculo y marca si la longitud dada es un radio o un diámetro; cámbiala a diámetro si hace falta.",
  ),
  "7:angle-facts": way(
    "Sketch the figure and mark which angles together make a straight line (180°) or a triangle (180°). Then subtract the known angles from that total.",
    "Dibuja la figura y marca qué ángulos juntos forman una recta (180°) o un triángulo (180°). Luego resta los ángulos conocidos de ese total.",
  ),
  "7:sampling": way(
    "Find how many times larger the population is than the sample, and multiply the sample count by that same number.",
    "Halla cuántas veces mayor es la población que la muestra y multiplica el conteo de la muestra por ese mismo número.",
  ),
  "8:exponents": way(
    "Build the power step by step: start with the base and multiply by it again for each step, keeping a running total.",
    "Construye la potencia paso a paso: empieza con la base y multiplícala otra vez en cada paso, llevando un total.",
  ),
  "8:powers-ten": way(
    "Write the number in a place-value chart and slide every digit one column per power of ten: left to make it larger, right to make it smaller.",
    "Escribe el número en una tabla de valor posicional y desliza cada cifra una columna por cada potencia de diez: a la izquierda para agrandarlo y a la derecha para achicarlo.",
  ),
  "8:square-roots": way(
    "Find two perfect squares the number sits between, then test the whole numbers between their roots by multiplying each by itself.",
    "Halla dos cuadrados perfectos entre los que está el número y prueba los enteros entre sus raíces multiplicando cada uno por sí mismo.",
  ),
  "8:linear-equations": way(
    "Picture a balance: remove the same constant from both pans, then split both pans into as many equal groups as the coefficient.",
    "Imagina una balanza: quita la misma constante de los dos platillos y luego reparte los dos platillos en tantos grupos iguales como indica el coeficiente.",
  ),
  "8:slope": way(
    "Sketch the two points and draw the slope triangle between them. Count the rise (up is positive) and the run (right is positive), then divide.",
    "Dibuja los dos puntos y traza el triángulo de pendiente entre ellos. Cuenta la subida (hacia arriba es positiva) y el avance (a la derecha es positivo) y luego divide.",
  ),
  "8:functions": way(
    "Make a small input-output table: start from the starting value (where x is zero) and add the rate once for each step of x, or subtract it for each step when x is negative.",
    "Haz una pequeña tabla de entrada y salida: empieza en el valor inicial (donde x es cero) y suma la tasa una vez por cada paso de x, o réstala por cada paso cuando x es negativa.",
  ),
  "8:systems": way(
    "x and y sit equally far from half of their sum. Start at half of x + y, then step up by half of x − y to reach x (and down by the same amount to reach y).",
    "x e y están a la misma distancia de la mitad de su suma. Empieza en la mitad de x + y y sube la mitad de x − y para llegar a x (y baja lo mismo para llegar a y).",
  ),
  "8:angle-relations": way(
    "Sketch the angles. If together they make a corner, they total 90°; along a line, 180°; across from each other at a crossing, they are equal.",
    "Dibuja los ángulos. Si juntos forman una esquina, suman 90°; sobre una recta, 180°; si están uno frente al otro en un cruce, son iguales.",
  ),
  "8:pythagorean": way(
    "Draw a square on each leg and find their areas. The square on the hypotenuse has their total area; its side is the hypotenuse.",
    "Dibuja un cuadrado sobre cada cateto y halla sus áreas. El cuadrado sobre la hipotenusa tiene el área total; su lado es la hipotenusa.",
  ),
  "8:association": way(
    "Compare the first half of the y-values with the second half: if the second half is clearly higher, positive; clearly lower, negative; neither, none.",
    "Compara la primera mitad de los valores de y con la segunda: si la segunda es claramente mayor, positiva; claramente menor, negativa; ninguna de las dos, ninguna.",
  ),
  "8:transformations": way(
    "Fold the grid along the mirror line in your mind: the image is the same distance from the line on the other side. Count squares to place it.",
    "Dobla mentalmente la cuadrícula por la recta espejo: la imagen queda a la misma distancia de la recta, del otro lado. Cuenta cuadros para ubicarla.",
  ),
  "8:scientific-ops": way(
    "Work in two lanes: one for the coefficients and one for the powers of ten. Finish each lane, then adjust so the coefficient is from 1 up to (not including) 10.",
    "Trabaja en dos carriles: uno para los coeficientes y otro para las potencias de diez. Termina cada carril y luego ajusta para que el coeficiente esté entre 1 y 10 (sin incluir el 10).",
  ),
  "8:volume-round": way(
    "Find the base area πr² first and write it down; then decide what the solid does with it: a cylinder uses all of it times the height, a cone one-third.",
    "Halla primero el área de la base πr² y anótala; luego decide qué hace el cuerpo con ella: un cilindro la usa completa por la altura y un cono, un tercio.",
  ),
  "8:transformations-move": way(
    "Track a corner of a paper square: slide it, turn the paper about the origin, or stretch the distance from the origin, and read where that corner lands.",
    "Sigue una esquina de un cuadrado de papel: deslízalo, gira el papel alrededor del origen o estira la distancia al origen, y lee dónde queda esa esquina.",
  ),
  "8:compare-functions": way(
    "Put both functions in the same form: write each as y = (rate)x + (start), or make a table for x = 0 and x = 1 and compare how much y grows.",
    "Pon las dos funciones en la misma forma: escribe cada una como y = (tasa)x + (inicio), o haz una tabla para x = 0 y x = 1 y compara cuánto crece y.",
  ),
};
