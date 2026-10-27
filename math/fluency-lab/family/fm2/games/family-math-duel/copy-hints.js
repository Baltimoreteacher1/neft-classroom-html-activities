// Hint wording for Family Math Duel. Tiers 0 and 1 never use a digit, so they cannot state a value from the hand;
// tier 2 works a different hand; tier 3 (Show me) gives the full play. @fm2 FM-016 FM-020 FM-062
const S = (en, es) => ({ en, es });

export const T0 = {
  max: S(
    "Read the goal again. Which cards would make your result as big as possible?",
    "Lee la meta otra vez. ¿Qué cartas harían tu resultado lo más grande posible?",
  ),
  min: S(
    "Read the goal again. Which cards would make your result as small as possible?",
    "Lee la meta otra vez. ¿Qué cartas harían tu resultado lo más pequeño posible?",
  ),
  closest: S(
    "A target means distance matters. Which cards could bring your result near it?",
    "Una meta significa que importa la distancia. ¿Qué cartas acercarían tu resultado a ella?",
  ),
};
export const T0_PRIVATE = S(
  "You only have your own cards, so think about where each one goes.",
  "Solo tienes tus propias cartas, así que piensa en dónde va cada una.",
);
export const T0_OPEN = S(
  "Taking a card also leaves it out of the other player's reach, so choose with both of you in mind.",
  "Al tomar una carta también se la quitas al otro jugador, así que elige pensando en los dos.",
);

export const T1 = {
  "single-max": S(
    "Compare the cards one at a time. For fractions and decimals, turn them into the same kind of number before you decide which is greatest.",
    "Compara las cartas una por una. Con fracciones y decimales, conviértelos al mismo tipo de número antes de decidir cuál es el mayor.",
  ),
  "sum2-max": S(
    "In a sum every card counts the same way, so take the biggest cards you can. With fractions and decimals, compare them first.",
    "En una suma todas las cartas cuentan igual, así que toma las cartas más grandes que puedas. Con fracciones y decimales, compáralas primero.",
  ),
  "sum3-max": S(
    "In a sum every card counts the same way, so take the biggest cards you can.",
    "En una suma todas las cartas cuentan igual, así que toma las cartas más grandes que puedas.",
  ),
  "sum2-closest": S(
    "Think about what the second card must be, once the first is chosen, to land near the target. Leave yourself a partner card that fits.",
    "Piensa en cómo debe ser la segunda carta, una vez elegida la primera, para quedar cerca de la meta. Déjate una carta compañera que sirva.",
  ),
  "sum3-closest": S(
    "Pick the card that gets you part of the way, then see which two cards left can finish the job near the target.",
    "Elige la carta que te acerca un poco y mira qué dos cartas que quedan pueden completar el trabajo cerca de la meta.",
  ),
  "sum4-closest": S(
    "Pick cards that get you part of the way, and keep options open for the last card.",
    "Elige cartas que te acerquen poco a poco y deja abiertas opciones para la última carta.",
  ),
  "sum3-max-neg": S(
    "Adding a negative card lowers your total, so use the positive cards when you can.",
    "Sumar una carta negativa baja tu total, así que usa las cartas positivas cuando puedas.",
  ),
  "sum3-closest-neg": S(
    "Pair a positive card with a negative card of about the same size so they nearly cancel, then fix what is left with the third card.",
    "Combina una carta positiva con una negativa de tamaño parecido para que casi se cancelen, y arregla lo que queda con la tercera carta.",
  ),
  "sum4-closest-neg": S(
    "Pair cards of opposite signs and similar size so they nearly cancel, and use the last cards to fix what is left.",
    "Combina cartas de signos opuestos y tamaño parecido para que casi se cancelen, y usa las últimas cartas para arreglar lo que queda.",
  ),
  "num2-max": S(
    "The place decides the worth, so put the biggest digit in the highest place.",
    "El lugar decide el valor, así que pon el dígito más grande en el lugar más alto.",
  ),
  "num3-max": S(
    "The place decides the worth, so put the biggest digit in the highest place.",
    "El lugar decide el valor, así que pon el dígito más grande en el lugar más alto.",
  ),
  "num4-max": S(
    "The place decides the worth, so put the biggest digit in the highest place.",
    "El lugar decide el valor, así que pon el dígito más grande en el lugar más alto.",
  ),
  "num3-closest": S(
    "Choose the first digit so the number begins like the target, then fill the other places to fine-tune it.",
    "Elige el primer dígito para que el número empiece como la meta y luego llena los otros lugares para ajustarlo.",
  ),
  "num4-closest": S(
    "Choose the first digit so the number begins like the target, then fill the other places to fine-tune it.",
    "Elige el primer dígito para que el número empiece como la meta y luego llena los otros lugares para ajustarlo.",
  ),
  "dsum2-max": S(
    "Each number is tens and ones. The tens places are worth more, so give them the biggest digits.",
    "Cada número tiene decenas y unidades. Las decenas valen más, así que dales los dígitos más grandes.",
  ),
  "dsum2-closest": S(
    "Estimate with the tens first: choose tens digits that land near the target, then use the ones digits to fine-tune.",
    "Estima primero con las decenas: elige dígitos de decenas que queden cerca de la meta y usa las unidades para ajustar.",
  ),
  "ddiff2-max": S(
    "For the biggest difference make one number as big as you can and the other as small as you can.",
    "Para la mayor diferencia haz un número lo más grande posible y el otro lo más pequeño posible.",
  ),
  "prod2-max": S(
    "Multiply the biggest cards together. Check a couple of pairs before you commit.",
    "Multiplica entre sí las cartas más grandes. Revisa un par de combinaciones antes de decidir.",
  ),
  "prod2-closest": S(
    "Estimate with friendly numbers: which pair of cards multiplies to something near the target?",
    "Estima con números amigables: ¿qué par de cartas se multiplica y queda cerca de la meta?",
  ),
  "prod2-max-neg": S(
    "Negative factors multiplied together make a positive product, so a big negative card can help as much as a big positive one.",
    "Los factores negativos multiplicados entre sí dan un producto positivo, así que una carta negativa grande puede ayudar tanto como una positiva grande.",
  ),
  "prod2-min-neg": S(
    "A negative times a positive is negative. For the smallest product, pair a big negative card with a big positive one.",
    "Un negativo por un positivo es negativo. Para el producto más pequeño, junta una carta negativa grande con una positiva grande.",
  ),
  "prodsum-max": S(
    "Multiply the first two cards, then add the third. The product usually matters most.",
    "Multiplica las dos primeras cartas y suma la tercera. El producto suele importar más.",
  ),
  "prodsum-closest": S(
    "Multiply the first two cards, then add the third. Try pairs for the product, then use the third card to fine-tune.",
    "Multiplica las dos primeras cartas y suma la tercera. Prueba pares para el producto y usa la tercera carta para ajustar.",
  ),
  "paren-max": S(
    "Add inside the parentheses first, then multiply. Think about which card is best outside the parentheses.",
    "Primero suma dentro de los paréntesis y luego multiplica. Piensa qué carta conviene más fuera de los paréntesis.",
  ),
  "ops3-closest": S(
    "Multiplication comes before addition and subtraction. Try a couple of arrangements and work each one out before you decide.",
    "La multiplicación va antes que la suma y la resta. Prueba un par de arreglos y calcula cada uno antes de decidir.",
  ),
  "frac2-min": S(
    "A fraction is small when its numerator is small and its denominator is big.",
    "Una fracción es pequeña cuando su numerador es pequeño y su denominador es grande.",
  ),
  "frac2-closest": S(
    "A fraction near a half has a denominator about double its numerator. Test pairs of cards against that.",
    "Una fracción cercana a un medio tiene un denominador de más o menos el doble de su numerador. Prueba pares de cartas con esa idea.",
  ),
  "fracdiv-min": S(
    "Dividing by a fraction means multiplying by its flip. For the smallest result, make the parts that end up on top small and the parts that end up underneath big.",
    "Dividir entre una fracción es multiplicar por su inversa. Para el resultado más pequeño, haz pequeñas las partes que quedan arriba y grandes las que quedan abajo.",
  ),
  "pct-max": S(
    "A percent of a number grows with both parts. Check which pairing gives the biggest part.",
    "El porcentaje de un número crece con las dos partes. Revisa qué pareja da la parte más grande.",
  ),
  "pct-closest": S(
    "Start with an easy percent, like a tenth of the number (just move the decimal point), then build up to the percent you need.",
    "Empieza con un porcentaje fácil, como la décima parte del número (solo mueve el punto decimal), y construye hasta el porcentaje que necesitas.",
  ),
  "pow-max": S(
    "Try each base with each exponent and compare the results before you commit. Neither a big base nor a big exponent always wins.",
    "Prueba cada base con cada exponente y compara los resultados antes de decidir. Ni la base grande ni el exponente grande ganan siempre.",
  ),
  "pow-min": S(
    "A negative exponent puts the power in the denominator, so for a small value you want a big power underneath.",
    "Un exponente negativo pone la potencia en el denominador, así que para un valor pequeño quieres una potencia grande abajo.",
  ),
  "powsum-closest": S(
    "Work out each power separately, add them, and measure how far the sum is from the target.",
    "Calcula cada potencia por separado, súmalas y mide qué tan lejos queda la suma de la meta.",
  ),
  "sci-max": S(
    "Compare the exponents of ten first. When every front number has a single digit before the decimal point, the bigger exponent means the bigger number.",
    "Compara primero los exponentes de diez. Cuando cada número del frente tiene un solo dígito antes del punto decimal, el exponente mayor da el número mayor.",
  ),
  "sci-min": S(
    "Compare the exponents of ten first. When every front number has a single digit before the decimal point, the smaller exponent means the smaller number.",
    "Compara primero los exponentes de diez. Cuando cada número del frente tiene un solo dígito antes del punto decimal, el exponente menor da el número menor.",
  ),
  "sci-closest": S(
    "Estimate the size from the exponent of ten, then use the front number to fine-tune.",
    "Estima el tamaño con el exponente de diez y usa el número del frente para ajustar.",
  ),
  "root2-max": S(
    "A bigger number under the root gives a bigger root, so take the biggest perfect squares.",
    "Un número mayor dentro de la raíz da una raíz mayor, así que toma los cuadrados perfectos más grandes.",
  ),
  "root2-closest": S(
    "Find each square root, then see which pair of roots adds up near the target.",
    "Halla cada raíz cuadrada y mira qué par de raíces suma cerca de la meta.",
  ),
  "root3-closest": S(
    "Find each square root, then see which three roots add up near the target.",
    "Halla cada raíz cuadrada y mira qué tres raíces suman cerca de la meta.",
  ),
};

export const T1_GENERIC = {
  max: S(
    "Try the likely placements and work out each value before you decide which is biggest.",
    "Prueba las colocaciones probables y calcula cada valor antes de decidir cuál es el mayor.",
  ),
  min: S(
    "Try the likely placements and work out each value before you decide which is smallest.",
    "Prueba las colocaciones probables y calcula cada valor antes de decidir cuál es el menor.",
  ),
  closest: S(
    "Try the likely placements and work out how far each value is from the target.",
    "Prueba las colocaciones probables y calcula a qué distancia de la meta queda cada valor.",
  ),
};

export const T2 = S(
  "Try it on a different hand. The cards: {cards}. The goal: {goal} A strong play there is {expr} = {value}. Now use the same thinking on your own cards.",
  "Pruébalo con otra mano. Las cartas: {cards}. La meta: {goal} Una buena jugada allí es {expr} = {value}. Ahora usa el mismo razonamiento con tus cartas.",
);
export const T2_PLAIN = S(
  "Practice the thinking on a simpler hand: write the value of each way to place your cards, then compare each one with the goal.",
  "Practica el razonamiento con una mano más sencilla: escribe el valor de cada forma de colocar tus cartas y compara cada una con la meta.",
);
export const T3 = S(
  "One strong play on this hand: you make {e0} = {v0}. The other player's best-looking reply makes {e1} = {v1}. {outcome}",
  "Una buena jugada en esta mano: tú formas {e0} = {v0}. La mejor respuesta del otro jugador forma {e1} = {v1}. {outcome}",
);
export const OUTCOME = {
  0: S("That wins the hand for you.", "Eso te da la victoria en la mano."),
  1: S(
    "That one wins the hand, so look for a better placement next time.",
    "Esa gana la mano, así que busca una colocación mejor la próxima vez.",
  ),
  2: S("That makes the hand a tie.", "Eso deja la mano en empate."),
};
