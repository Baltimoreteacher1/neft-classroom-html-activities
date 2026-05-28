import * as THREE from "three";

/**
 * Shared exact grid helper. Builds a floor plate + GridHelper + an invisible
 * raycast pick-plane sized to the grid, and exposes exact, consistent
 * conversions between cell/vertex indices and world-space coordinates.
 *
 * The grid lies in the XZ plane (y = origin.y). It is n x n cells, each of size
 * `cell`, centered on `origin`. Cell indices i,j run 0..n-1 along +X (i) and
 * +Z (j). Vertex indices run 0..n (one more than cells per axis).
 *
 * createGrid(ctx, { n=8, cell=1, origin })
 *   ctx must provide { scene, THREE? }. Falls back to the imported THREE.
 *
 * Returns:
 *   group           THREE.Group (added to ctx.scene) holding floor/grid/pick-plane
 *   pickPlane       invisible THREE.Mesh for raycasting (pass to input.raycast)
 *   cellCenter(i,j) -> THREE.Vector3 world center of cell (i,j)
 *   worldToCell(p)  -> { i, j, inBounds } cell index containing world point p
 *   vertexWorld(i,j)-> THREE.Vector3 world position of grid vertex (i,j)
 *   worldToVertex(p)-> { i, j, inBounds } nearest vertex index to world point p
 *   highlightCell(i,j) -> sets a translucent highlight quad over a cell; pass
 *                         null/out-of-bounds to hide it.
 *   dispose()       removes group from scene and frees geometry/materials.
 */
export function createGrid(ctx = {}, opts = {}) {
  const T = ctx.THREE || THREE;
  const { n = 8, cell = 1, origin = new T.Vector3(0, 0, 0) } = opts;

  const ox = origin.x;
  const oy = origin.y;
  const oz = origin.z;
  const span = n * cell;
  const half = span / 2;

  const group = new T.Group();
  group.name = "e3d-grid";

  // Floor plate (slightly below the grid lines to avoid z-fighting).
  const floorGeo = new T.PlaneGeometry(span, span);
  const floorMat = new T.MeshStandardMaterial({
    color: 0x13355b,
    roughness: 0.95,
    metalness: 0.0,
  });
  const floor = new T.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ox, oy - 0.01, oz);
  floor.name = "e3d-grid-floor";
  group.add(floor);

  // GridHelper draws n divisions across the span.
  const gridHelper = new T.GridHelper(span, n, 0x4f8bd6, 0x2b557f);
  gridHelper.position.set(ox, oy, oz);
  group.add(gridHelper);

  // Invisible pick-plane for raycasting (matches the grid footprint exactly).
  const pickGeo = new T.PlaneGeometry(span, span);
  const pickMat = new T.MeshBasicMaterial({ visible: false });
  const pickPlane = new T.Mesh(pickGeo, pickMat);
  pickPlane.rotation.x = -Math.PI / 2;
  pickPlane.position.set(ox, oy, oz);
  pickPlane.name = "e3d-grid-pickplane";
  group.add(pickPlane);

  // Reusable highlight quad (one cell sized).
  const hlGeo = new T.PlaneGeometry(cell, cell);
  const hlMat = new T.MeshBasicMaterial({
    color: 0xf2c15b,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const highlight = new T.Mesh(hlGeo, hlMat);
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = oy + 0.012;
  highlight.visible = false;
  group.add(highlight);

  if (ctx.scene) ctx.scene.add(group);

  function inCellBounds(i, j) {
    return i >= 0 && i < n && j >= 0 && j < n;
  }
  function inVertexBounds(i, j) {
    return i >= 0 && i <= n && j >= 0 && j <= n;
  }

  function cellCenter(i, j) {
    return new T.Vector3(
      ox - half + (i + 0.5) * cell,
      oy,
      oz - half + (j + 0.5) * cell,
    );
  }

  function worldToCell(point) {
    const i = Math.floor((point.x - (ox - half)) / cell);
    const j = Math.floor((point.z - (oz - half)) / cell);
    return { i, j, inBounds: inCellBounds(i, j) };
  }

  function vertexWorld(i, j) {
    return new T.Vector3(ox - half + i * cell, oy, oz - half + j * cell);
  }

  function worldToVertex(point) {
    const i = Math.round((point.x - (ox - half)) / cell);
    const j = Math.round((point.z - (oz - half)) / cell);
    return { i, j, inBounds: inVertexBounds(i, j) };
  }

  function highlightCell(i, j) {
    if (i == null || j == null || !inCellBounds(i, j)) {
      highlight.visible = false;
      return;
    }
    const c = cellCenter(i, j);
    highlight.position.set(c.x, oy + 0.012, c.z);
    highlight.visible = true;
  }

  function dispose() {
    if (ctx.scene) ctx.scene.remove(group);
    floorGeo.dispose();
    floorMat.dispose();
    pickGeo.dispose();
    pickMat.dispose();
    hlGeo.dispose();
    hlMat.dispose();
    if (gridHelper.geometry) gridHelper.geometry.dispose();
    if (gridHelper.material) {
      const mats = Array.isArray(gridHelper.material)
        ? gridHelper.material
        : [gridHelper.material];
      mats.forEach((m) => m.dispose());
    }
  }

  return {
    group,
    pickPlane,
    n,
    cell,
    origin: new T.Vector3(ox, oy, oz),
    cellCenter,
    worldToCell,
    vertexWorld,
    worldToVertex,
    highlightCell,
    dispose,
  };
}
