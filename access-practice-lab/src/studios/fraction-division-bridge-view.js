import { esc } from "../util.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const fraction = (numerator, denominator) =>
  denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

/** A problem-specific equal-parts model, sized by mathematical values, not a preset answer animation. */
export function fractionDivisionModelHTML(bridge, I) {
  const commonDenominator = lcm(bridge.dividendDenominator, bridge.divisorDenominator);
  const dividendUnits = bridge.dividendNumerator * (commonDenominator / bridge.dividendDenominator);
  const groupUnits = bridge.divisorNumerator * (commonDenominator / bridge.divisorDenominator);
  const quotientWholeGroups = Math.floor(dividendUnits / groupUnits);
  const remainingUnits = dividendUnits % groupUnits;
  const quotient = fraction(bridge.quotientNumerator, bridge.quotientDenominator);
  const maxUnits = Math.max(dividendUnits, groupUnits);
  const scale = 440 / maxUnits;
  const dividendWidth = dividendUnits * scale;
  const divisorWidth = groupUnits * scale;
  const tickCount = Math.min(commonDenominator, 44);
  const tickStep = dividendWidth / Math.min(dividendUnits, tickCount);
  const ticks = Array.from({ length: Math.max(0, Math.min(dividendUnits, tickCount) - 1) }, (_, index) => {
    const x = 30 + tickStep * (index + 1);
    return `<line x1="${x}" y1="48" x2="${x}" y2="70" stroke="#17324d" stroke-width="1"/>`;
  }).join("");
  const alt = I.S(
    `${bridge.dividendNumerator}/${bridge.dividendDenominator} divided by ${bridge.divisorNumerator}/${bridge.divisorDenominator}. With denominator ${commonDenominator}, the dividend has ${dividendUnits} equal units and one group has ${groupUnits}. The quotient is ${quotient}.`,
    `${bridge.dividendNumerator}/${bridge.dividendDenominator} dividido entre ${bridge.divisorNumerator}/${bridge.divisorDenominator}. Con denominador ${commonDenominator}, el dividendo tiene ${dividendUnits} partes iguales y cada grupo tiene ${groupUnits}. El cociente es ${quotient}.`,
  );
  return `<div class="mlb-model mlb-fraction-division-model">
    <h3>${I.T("Compare equal-sized pieces", "Compara partes del mismo tamaño")}</h3>
    <p><strong>${I.T("Dividend", "Dividendo")}: ${bridge.dividendNumerator}/${bridge.dividendDenominator}</strong> ${I.T("and divisor (one group)", "y divisor (un grupo)")}: <strong>${bridge.divisorNumerator}/${bridge.divisorDenominator}</strong></p>
    <svg viewBox="0 0 520 154" role="img" aria-label="${esc(alt)}">
      <text x="30" y="22" font-size="13" font-weight="700" fill="#17324d">${I.T("Total amount", "Cantidad total")}</text>
      <rect x="30" y="34" width="${dividendWidth}" height="36" rx="4" fill="#bfe7df" stroke="#17324d" stroke-width="2"/>${ticks}
      <text x="30" y="86" font-size="13" font-weight="700" fill="#17324d">${I.T("One group", "Un grupo")}</text>
      <rect x="30" y="96" width="${divisorWidth}" height="30" rx="4" fill="#f2c15b" stroke="#17324d" stroke-width="2" opacity="0.85"/>
      <text x="30" y="147" font-size="12" fill="#17324d">${I.T("Same-sized pieces", "Partes del mismo tamaño")}: 1/${commonDenominator} · ${I.T("quotient", "cociente")}: ${quotient}</text>
    </svg>
    <table><caption>${I.T("Connect the strip to the equation", "Relaciona la barra con la ecuación")}</caption><thead><tr><th scope="col">${I.T("Step", "Paso")}</th><th scope="col">${I.T("Reasoning", "Razonamiento")}</th></tr></thead><tbody>
      <tr><th scope="row">${I.T("Same-sized parts", "Partes del mismo tamaño")}</th><td>${bridge.dividendNumerator}/${bridge.dividendDenominator} = ${dividendUnits}/${commonDenominator}; ${bridge.divisorNumerator}/${bridge.divisorDenominator} = ${groupUnits}/${commonDenominator}</td></tr>
      <tr><th scope="row">${I.T("Groups that fit", "Grupos que caben")}</th><td>${dividendUnits} ÷ ${groupUnits} = ${quotientWholeGroups} ${I.T("whole groups", "grupos completos")}${remainingUnits ? ` ${I.T("and", "y")} ${remainingUnits}/${groupUnits} ${I.T("of one more group", "de un grupo más")}` : ""}; ${I.T("exact quotient", "cociente exacto")} ${quotient}</td></tr>
      <tr><th scope="row">${I.T("Reciprocal connection", "Relación con el recíproco")}</th><td>${bridge.dividendNumerator}/${bridge.dividendDenominator} × ${bridge.divisorDenominator}/${bridge.divisorNumerator} = ${quotient}</td></tr>
      <tr><th scope="row">${I.T("Check", "Comprobación")}</th><td>${quotient} × ${bridge.divisorNumerator}/${bridge.divisorDenominator} = ${bridge.dividendNumerator}/${bridge.dividendDenominator}</td></tr>
    </tbody></table>
    <p><strong>${I.T("The quotient tells how many divisor-sized groups fit in the dividend.", "El cociente indica cuántos grupos del tamaño del divisor caben en el dividendo.")}</strong></p>
  </div>`;
}
