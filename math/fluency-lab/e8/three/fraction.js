import {
  THREE,
  copyFor,
  createStage,
  listenForTap,
  pickFromCanvas,
  stageBase,
  standardMaterial,
} from "./runtime.js";

const CAPACITY = 48;
const selectedColor = new THREE.Color("#1fa6a2");
const openColor = new THREE.Color("#fffdf7");
const edgeColor = new THREE.Color("#17324d");

export function mount(slot, { lang = "en", onAction = () => {} } = {}) {
  const stage = createStage(slot, {
    id: "fraction-construction",
    lang,
    label: copyFor(lang, "Fraction construction studio: a rotatable bar made of equal pieces", "Estudio de construcción de fracciones: una barra giratoria formada por partes iguales"),
    help: copyFor(lang, "Tap a piece to shade it. Rotate the table with one finger or mouse drag. Use the piece buttons for keyboard control.", "Toca una parte para sombrearla. Gira la mesa con un dedo o arrastrando el ratón. Usa los botones para controlar las partes con el teclado."),
    extraControls: [
      { id: "fraction-refine", label: copyFor(lang, "Split each part ×2", "Dividir cada parte ×2") },
      { id: "fraction-simplify", label: copyFor(lang, "Group equal parts", "Agrupar partes iguales") },
    ],
    onStageAction(action) {
      if (action === "fraction-refine") onAction({ type: "refine", by: 2 });
      if (action === "fraction-simplify") onAction({ type: "simplify" });
    },
  });

  const { scene } = stage;
  const owned = stageBase(scene, { width: 6.8, depth: 2.7 });
  const bar = new THREE.Group();
  scene.add(bar);
  const pieceGeometry = new THREE.BoxGeometry(1, 0.32, 0.78);
  const pieces = new THREE.InstancedMesh(
    pieceGeometry,
    standardMaterial("#ffffff", { roughness: 0.3, metalness: 0.08 }),
    CAPACITY,
  );
  pieces.count = CAPACITY;
  pieces.castShadow = false;
  pieces.receiveShadow = false;
  pieces.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bar.add(pieces);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const rails = new THREE.Group();
  bar.add(rails);
  const railMaterial = standardMaterial("#17324d", { roughness: 0.45 });
  const railGeometry = new THREE.BoxGeometry(0.08, 0.18, 0.96);
  const railsOwned = [railMaterial, railGeometry];
  for (const x of [-2.5, 2.5]) {
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(x, 0.05, 0);
    rails.add(rail);
  }
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(5.3, 0.13, 1.12),
    standardMaterial("#d9e7e4", { roughness: 0.7 }),
  );
  tray.position.y = -0.19;
  scene.add(tray);
  const centerMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.025, 0.9),
    standardMaterial("#f2c15b", { roughness: 0.4 }),
  );
  centerMarker.position.set(0, -0.11, 0);
  scene.add(centerMarker);

  const pieceList = document.createElement("details");
  pieceList.className = "e8ml-three-parts";
  pieceList.innerHTML = `<summary>${copyFor(lang, "Choose a piece with buttons", "Elige una parte con botones")}</summary><div class="e8ml-three-piece-list" role="group" aria-label="${copyFor(lang, "Fraction pieces", "Partes de la fracción")}"></div>`;
  stage.wrapper.append(pieceList);
  const pieceButtons = pieceList.querySelector(".e8ml-three-piece-list");
  let current = { n: 1, d: 2 };
  let lastAction = "";

  const paintParts = () => {
    pieceButtons.replaceChildren();
    for (let index = 0; index < current.d; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "e8ml-three-piece";
      button.dataset.fractionPiece = String(index);
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", copyFor(lang, `Part ${index + 1} of ${current.d}${index < current.n ? ", shaded" : ", not shaded"}`, `Parte ${index + 1} de ${current.d}${index < current.n ? ", sombreada" : ", sin sombrear"}`));
      button.setAttribute("aria-pressed", String(index < current.n));
      button.addEventListener("click", () => onAction({ type: "toggle", index }));
      pieceButtons.append(button);
    }
  };

  const update = ({ state = current, derived, description } = {}) => {
    current = state;
    if (!Number.isInteger(current.d) || current.d < 1 || current.d > CAPACITY || current.n < 0 || current.n > current.d)
      throw new Error("Fraction state is outside the 3D model's supported range");
    const width = 5 / current.d;
    for (let index = 0; index < CAPACITY; index += 1) {
      const visible = index < current.d;
      const partWidth = Math.max(0.075, width * 0.94);
      position.set(-2.5 + width * (index + 0.5), 0.08, 0);
      scale.set(partWidth, 1, 0.82);
      matrix.compose(position, quaternion, scale);
      pieces.setMatrixAt(index, matrix);
      pieces.setColorAt(index, index < current.n ? selectedColor : openColor);
      pieces.setVisibilityAt?.(index, visible);
    }
    pieces.count = current.d;
    pieces.instanceMatrix.needsUpdate = true;
    if (pieces.instanceColor) pieces.instanceColor.needsUpdate = true;
    if (derived?.facts?.n !== undefined && derived.facts.n !== current.n) throw new Error("Fraction model and exact state disagree");
    const fractionText = `${current.n}/${current.d}`;
    stage.setHelp(copyFor(lang, `${fractionText}: tap a piece to shade it. The equation updates from the lesson model.`, `${fractionText}: toca una parte para sombrearla. La ecuación se actualiza desde el modelo de la lección.`));
    stage.wrapper.setAttribute("aria-label", description || copyFor(lang, `Fraction bar showing ${fractionText}`, `Barra de fracciones que muestra ${fractionText}`));
    if (lastAction !== fractionText) {
      lastAction = fractionText;
      paintParts();
    }
    stage.draw(performance.now());
  };

  const unlisten = listenForTap(stage.renderer.domElement, (event) => {
    const hit = pickFromCanvas(stage, event, [pieces]);
    if (hit?.instanceId !== undefined && hit.instanceId < current.d)
      onAction({ type: "toggle", index: hit.instanceId });
  });
  update();
  return {
    attach: stage.attach,
    update,
    destroy() {
      unlisten();
      stage.destroy(owned.concat(railsOwned));
    },
  };
}
