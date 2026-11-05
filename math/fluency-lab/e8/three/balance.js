import { Rational } from "../rational.js";
import {
  THREE,
  copyFor,
  createStage,
  listenForTap,
  makeLabel,
  pickFromCanvas,
  stageBase,
  standardMaterial,
} from "./runtime.js";

const INK = "#17324d";
const TEAL = "#1fa6a2";
const AMBER = "#f2c15b";
const CORAL = "#d8613c";

const rat = (value) => Rational.of(value);
function term(a, b) {
  const coefficient = rat(a);
  const constant = rat(b);
  const parts = [];
  if (!coefficient.isZero()) {
    const magnitude = coefficient.abs();
    const value = magnitude.eq(1) ? "x" : `${magnitude}x`;
    parts.push({ sign: coefficient.sign(), value });
  }
  if (!constant.isZero()) parts.push({ sign: constant.sign(), value: String(constant.abs()) });
  if (!parts.length) return "0";
  return parts.reduce((text, part, index) => {
    const sign = part.sign < 0 ? "−" : index ? "+" : "";
    return `${text}${sign}${part.value}`;
  }, "");
}

export function mount(slot, { lang = "en", onAction = () => {} } = {}) {
  let selected = "";
  const stage = createStage(slot, {
    id: "algebra-balance-reactor",
    lang,
    label: copyFor(lang, "Equation reactor: a symbolic balance scale with variable and constant terms", "Reactor de ecuaciones: una balanza simbólica con términos variables y constantes"),
    help: copyFor(lang, "Tap a pan to inspect its terms. Apply a transformation below or use the scene controls; the exact model checks that equality is preserved.", "Toca un plato para revisar sus términos. Aplica una transformación abajo o usa los controles de la escena; el modelo exacto comprueba que se conserve la igualdad."),
    extraControls: [
      { id: "balance-add-one", label: copyFor(lang, "Add 1 to both pans", "Sumar 1 a ambos platos") },
      { id: "balance-double", label: copyFor(lang, "Double both pans", "Duplicar ambos platos") },
    ],
    onStageAction(action) {
      if (action === "balance-add-one") onAction({ type: "addConst", value: 1 });
      if (action === "balance-double") onAction({ type: "mul", value: 2 });
    },
  });
  const { scene } = stage;
  const owned = stageBase(scene, { width: 8.4, depth: 4.2 });
  const fixed = new THREE.Group();
  scene.add(fixed);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.2, 1), standardMaterial("#8ca4ac"));
  base.position.y = -0.12;
  fixed.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.3, 2.1, 24), standardMaterial("#47727b"));
  post.position.y = 0.96;
  fixed.add(post);
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 28, 20), standardMaterial(AMBER, { metalness: 0.18, roughness: 0.32 }));
  pivot.position.y = 2.03;
  fixed.add(pivot);

  const beam = new THREE.Group();
  beam.position.y = 2.03;
  scene.add(beam);
  const beamBar = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 0.32), standardMaterial(INK, { roughness: 0.38 }));
  beam.add(beamBar);
  const leftPan = new THREE.Group();
  const rightPan = new THREE.Group();
  leftPan.position.x = -1.92;
  rightPan.position.x = 1.92;
  leftPan.userData.side = "left";
  rightPan.userData.side = "right";
  beam.add(leftPan, rightPan);
  const pans = { left: leftPan, right: rightPan };
  const selectable = [];
  const termMeshes = { left: [], right: [] };
  const labels = { left: null, right: null };
  const panPlateGeometry = new THREE.CylinderGeometry(0.76, 0.86, 0.12, 32);
  const panMaterial = standardMaterial("#d7ece7", { metalness: 0.08, roughness: 0.34 });
  const chainMaterial = standardMaterial("#7c9399", { metalness: 0.25, roughness: 0.36 });

  for (const side of ["left", "right"]) {
    const pan = pans[side];
    for (const x of [-0.54, 0.54]) {
      const chain = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.75, 0.035), chainMaterial);
      chain.position.set(x, -0.38, 0);
      pan.add(chain);
    }
    const plate = new THREE.Mesh(panPlateGeometry, panMaterial.clone());
    plate.position.y = -0.78;
    plate.userData.side = side;
    pan.add(plate);
    selectable.push(plate);
    const variable = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.48), standardMaterial(TEAL, { emissive: "#000000" }));
    const constant = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.48), standardMaterial(AMBER, { emissive: "#000000" }));
    variable.position.set(-0.39, -0.48, 0);
    constant.position.set(0.39, -0.48, 0);
    variable.userData.side = side;
    constant.userData.side = side;
    pan.add(variable, constant);
    termMeshes[side].push(variable, constant);
    selectable.push(variable, constant);
    const expression = makeLabel("", INK);
    expression.position.set(0, -0.03, 0);
    expression.scale.set(1.9, 0.48, 1);
    pan.add(expression);
    labels[side] = expression;
  }

  let current = { A: "2", B: "3", C: "0", D: "11" };
  let targetTilt = 0;
  const dimensions = document.createElement("div");
  dimensions.className = "e8ml-three-algebra-labels";
  dimensions.innerHTML = `<span class="e8ml-three-key"><i></i>${copyFor(lang, "variable term", "término variable")}</span><span class="e8ml-three-key is-constant"><i></i>${copyFor(lang, "constant term", "término constante")}</span>`;
  stage.wrapper.append(dimensions);
  const update = ({ state = current, derived, description } = {}) => {
    current = state;
    const left = term(current.A, current.B);
    const right = term(current.C, current.D);
    leftPan.remove(labels.left);
    rightPan.remove(labels.right);
    labels.left.material.map?.dispose();
    labels.right.material.map?.dispose();
    labels.left.material.dispose();
    labels.right.material.dispose();
    labels.left = makeLabel(left, INK);
    labels.right = makeLabel(right, INK);
    labels.left.position.set(0, -0.03, 0);
    labels.right.position.set(0, -0.03, 0);
    labels.left.scale.set(1.9, 0.48, 1);
    labels.right.scale.set(1.9, 0.48, 1);
    leftPan.add(labels.left);
    rightPan.add(labels.right);

    for (const [side, values] of [["left", [current.A, current.B]], ["right", [current.C, current.D]]]) {
      const [variable, constant] = termMeshes[side];
      const a = rat(values[0]);
      const b = rat(values[1]);
      variable.visible = !a.isZero();
      constant.visible = !b.isZero();
      variable.scale.x = 0.72 + Math.min(1.2, a.abs().toNumber()) * 0.12;
      constant.scale.x = 0.72 + Math.min(1.2, b.abs().toNumber()) * 0.12;
      variable.material.color.set(a.sign() < 0 ? CORAL : TEAL);
      constant.material.color.set(b.sign() < 0 ? CORAL : AMBER);
      variable.material.emissive.set(selected === side ? "#17615d" : "#000000");
      constant.material.emissive.set(selected === side ? "#8e6722" : "#000000");
    }
    targetTilt = derived?.facts?.equal === false ? 0.11 : 0;
    stage.wrapper.setAttribute("aria-label", description || copyFor(lang, `Equation ${left} equals ${right}. The transformation must preserve equality.`, `Ecuación ${left} es igual a ${right}. La transformación debe conservar la igualdad.`));
    stage.renderer.domElement.setAttribute("aria-label", stage.wrapper.getAttribute("aria-label"));
    stage.setHelp(selected
      ? copyFor(lang, `${selected === "left" ? "Left" : "Right"} pan selected: ${selected === "left" ? left : right}. Choose a valid transformation below.`, `Plato ${selected === "left" ? "izquierdo" : "derecho"} seleccionado: ${selected === "left" ? left : right}. Elige abajo una transformación válida.`)
      : copyFor(lang, `${left} = ${right}. Tap either pan to inspect its terms. The transformation controls preserve equality.`, `${left} = ${right}. Toca un plato para revisar sus términos. Los controles conservan la igualdad.`));
    stage.draw(performance.now());
  };
  const tick = (_time, delta) => {
    const reduced = document.body?.dataset.reducedMotion === "true" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    beam.rotation.z += (targetTilt - beam.rotation.z) * (reduced ? 1 : Math.min(1, delta / 110));
    for (const side of ["left", "right"]) {
      pans[side].rotation.z = -beam.rotation.z;
      for (const label of [labels[side]]) label?.quaternion.copy(stage.camera.quaternion);
    }
  };
  stage.setTick(tick);
  const unlisten = listenForTap(stage.renderer.domElement, (event) => {
    const hit = pickFromCanvas(stage, event, selectable);
    const side = hit?.object?.userData?.side;
    if (!side) return;
    selected = selected === side ? "" : side;
    update({ state: current, description: copyFor(lang, `${side} pan selected`, `Plato ${side === "left" ? "izquierdo" : "derecho"} seleccionado`) });
  });
  update();

  return {
    attach: stage.attach,
    update,
    destroy() {
      unlisten();
      stage.destroy(owned.concat(panPlateGeometry, chainMaterial));
    },
  };
}
