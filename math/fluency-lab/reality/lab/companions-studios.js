// Family companions for the skill studios. A studio skill reuses the family text for its model (ten-frame, place-value
// mat, rectangle, same-size pieces, balance, line, chips, number line), with the skill's own title and its next step in
// the learner's journey. Every line is bilingual and none states the answer to a practice problem.
import { L } from "./kernel.js";

const T = (en, es) => L(en, es);

export const STUDIO_FAMILY = {
  tenframe: {
    why: T("Seeing numbers inside a ten-frame builds the quick, flexible number sense that all later math uses.", "Ver los números dentro de un marco de diez construye el sentido numérico rápido y flexible que se usa en toda la matemática."),
    talk: [T("How many counters are there? How do you know without counting one by one?", "¿Cuántas fichas hay? ¿Cómo lo sabes sin contar una por una?"), T("How many more fill the frame to ten?", "¿Cuántas más llenan el marco hasta diez?"), T("Can you show it a different way with the same total?", "¿Puedes mostrarlo de otra manera con el mismo total?")],
    practice: T("Put 6 counters in the frame. Then add counters until it is full. Say the number sentence you made.", "Pon 6 fichas en el marco. Luego agrega fichas hasta llenarlo. Di la oración numérica que hiciste."),
    watch: T("Counting from one every time is slow. Ask: can you see a group you already know?", "Contar desde uno cada vez es lento. Pregunta: ¿ves un grupo que ya conoces?"),
    independent: T("Show 7 and 5 in two frames. How many in all?", "Muestra 7 y 5 en dos marcos. ¿Cuántas hay en total?"),
  },
  place: {
    why: T("Place value is why 10 ones make a ten. It is the base of every multi-digit calculation.", "El valor posicional es la razón por la que 10 unidades forman una decena. Es la base de todo cálculo de varios dígitos."),
    talk: [T("What does each piece stand for? Which place is it in?", "¿Qué representa cada pieza? ¿En qué lugar está?"), T("What happens when you have ten of the same piece?", "¿Qué pasa cuando tienes diez de la misma pieza?"), T("When do you need to break a ten apart?", "¿Cuándo necesitas descomponer una decena?")],
    practice: T("Build 34 with tens and ones. Then trade so there are 3 tens and 4 ones, and read the number.", "Construye 34 con decenas y unidades. Luego cambia para tener 3 decenas y 4 unidades, y lee el número."),
    watch: T("Digits in different places are not worth the same. Ask: what is this digit worth here?", "Los dígitos en lugares distintos no valen lo mismo. Pregunta: ¿cuánto vale este dígito aquí?"),
    independent: T("Add two numbers with a mat. Say when you had to trade ten for one.", "Suma dos números con un tablero. Di cuándo tuviste que cambiar diez por uno."),
  },
  decimal: {
    why: T("Decimals are how we write money and measurements, so reading them by place value matters every day.", "Los decimales son como escribimos el dinero y las medidas, así que leerlos por valor posicional importa cada día."),
    talk: [T("Which is bigger, a tenth or a hundredth? How do you know?", "¿Cuál es mayor, un décimo o un centésimo? ¿Cómo lo sabes?"), T("How many hundredths make a tenth?", "¿Cuántos centésimos forman un décimo?"), T("Is your answer more than each number you started with?", "¿Tu respuesta es mayor que cada número con el que empezaste?")],
    practice: T("Build 0.3 and 0.25 with tenths and hundredths. Join them and trade until nothing is ten or more.", "Construye 0.3 y 0.25 con décimos y centésimos. Únelos y cambia hasta que nada sea diez o más."),
    watch: T("Lining digits up from the right can mix up places. Ask: which place is each digit in?", "Alinear los dígitos desde la derecha puede mezclar los lugares. Pregunta: ¿en qué lugar está cada dígito?"),
    independent: T("Subtract 0.18 from 1.4 with the mat.", "Resta 0.18 de 1.4 con el tablero."),
  },
  area: {
    why: T("Rows and columns of equal groups are the picture behind multiplication, division and area.", "Las filas y columnas de grupos iguales son la imagen detrás de la multiplicación, la división y el área."),
    talk: [T("How many rows? How many in each row? How many in all?", "¿Cuántas filas? ¿Cuántos hay en cada fila? ¿Cuántos hay en total?"), T("What happens to the total if you add one more row?", "¿Qué pasa con el total si agregas una fila más?"), T("Can you make the same total with a different rectangle?", "¿Puedes hacer el mismo total con otro rectángulo?")],
    practice: T("Make a rectangle 3 rows by 4 columns. Then turn it so it is 4 rows by 3 columns. Is the total the same?", "Haz un rectángulo de 3 filas por 4 columnas. Luego gíralo para que sea de 4 filas por 3 columnas. ¿El total es el mismo?"),
    watch: T("Adding the sides is not the same as multiplying them. Ask: are you counting squares or the edge?", "Sumar los lados no es lo mismo que multiplicarlos. Pregunta: ¿cuentas cuadros o el borde?"),
    independent: T("Make a rectangle with 18 squares in a different shape than your first one.", "Haz un rectángulo con 18 cuadros en una forma distinta de la primera."),
  },
  fracadd: {
    why: T("You can only count pieces together when they are the same size. That idea is behind adding and comparing fractions.", "Solo puedes contar piezas juntas cuando son del mismo tamaño. Esa idea está detrás de sumar y comparar fracciones."),
    talk: [T("Are the pieces the same size yet? What could you do to make them match?", "¿Las piezas ya son del mismo tamaño? ¿Qué podrías hacer para que coincidan?"), T("How many pieces are there in all now?", "¿Cuántas piezas hay en total ahora?"), T("Which bar has more? How can you tell?", "¿Qué barra tiene más? ¿Cómo lo sabes?")],
    practice: T("Show 1/2 and 1/3 as two bars. Cut both until the pieces match, then say what you see.", "Muestra 1/2 y 1/3 como dos barras. Corta ambas hasta que las piezas coincidan y di lo que ves."),
    watch: T("Adding the tops and the bottoms gives the wrong size. Ask: are the pieces the same size?", "Sumar los numeradores y los denominadores da un tamaño equivocado. Pregunta: ¿las piezas son del mismo tamaño?"),
    independent: T("Find 1/4 + 1/6 with bars. Tell why the pieces had to match.", "Halla 1/4 + 1/6 con barras. Di por qué las piezas tenían que coincidir."),
  },
  balance: {
    why: T("Solving an equation means keeping both sides equal. The scale makes that idea something you can see.", "Resolver una ecuación significa mantener ambos lados iguales. La balanza hace que esa idea se pueda ver."),
    talk: [T("What happens to the scale if you take something from only one side?", "¿Qué le pasa a la balanza si quitas algo de un solo lado?"), T("What can you do to both sides to find what x weighs?", "¿Qué puedes hacer en ambos lados para hallar cuánto pesa x?"), T("How can you check your answer?", "¿Cómo puedes comprobar tu respuesta?")],
    practice: T("Put x + 2 on one side and 7 on the other. Take 2 from each side. What is left?", "Pon x + 2 en un lado y 7 en el otro. Quita 2 de cada lado. ¿Qué queda?"),
    watch: T("Changing only one side breaks the balance. Ask: did both sides change the same way?", "Cambiar solo un lado rompe el equilibrio. Pregunta: ¿los dos lados cambiaron igual?"),
    independent: T("Solve 3x + 1 = 13 on the scale, then put your x back in to check.", "Resuelve 3x + 1 = 13 en la balanza y luego pon tu x de nuevo para comprobar."),
  },
  graph: {
    why: T("Lines on a graph show how one quantity changes with another, from speed to savings.", "Las rectas en una gráfica muestran cómo cambia una cantidad con otra, desde la rapidez hasta los ahorros."),
    talk: [T("When you move a point, what changes about the line?", "Cuando mueves un punto, ¿qué cambia en la recta?"), T("How far up does it go for each step to the right?", "¿Cuánto sube por cada paso a la derecha?"), T("Where does the line cross the vertical axis?", "¿Dónde cruza la recta el eje vertical?")],
    practice: T("Put one point at (0, 0) and another at (1, 2). Say how the line goes up for each step right.", "Pon un punto en (0, 0) y otro en (1, 2). Di cuánto sube la recta por cada paso a la derecha."),
    watch: T("Slope is rise over run, not run over rise. Ask: which direction did you count first?", "La pendiente es subida sobre avance, no al revés. Pregunta: ¿qué dirección contaste primero?"),
    independent: T("Make a line that goes down as you move right. What is its slope's sign?", "Haz una recta que baje al moverte a la derecha. ¿Cuál es el signo de su pendiente?"),
  },
  chips: {
    why: T("Positive and negative chips make signed numbers concrete. A pair of opposite chips cancels to zero.", "Las fichas positivas y negativas hacen concretos los números con signo. Un par de fichas opuestas se cancela a cero."),
    talk: [T("What does one positive chip and one negative chip make together?", "¿Qué forman juntas una ficha positiva y una negativa?"), T("After you remove the pairs, what is left?", "Después de quitar los pares, ¿qué queda?"), T("Does the answer have more positive or more negative chips?", "¿La respuesta tiene más fichas positivas o más negativas?")],
    practice: T("Show 3 positive and 5 negative chips. Remove the zero pairs. What is left, and what number is it?", "Muestra 3 fichas positivas y 5 negativas. Quita los pares cero. ¿Qué queda y qué número es?"),
    watch: T("Two negatives together do not cancel. Ask: are these chips opposites?", "Dos negativos juntos no se cancelan. Pregunta: ¿estas fichas son opuestas?"),
    independent: T("Show −4 + 6 with chips and read the answer.", "Muestra −4 + 6 con fichas y lee la respuesta."),
  },
  hops: {
    why: T("The number line shows counting, adding and measuring as equal steps along a path.", "La recta numérica muestra contar, sumar y medir como pasos iguales a lo largo de un camino."),
    talk: [T("How big is each hop? How many hops did you take?", "¿Qué tan grande es cada salto? ¿Cuántos saltos diste?"), T("Where will you land after one more hop?", "¿Dónde caerás después de un salto más?"), T("What number sentence matches your hops?", "¿Qué oración numérica coincide con tus saltos?")],
    practice: T("Start at 0 and hop by 5 four times. Say each place you land.", "Empieza en 0 y salta de 5 en 5 cuatro veces. Di cada lugar donde caes."),
    watch: T("Counting the starting number as a hop gives one too many. Ask: are you counting jumps or the points?", "Contar el número de inicio como un salto da uno de más. Pregunta: ¿cuentas saltos o puntos?"),
    independent: T("Hop by 10 to get from 20 to 70. How many hops?", "Salta de 10 en 10 para ir de 20 a 70. ¿Cuántos saltos?"),
  },
};

// The companion for one studio skill, in the same shape as the flagship companions.
export function studioCompanion(template, skillTitle, nextExpId) {
  const f = STUDIO_FAMILY[template];
  if (!f) return null;
  return {
    goal: T(`Build and explain this idea with a model: ${skillTitle}.`, `Construir y explicar esta idea con un modelo: ${skillTitle}.`),
    why: f.why, talk: f.talk, practice: f.practice, watch: f.watch, independent: f.independent, next: nextExpId,
  };
}
