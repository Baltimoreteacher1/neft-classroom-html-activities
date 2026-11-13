// Spanish companions for the five current Representation Bridge models.
// Mathematical values come from the same integer/exact-fraction inputs as the English view.
import { fdec, frac, fstr } from './bridge-math.mjs';

const row = (label, ...cells) => ({ label, cells });
const sup = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
const times = (b, e) => Array(e).fill(b).join(' × ');
const minus = (n) => String(n).replace('-', '−');

export const BRIDGE_STATIC_ES = Object.freeze({
  title: 'Cómo se conectan las partes', lede: 'Todo lo que sigue usa los mismos números del modelo.',
  table: 'Tabla', equation: 'Ecuación', words: 'En palabras', check: 'Comprobación',
  test: 'Pon a prueba una idea', region: 'Tabla de valores equivalentes',
  predict: 'Primero predice.', yourPrediction: 'Tu predicción', yes: 'Sí', no: 'No',
  same: 'La relación se mantuvo igual', changed: 'La relación cambió',
  predicted: 'Predijiste', right: 'acertaste.', useful: 'esta vez no; aun así, es útil saberlo.',
  show: 'Mostrarlo en el modelo', again: 'Probar otra idea',
});

export function describeBridgeEs(bridge, values) {
  const [a, b, c] = values;
  if (bridge.key === 'ratio:mixer') {
    const rate = frac(a, b);
    return {
      table: { head: ['Lotes', 'Jugo (tazas)', 'Agua (tazas)'], rows: [1, 2, 3, 4].map((k) => row(`×${k}`, a * k, b * k)) },
      equation: { text: `${a} : ${b} = ${a * 2} : ${b * 2} = ${a * 3} : ${b * 3}`, note: `jugo ÷ agua = ${fstr(rate)}` },
      words: `Por cada ${a} tazas de jugo, hay ${b} tazas de agua. Al preparar más lotes, se mantienen ${fstr(rate)} tazas de jugo por cada taza de agua.`,
      invariant: `Jugo ÷ agua es ${fstr(rate)} en cada fila.`,
      a11y: `${a} tazas de jugo y ${b} tazas de agua. La razón es ${a} a ${b}, o ${fstr(rate)} tazas de jugo por cada taza de agua.`,
    };
  }
  if (bridge.key === 'percent:whole') {
    const whole = frac(b * 100, a), one = frac(b, a);
    return {
      table: { head: ['Porcentaje', 'Cantidad'], rows: [row('1%', fstr(one)), row(`${a}%`, b), row('100%', fstr(whole))] },
      equation: { text: `${b} ÷ ${fdec(frac(a, 100))} = ${fstr(whole)}`, note: `${fstr(whole)} × ${a}% = ${b}` },
      words: `${b} es el ${a}% del total. Cada 1% equivale a ${fstr(one)}, así que el 100% es ${fstr(whole)}.`,
      invariant: `${fstr(whole)} × ${a}% = ${b}`,
      a11y: `${b} es el ${a} por ciento del total. El uno por ciento es ${fstr(one)}. El total es ${fstr(whole)}.`,
    };
  }
  if (bridge.key === 'power:order') {
    const value = a ** b;
    return {
      table: { head: ['Factores', 'Como multiplicación repetida', 'Valor'], rows: [1, 2, 3, 4, 5].map((k) => row(`${a}${sup[k]}`, times(a, k), a ** k)) },
      equation: { text: `${times(a, b)} = ${a}${sup[b]} = ${value}`, note: `${a}${sup[b]} no es ${a} × ${b} = ${a * b}` },
      words: `La base ${a} se usa como factor ${b} ${b === 1 ? 'vez' : 'veces'}. La potencia ${a}${sup[b]} es igual a ${value}.`,
      invariant: `${times(a, b)} = ${value}${c ? `; después suma ${c}: ${value + c}` : ''}`,
      a11y: `${a} elevado a ${b} significa usar ${a} como factor ${b} veces: ${times(a, b)} es igual a ${value}.`,
    };
  }
  if (bridge.key === 'balance:add') {
    const x = b - a;
    return {
      table: { head: ['Paso', 'Lado izquierdo', 'Lado derecho'], rows: [row('Inicio', `x + ${a}`, b), row(`Resta ${a} a ambos lados`, 'x', minus(x)), row('Comprueba', `${minus(x)} + ${a}`, `${x + a} = ${b}`)] },
      equation: { text: `x + ${a} = ${b}  →  x = ${minus(x)}`, note: `${minus(x)} + ${a} = ${b}` },
      words: `x más ${a} es igual a ${b}. Restar ${a} a ambos lados conserva el equilibrio y deja x = ${minus(x)}.`,
      invariant: `${minus(x)} + ${a} = ${b}`,
      a11y: `La ecuación tiene x más ${a} a la izquierda y ${b} a la derecha. Restar ${a} a ambos lados da x igual a ${minus(x)}.`,
    };
  }
  if (bridge.key === 'area:triangle') {
    const whole = a * b, tri = frac(whole, 2);
    return {
      table: { head: ['Figura', 'Base', 'Altura', 'Área (unidades cuadradas)'], rows: [row('Paralelogramo', a, b, whole), row('Triángulo', a, b, fstr(tri))] },
      equation: { text: `A = ½ × ${a} × ${b} = ${fstr(tri)}`, note: `paralelogramo: ${a} × ${b} = ${whole}` },
      words: `Dos copias de este triángulo forman un paralelogramo con área ${whole}, así que un triángulo tiene ${fstr(tri)} unidades cuadradas.`,
      invariant: `2 × ${fstr(tri)} = ${whole}`,
      a11y: `Un triángulo con base ${a} y altura perpendicular ${b} tiene un área de ${fstr(tri)} unidades cuadradas, la mitad del área ${whole} del paralelogramo.`,
    };
  }
  throw new RangeError(`Missing Spanish Bridge description for ${bridge.key}.`);
}

export function bridgeWhyEs(bridge, values, id, param, result) {
  const [a, b] = values;
  if (bridge.key === 'ratio:mixer') {
    if (id === 'scale') return `Se multiplicaron ambas cantidades por ${param}, así que cada taza de jugo todavía corresponde a ${fstr(frac(b, a))} tazas de agua.`;
    if (id === 'add') return `Sumar ${param} a ambas cantidades cambió la razón de ${a}:${b} a ${result.after[0]}:${result.after[1]}. ${fstr(frac(a, b))} no es ${fstr(frac(result.after[0], result.after[1]))}. Las razones equivalentes se forman al multiplicar, no al sumar.`;
    return `Solo cambió el jugo, así que hay más jugo por cada taza de agua: ${fstr(frac(a, b))} cambió a ${fstr(frac(result.after[0], result.after[1]))}.`;
  }
  if (bridge.key === 'percent:whole') {
    const pct = a, part = b, tenths = Math.round(Number(param) * 10), guess = frac(tenths, 10);
    if (result.preserved) return `El ${pct}% de ${fdec(guess)} es ${part}, así que ${fdec(guess)} es el total.`;
    if (result.misconception === 'percent-of-part') return `${fdec(guess)} es el ${pct}% de ${part}. Pero ${part} ya es el ${pct}% del total; vuelve al 100% en vez de calcular el porcentaje de ${part}.`;
    if (result.misconception === 'whole-too-small') return `${fdec(guess)} es menor que la parte, ${part}. Una parte menor que el 100% debe ser menor que el total.`;
    return `El ${pct}% de ${fdec(guess)} es ${fdec(frac(tenths * pct, 1000))}, no ${part}.`;
  }
  if (bridge.key === 'power:order') {
    if (id === 'add-factor') return result.fits ? `Un factor más de ${a} multiplica el valor por ${a}: ${a ** b} × ${a} = ${a ** (b + 1)}.` : `Esta máquina ya tiene el máximo de factores que puede guardar (5).`;
    const value = a ** b, product = a * b;
    return `${a}${sup[b]} es ${times(a, b)} = ${value}. ${a} × ${b} suma ${a} ${b} veces y da ${product}. ${value === product ? 'Solo coinciden con estos números particulares.' : 'Son dos cálculos distintos.'}`;
  }
  if (bridge.key === 'balance:add') {
    const x = b - a;
    if (id === 'both') return `Restar ${a} a ambos lados da x = ${minus(x)}. Comprueba: ${minus(x)} + ${a} = ${b}.`;
    if (id === 'add-both') return `x + ${2 * a} = ${b + a} todavía está equilibrada y x sigue siendo ${minus(x)}. Conserva el equilibrio, pero no deja x sola.`;
    return `Restar ${a} solo del lado izquierdo da x = ${b}. Pero ${b} + ${a} = ${b + a}, no ${b}. La solución cambió porque los lados no recibieron el mismo cambio.`;
  }
  if (bridge.key === 'area:triangle') {
    const tri = frac(a * b, 2);
    if (id === 'slide') return `Deslizar el punto superior ${param} unidades conserva la base ${a} y la altura ${b}, así que el área sigue siendo ${fstr(tri)}. Cambian los lados inclinados, pero no la altura.`;
    if (param < b) return `Un lado inclinado de ${param} no puede ser más corto que la altura ${b}: la perpendicular es el camino más corto del punto superior a la base.`;
    const wrong = frac(a * param, 2);
    return result.preserved ? `Si un lado inclinado mide lo mismo que la altura, el punto superior queda justo sobre la base y ambos métodos dan ${fstr(tri)}.` : `Usar ${param} como altura da ${fstr(wrong)}, pero la altura perpendicular es ${b} y da ${fstr(tri)}. La altura debe ser perpendicular a la base.`;
  }
  throw new RangeError(`Missing Spanish Bridge explanation for ${bridge.key}:${id}.`);
}
