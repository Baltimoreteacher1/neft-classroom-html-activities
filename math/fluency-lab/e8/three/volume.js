import {
  THREE,
  copyFor,
  createStage,
  listenForTap,
  pickFromCanvas,
  stageBase,
  standardMaterial,
} from "./runtime.js";

const MAX = 8;
const LIMIT = MAX * MAX;
const LAYER_COLORS = ["#1fa6a2", "#327fbb", "#73b7bf", "#e7b94e", "#268e82", "#5b90c5", "#9bc7bb", "#d79c52"];

export function mount(slot, { lang = "en", onAction = () => {}, state: initialState = { l: 3, w: 2, h: 2 } } = {}) {
  let exploded = false;
  const stage = createStage(slot, {
    id: "multiplication-volume-lab",
    lang,
    label: copyFor(lang, "Multiplication and volume laboratory: a prism built from unit cubes", "Laboratorio de multiplicación y volumen: un prisma construido con cubos unitarios"),
    help: copyFor(lang, "Rotate the prism. Tap its top face to add a layer; use the dimension controls for length, width and height. Open layers to compare the base area with volume.", "Gira el prisma. Toca la cara superior para agregar una capa; usa los controles para cambiar largo, ancho y alto. Separa las capas para comparar el área de la base con el volumen."),
    extraControls: [
      { id: "volume-explode", label: copyFor(lang, "Separate the layers", "Separar las capas") },
      { id: "volume-add-height", label: copyFor(lang, "Add a layer", "Agregar una capa") },
      { id: "volume-add-length", label: copyFor(lang, "Extend length", "Aumentar largo") },
      { id: "volume-add-width", label: copyFor(lang, "Extend width", "Aumentar ancho") },
    ],
    onStageAction(action) {
      if (action === "volume-explode") {
        exploded = !exploded;
        stage.setControls({ "volume-explode": exploded });
        stage.setHelp(copyFor(lang, exploded ? "The separated layers make the repeated base area visible." : "The layers are stacked into one prism again.", exploded ? "Las capas separadas muestran cómo se repite el área de la base." : "Las capas se apilaron otra vez para formar un prisma."));
      }
      if (action === "volume-add-height") onAction({ type: "setH", value: current.h + 1 });
      if (action === "volume-add-length") onAction({ type: "setL", value: current.l + 1 });
      if (action === "volume-add-width") onAction({ type: "setW", value: current.w + 1 });
    },
  });
  const { scene } = stage;
  const owned = stageBase(scene, { width: 9.3, depth: 8.6 });
  const meshes = [];
  const materials = [];
  const geometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  const matrix = new THREE.Matrix4();
  const object = new THREE.Object3D();
  let current = initialState;
  let targets = [];

  for (let layer = 0; layer < MAX; layer += 1) {
    const material = standardMaterial("#ffffff", { roughness: 0.32, metalness: 0.045 });
    materials.push(material);
    const mesh = new THREE.InstancedMesh(geometry, material, LIMIT);
    mesh.count = 0;
    mesh.position.y = 0.2 + layer * 1.01;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData.layer = layer;
    scene.add(mesh);
    meshes.push(mesh);
  }
  const dimensionPanel = document.createElement("div");
  dimensionPanel.className = "e8ml-three-dimensions";
  dimensionPanel.setAttribute("aria-label", copyFor(lang, "Prism dimensions", "Dimensiones del prisma"));
  stage.wrapper.append(dimensionPanel);
  const updateDimensionText = () => {
    dimensionPanel.innerHTML = [
      [copyFor(lang, "Length", "Largo"), current.l, copyFor(lang, "cubes", "cubos")],
      [copyFor(lang, "Width", "Ancho"), current.w, copyFor(lang, "cubes", "cubos")],
      [copyFor(lang, "Height", "Altura"), current.h, copyFor(lang, "layers", "capas")],
    ].map(([name, value, unit]) => `<span><b>${name}</b><strong>${value}</strong><small>${unit}</small></span>`).join("");
  };

  const update = ({ state = current, derived, description } = {}) => {
    current = state;
    const { l, w, h } = current;
    if (![l, w, h].every((n) => Number.isInteger(n) && n >= 1 && n <= MAX))
      throw new Error("Prism dimensions are outside the 3D model's supported range");
    const cubeCount = l * w * h;
    if (derived?.facts?.cubes !== undefined && derived.facts.cubes !== cubeCount)
      throw new Error("The 3D cube count disagrees with the exact prism model");
    targets = [];
    for (let layer = 0; layer < MAX; layer += 1) {
      const mesh = meshes[layer];
      const visible = layer < h;
      mesh.count = visible ? l * w : 0;
      let instance = 0;
      if (visible) {
        for (let row = 0; row < w; row += 1) {
          for (let col = 0; col < l; col += 1) {
            object.position.set((col - (l - 1) / 2) * 1.01, 0, (row - (w - 1) / 2) * 1.01);
            object.rotation.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.updateMatrix();
            matrix.copy(object.matrix);
            mesh.setMatrixAt(instance, matrix);
            mesh.setColorAt(instance, new THREE.Color(LAYER_COLORS[layer]));
            instance += 1;
          }
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      const yTarget = 0.2 + layer * (exploded ? 1.48 : 1.01);
      targets.push(yTarget);
    }
    updateDimensionText();
    stage.setControls({ "volume-explode": exploded });
    stage.wrapper.setAttribute("aria-label", description || copyFor(lang, `Prism with ${l} by ${w} base and ${h} layers, ${cubeCount} unit cubes total`, `Prisma con base de ${l} por ${w}, ${h} capas y ${cubeCount} cubos unitarios en total`));
    stage.renderer.domElement.setAttribute("aria-label", stage.wrapper.getAttribute("aria-label"));
    stage.draw(performance.now());
  };

  stage.setHome(
    new THREE.Vector3(9, 8.5, 11),
    new THREE.Vector3(0, 0.2 + (current.h - 1) / 2, 0),
  );
  const tick = (_time, delta) => {
    const blend = document.body?.dataset.reducedMotion === "true" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 1 : Math.min(1, delta / 130);
    for (let layer = 0; layer < MAX; layer += 1) {
      const target = targets[layer] ?? -10;
      const mesh = meshes[layer];
      const y = mesh.position.y + (target - mesh.position.y) * blend;
      mesh.position.y = Math.abs(target - y) < 0.008 ? target : y;
      mesh.visible = layer < current.h;
    }
  };
  stage.setTick(tick);
  const unlisten = listenForTap(stage.renderer.domElement, (event) => {
    const hit = pickFromCanvas(stage, event, meshes);
    if (!hit) return;
    const normal = hit.face?.normal;
    if (normal?.y > 0.55 && current.h < MAX) onAction({ type: "setH", value: current.h + 1 });
    else if (Math.abs(normal?.x || 0) > 0.55 && current.l < MAX) onAction({ type: "setL", value: current.l + 1 });
    else if (Math.abs(normal?.z || 0) > 0.55 && current.w < MAX) onAction({ type: "setW", value: current.w + 1 });
  });
  update();

  return {
    attach: stage.attach,
    update,
    destroy() {
      unlisten();
      stage.destroy(owned.concat(geometry, materials));
    },
  };
}
