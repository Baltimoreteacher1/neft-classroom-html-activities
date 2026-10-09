/**
 * Boss Battle 3D — arena, boss, shield and bolt meshes (visuals only).
 */
import { makeLabel } from "/games/engine3d/label3d.js";

export function createArena(THREE, scene, UNITS) {
  // ================================================================ ARENA
  const arena = new THREE.Group();
  scene.add(arena);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ color: 0x132a4a, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  floor.receiveShadow = true;
  arena.add(floor);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x0d1b30,
    emissive: 0x1fa6a2,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.3,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.16, 16, 80), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.55;
  arena.add(ring);
  const pillarGeo = new THREE.CylinderGeometry(0.32, 0.42, 6, 10);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x10243f,
    roughness: 0.8,
    metalness: 0.15,
  });
  for (let i = 0; i < 8; i++) {
    // Offset by half a step so no pillar stands between the camera (+z) and the boss.
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(Math.cos(a) * 9.2, 0.4, Math.sin(a) * 9.2);
    p.castShadow = true;
    arena.add(p);
  }

  // ================================================================ BOSS
  const boss = new THREE.Group();
  boss.position.set(0, 1.1, 0);
  arena.add(boss);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: UNITS[0].color,
    roughness: 0.32,
    metalness: 0.45,
    emissive: UNITS[0].color,
    emissiveIntensity: 0.35,
    flatShading: true,
  });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), bodyMat);
  body.castShadow = true;
  boss.add(body);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff2c0,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.1,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), coreMat);
  boss.add(core);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f18,
    emissive: 0xff3b3b,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const eyeGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.55, 0.35, 1.45);
  eyeR.position.set(0.55, 0.35, 1.45);
  boss.add(eyeL, eyeR);
  const shards = new THREE.Group();
  boss.add(shards);
  const shardMat = new THREE.MeshStandardMaterial({
    color: UNITS[0].color,
    emissive: UNITS[0].color,
    emissiveIntensity: 0.7,
    roughness: 0.35,
    metalness: 0.5,
    flatShading: true,
  });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.36), shardMat);
    const a = (i / 6) * Math.PI * 2;
    s.position.set(Math.cos(a) * 2.7, Math.sin(a * 1.3) * 0.6, Math.sin(a) * 2.7);
    s.userData.a = a;
    shards.add(s);
  }
  // The shield every attack has to beat (beam + pulse rounds).
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x7c5cff,
    emissive: 0x7c5cff,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(2.35, 32, 24), shieldMat);
  boss.add(shield);
  const nameLabel = makeLabel(UNITS[0].title, {
    scale: 0.78,
    color: "#ffffff",
    background: "rgba(11,22,40,0.86)",
  });
  nameLabel.position.set(0, 3.5, 0);
  boss.add(nameLabel);

  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xfff6d0,
    emissive: 0xffe48a,
    emissiveIntensity: 2.2,
    roughness: 0.1,
    transparent: true,
  });
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), boltMat);
  bolt.visible = false;
  scene.add(bolt);

  return { arena, ring, ringMat, boss, body, bodyMat, core, coreMat, eyeMat, eyeL, eyeR, shards, shardMat, shield, shieldMat, nameLabel, bolt, boltMat };
}
