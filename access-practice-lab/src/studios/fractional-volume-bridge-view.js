import { esc } from "../util.js";

const halfFeet = (halves) => halves % 2 ? `${Math.floor(halves / 2) ? `${Math.floor(halves / 2)} ` : ""}1/2` : String(halves / 2);

/** An accessible, problem-specific model for the Language Page's volume explanation task. */
export function fractionalVolumeModelHTML(bridge, I) {
  const { lengthHalves, widthHalves, heightHalves, volumeEighths, volumeCubicFeet } = bridge;
  const totalCubes = volumeEighths;
  const volumeText = volumeCubicFeet % 1
    ? `${Math.floor(volumeCubicFeet) ? `${Math.floor(volumeCubicFeet)} ` : ""}${(volumeCubicFeet % 1) * 8}/8`
    : String(volumeCubicFeet);
  const alt = I.S(
    `A rectangular prism measuring ${halfFeet(lengthHalves)} by ${halfFeet(widthHalves)} by ${halfFeet(heightHalves)} feet. Each half-foot cube is 1/8 cubic foot. ${lengthHalves * widthHalves} cubes fill one layer, with ${heightHalves} layers, for ${totalCubes} cubes and a volume of ${volumeText} cubic feet.`,
    `Un prisma rectangular de ${halfFeet(lengthHalves)} por ${halfFeet(widthHalves)} por ${halfFeet(heightHalves)} pies. Cada cubo de medio pie equivale a 1/8 de pie cúbico. ${lengthHalves * widthHalves} cubos llenan una capa y hay ${heightHalves} capas: ${totalCubes} cubos y un volumen de ${volumeText} pies cúbicos.`,
  );
  return `<div class="mlb-model mlb-volume-model">
    <h3>${I.T("Build volume from half-foot cubes", "Construye el volumen con cubos de medio pie")}</h3>
    <svg class="mlb-volume-cube-svg" viewBox="0 0 360 150" role="img" aria-label="${esc(alt)}">
      <polygon points="42,54 97,25 152,54 97,83" fill="#d8f0ec" stroke="#17324d" stroke-width="2"/>
      <polygon points="42,54 97,83 97,130 42,101" fill="#45a89b" stroke="#17324d" stroke-width="2"/>
      <polygon points="97,83 152,54 152,101 97,130" fill="#258c85" stroke="#17324d" stroke-width="2"/>
      <text x="97" y="146" text-anchor="middle" font-size="10" font-weight="800" fill="#17324d">1/2 ft per edge · 1/8 ft³</text>
      <text x="254" y="62" text-anchor="middle" font-size="14" font-weight="800" fill="#17324d">${lengthHalves} × ${widthHalves} cubes</text>
      <text x="254" y="84" text-anchor="middle" font-size="12" fill="#17324d">× ${heightHalves} ${I.T("layers", "capas")}</text>
      <text x="254" y="112" text-anchor="middle" font-size="16" font-weight="900" fill="#157a70">${volumeEighths}/8 ft³ = ${volumeText} ft³</text>
    </svg>
    <table><caption>${I.T("Connect each dimension to the unit cubes", "Relaciona cada dimensión con los cubos unitarios")}</caption><thead><tr><th scope="col">${I.T("Relationship", "Relación")}</th><th scope="col">${I.T("Value", "Valor")}</th></tr></thead><tbody>
      <tr><th scope="row">${I.T("Edge lengths", "Largos de las aristas")}</th><td>${halfFeet(lengthHalves)} × ${halfFeet(widthHalves)} × ${halfFeet(heightHalves)} ft</td></tr>
      <tr><th scope="row">${I.T("Half-foot cubes in one layer", "Cubos de medio pie en una capa")}</th><td>${lengthHalves} × ${widthHalves} = ${lengthHalves * widthHalves}</td></tr>
      <tr><th scope="row">${I.T("Layers", "Capas")}</th><td>${heightHalves}</td></tr>
      <tr><th scope="row">${I.T("Total unit cubes", "Cubos unitarios en total")}</th><td>${totalCubes}; each cube is 1/8 ft³</td></tr>
    </tbody></table>
    <p><strong>${I.T("Volume", "Volumen")}: ${lengthHalves} × ${widthHalves} × ${heightHalves} eighth-cubic-foot units = ${volumeEighths}/8 = ${volumeText} ft³</strong></p>
  </div>`;
}
