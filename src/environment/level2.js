// src/environment/level2.js
// Level 2 — The Pool Rooms
// An eerie, bright liminal pool space: white ceramic tiles covering every surface,
// an organic kidney-shaped pool with teal water, a dramatic multi-story atrium
// with wavy balcony overhangs, and scattered pool-world props.

import * as THREE from 'three';

export const WALL_HEIGHT = 5.0;
export const POOL_ROOM_SIZE = 36; // world-unit square footprint

// ─────────────────────────────────────────────────────────────
// TEXTURES
// ─────────────────────────────────────────────────────────────

function makeWhiteTileTexture(tileSize = 28) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');

  // Base off-white ceramic
  ctx.fillStyle = '#e9e7e1';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle per-tile brightness variation
  const cols = Math.ceil(512 / tileSize);
  const rows = Math.ceil(512 / tileSize);
  for (let tx = 0; tx < cols; tx++) {
    for (let ty = 0; ty < rows; ty++) {
      const v = (Math.random() * 12 - 6) | 0;
      const base = 232 + v;
      ctx.fillStyle = `rgba(${base},${base - 2},${base - 6},0.22)`;
      ctx.fillRect(tx * tileSize + 1, ty * tileSize + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Grout lines
  ctx.strokeStyle = 'rgba(90,88,82,0.52)';
  ctx.lineWidth = 1.8;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeWaterCausticTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3ab5b0';
  ctx.fillRect(0, 0, 256, 256);
  // Caustic blobs
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 18;
    const alpha = 0.08 + Math.random() * 0.14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(180,240,235,${alpha})`);
    g.addColorStop(1, 'rgba(58,181,176,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildLevel2Materials() {
  const tileTex = makeWhiteTileTexture(28);
  const waterTex = makeWaterCausticTexture();

  // Tile repeats
  const floorTile = tileTex.clone(); floorTile.needsUpdate = true;
  floorTile.repeat.set(16, 16);
  const wallTile = tileTex.clone(); wallTile.needsUpdate = true;
  wallTile.repeat.set(6, 2);
  const ceilTile = tileTex.clone(); ceilTile.needsUpdate = true;
  ceilTile.repeat.set(16, 16);
  waterTex.repeat.set(3, 3);

  const tileMat = new THREE.MeshStandardMaterial({
    map: floorTile,
    roughness: 0.18,
    metalness: 0.04,
    color: 0xf0eeea,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTile,
    roughness: 0.2,
    metalness: 0.04,
    color: 0xf0eeea,
  });
  const ceilMat = new THREE.MeshStandardMaterial({
    map: ceilTile,
    roughness: 0.22,
    metalness: 0.03,
    color: 0xf4f2ee,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x40c8c0,
    transparent: true,
    opacity: 0.78,
    roughness: 0.05,
    metalness: 0.28,
  });
  const poolLipMat = new THREE.MeshStandardMaterial({
    map: tileTex.clone(),
    roughness: 0.15,
    metalness: 0.06,
    color: 0xeceae4,
  });
  poolLipMat.map.repeat.set(8, 8);
  poolLipMat.map.needsUpdate = true;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, roughness: 0.25, metalness: 0.85
  });
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xe8629a, roughness: 0.55, metalness: 0.0
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a0808, roughness: 0.9
  });
  const towelMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, roughness: 1.0
  });

  return { tileMat, wallMat, ceilMat, waterMat, poolLipMat, metalMat, pinkMat, darkMat, towelMat };
}

// ─────────────────────────────────────────────────────────────
// POOL SHAPE — organic kidney outline via bezier
// ─────────────────────────────────────────────────────────────

function makePoolShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -4.2);
  shape.bezierCurveTo( 4.5, -4.2,  6.5, -1.5,  6.0,  1.2);
  shape.bezierCurveTo( 5.5,  3.8,  2.5,  5.0,  0.0,  4.8);
  shape.bezierCurveTo(-3.5,  4.6, -7.0,  2.5, -6.5,  0.0);
  shape.bezierCurveTo(-6.0, -2.5, -3.5, -4.2,  0.0, -4.2);
  return shape;
}

function makeInnerPoolShape() {
  // Slightly smaller, for the water surface
  const shape = new THREE.Shape();
  shape.moveTo(0, -3.6);
  shape.bezierCurveTo( 3.8, -3.6,  5.7, -1.3,  5.2,  1.0);
  shape.bezierCurveTo( 4.7,  3.2,  2.1,  4.3,  0.0,  4.1);
  shape.bezierCurveTo(-3.0,  3.9, -6.1,  2.0, -5.6,  0.0);
  shape.bezierCurveTo(-5.2, -2.1, -2.9, -3.6,  0.0, -3.6);
  return shape;
}

// ─────────────────────────────────────────────────────────────
// WAVY RING — the atrium balcony cross-section
// ─────────────────────────────────────────────────────────────

function buildWavyRingGeometry(innerR, outerR, segments, wavesPerRing, waveAmp, phaseOffset) {
  const verts = [];
  const uvs = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wave = Math.sin(angle * wavesPerRing + phaseOffset) * waveAmp;
    const r1 = innerR;
    const r2 = outerR + wave;
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);

    verts.push(nx * r1, 0, nz * r1);
    verts.push(nx * r2, 0, nz * r2);

    uvs.push(i / segments, 0);
    uvs.push(i / segments, 1);

    normals.push(0, 1, 0, 0, 1, 0);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─────────────────────────────────────────────────────────────
// ATRIUM OVERHANGS
// ─────────────────────────────────────────────────────────────

function buildAtrium(group, mat) {
  const levels = 5;
  const baseY = WALL_HEIGHT + 0.1;

  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const y = baseY + i * 2.2;
    const outerR = 9.0 - i * 1.2;
    const innerR = 2.2 + i * 0.15;
    const waveAmp = 0.55 - i * 0.05;
    const phase = i * 1.05;

    // Flat wavy ring (balcony slab)
    const ringGeo = buildWavyRingGeometry(innerR, outerR, 96, 3, waveAmp, phase);
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.y = y;
    group.add(ring);

    // Underside of ring (visible from below)
    const ringUnder = new THREE.Mesh(ringGeo, mat);
    ringUnder.position.y = y - 0.12;
    ringUnder.rotation.x = Math.PI;
    group.add(ringUnder);

    // Curved fascia wall below outer edge (the visible band between floors)
    const fasciaH = 1.8;
    const fasciaGeo = new THREE.CylinderGeometry(outerR + waveAmp * 0.5, outerR + waveAmp * 0.5, fasciaH, 80, 1, true);
    const fascia = new THREE.Mesh(fasciaGeo, mat);
    fascia.position.y = y - fasciaH / 2;
    group.add(fascia);
  }

  // Skylight cap at very top — bright emissive disc
  const skyMat = new THREE.MeshStandardMaterial({
    color: 0xdaf4ff,
    emissive: 0xb8e8ff,
    emissiveIntensity: 2.2,
    side: THREE.DoubleSide,
  });
  const sky = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), skyMat);
  sky.rotation.x = -Math.PI / 2;
  sky.position.y = baseY + levels * 2.2 + 0.1;
  group.add(sky);
}

// ─────────────────────────────────────────────────────────────
// FLAMINGO FLOAT
// ─────────────────────────────────────────────────────────────

function makeFlamingo(pinkMat, darkMat) {
  const g = new THREE.Group();

  // Body ring (inflatable torus float)
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.20, 14, 48), pinkMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.20;
  g.add(body);

  // Neck curve
  const neckPts = [
    new THREE.Vector3(0,      0.32,  0.45),
    new THREE.Vector3(0.08,   0.60,  0.52),
    new THREE.Vector3(0.18,   0.88,  0.38),
    new THREE.Vector3(0.28,   1.08,  0.10),
    new THREE.Vector3(0.30,   1.22, -0.05),
  ];
  const neckCurve = new THREE.CatmullRomCurve3(neckPts);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 16, 0.065, 10, false), pinkMat);
  g.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), pinkMat);
  head.position.set(0.30, 1.32, -0.05);
  g.add(head);

  // Beak (flat cone)
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.22, 8), darkMat);
  beak.rotation.z = -Math.PI / 2.2;
  beak.position.set(0.48, 1.28, -0.05);
  g.add(beak);

  // Eye dot
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkMat);
  eye.position.set(0.36, 1.37, 0.07);
  g.add(eye);

  return g;
}

// ─────────────────────────────────────────────────────────────
// SHOWER FIXTURE
// ─────────────────────────────────────────────────────────────

function makeShower(metalMat) {
  const g = new THREE.Group();

  // Wall pipe (vertical)
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.5, 10), metalMat);
  pipe.position.set(0, 1.1, 0.02);
  g.add(pipe);

  // Elbow (torus quarter)
  const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 16, Math.PI / 2), metalMat);
  elbow.rotation.z = Math.PI;
  elbow.position.set(0.09, 1.86, 0.02);
  g.add(elbow);

  // Horizontal arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 10), metalMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.23, 1.95, 0.02);
  g.add(arm);

  // Shower head disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 20), metalMat);
  disc.rotation.z = Math.PI / 2;
  disc.position.set(0.39, 1.95, 0.02);
  g.add(disc);

  // Wall mount bracket
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), metalMat);
  bracket.position.set(0, 0.38, 0.02);
  g.add(bracket);

  return g;
}

// ─────────────────────────────────────────────────────────────
// TOWEL HOOK
// ─────────────────────────────────────────────────────────────

function makeTowelHook(metalMat, towelMat) {
  const g = new THREE.Group();

  // Hook mount plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), metalMat);
  plate.position.set(0, 1.45, 0);
  g.add(plate);

  // Hook arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), metalMat);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 1.45, -0.10);
  g.add(arm);

  // Hook tip (down)
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 8), metalMat);
  tip.position.set(0, 1.40, -0.17);
  g.add(tip);

  // Hanging towel (dark cloth)
  const towel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.04), towelMat);
  towel.position.set(0, 1.12, -0.17);
  g.add(towel);

  return g;
}

// ─────────────────────────────────────────────────────────────
// CURVED ENTRANCE ARCH (left side of image)
// ─────────────────────────────────────────────────────────────

function buildEntranceArch(group, mat) {
  // A rounded archway: two curved walls that meet overhead
  const archH = WALL_HEIGHT;
  const archW = 3.5;

  // Left column
  const leftCol = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, archH, 32, 1, true, Math.PI, Math.PI), mat);
  leftCol.position.set(-archW / 2, archH / 2, 0);
  group.add(leftCol);

  // Right column
  const rightCol = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, archH, 32, 1, true, 0, Math.PI), mat);
  rightCol.position.set(archW / 2, archH / 2, 0);
  group.add(rightCol);

  // Top torus arch
  const arch = new THREE.Mesh(new THREE.TorusGeometry(archW / 2, 0.55, 16, 48, Math.PI), mat);
  arch.rotation.z = Math.PI;
  arch.position.set(0, archH, 0);
  group.add(arch);
}

// ─────────────────────────────────────────────────────────────
// POOL LEVEL CLASS
// ─────────────────────────────────────────────────────────────

export class PoolLevel {
  constructor() {
    this.group = new THREE.Group();
    this.walls = [];          // AABBs for collision { min: Vector2, max: Vector2 }
    this.flickerLights = [];  // empty — pool rooms don't flicker
    this._flamingo = null;
    this._flamingoPhase = 0;
    this._waterMesh = null;
    this._waterPhase = 0;
    this._poolGlow = null;

    this.materials = buildLevel2Materials();
    this._buildGeometry();
    this._buildWalls();
    this._buildAtrium();
    this._buildProps();
    this._placeLights();
  }

  get spawnWorldPosition() {
    // Start near the back wall, facing into the pool room
    return new THREE.Vector3(0, 0, 14);
  }

  // AABB helper
  _addWall(xMin, zMin, xMax, zMax) {
    this.walls.push({
      min: new THREE.Vector2(xMin, zMin),
      max: new THREE.Vector2(xMax, zMax),
    });
  }

  // ── MAIN ROOM ───────────────────────────────────────────────
  _buildGeometry() {
    const { group, materials } = this;
    const S = POOL_ROOM_SIZE / 2; // half-size = 18

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ROOM_SIZE, POOL_ROOM_SIZE),
      materials.tileMat
    );
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ROOM_SIZE, POOL_ROOM_SIZE),
      materials.ceilMat
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = WALL_HEIGHT;
    group.add(ceil);

    // Back wall (north, -Z)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ROOM_SIZE, WALL_HEIGHT),
      materials.wallMat
    );
    backWall.position.set(0, WALL_HEIGHT / 2, -S);
    group.add(backWall);

    // Front wall (south, +Z) — with arch opening
    const frontWallL = new THREE.Mesh(
      new THREE.PlaneGeometry(S - 2.2, WALL_HEIGHT),
      materials.wallMat
    );
    frontWallL.position.set(-(S / 2 + 1.1), WALL_HEIGHT / 2, S);
    frontWallL.rotation.y = Math.PI;
    group.add(frontWallL);

    const frontWallR = new THREE.Mesh(
      new THREE.PlaneGeometry(S - 2.2, WALL_HEIGHT),
      materials.wallMat
    );
    frontWallR.position.set((S / 2 + 1.1), WALL_HEIGHT / 2, S);
    frontWallR.rotation.y = Math.PI;
    group.add(frontWallR);

    // Left wall (west, -X)
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ROOM_SIZE, WALL_HEIGHT),
      materials.wallMat
    );
    leftWall.position.set(-S, WALL_HEIGHT / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    group.add(leftWall);

    // Right wall (east, +X)
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ROOM_SIZE, WALL_HEIGHT),
      materials.wallMat
    );
    rightWall.position.set(S, WALL_HEIGHT / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    group.add(rightWall);

    // ── POOL ────────────────────────────────────────────────
    const poolShape = makePoolShape();
    const innerShape = makeInnerPoolShape();

    // Pool surround (tiled lip)
    const surroundGeo = new THREE.ShapeGeometry(poolShape, 48);
    const surround = new THREE.Mesh(surroundGeo, materials.poolLipMat);
    surround.rotation.x = -Math.PI / 2;
    surround.position.set(-1, 0.015, -2);
    group.add(surround);

    // Pool basin edge (shallow raised lip)
    const extrudeSettings = { depth: 0.12, bevelEnabled: false };
    const lipGeo = new THREE.ExtrudeGeometry(poolShape, extrudeSettings);
    const lip = new THREE.Mesh(lipGeo, materials.poolLipMat);
    lip.rotation.x = -Math.PI / 2;
    lip.position.set(-1, 0.015, -2);
    group.add(lip);

    // Water surface
    const waterGeo = new THREE.ShapeGeometry(innerShape, 48);
    const water = new THREE.Mesh(waterGeo, materials.waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-1, 0.18, -2);
    group.add(water);
    this._waterMesh = water;
  }

  // ── BOUNDING WALLS for collision ───────────────────────────
  _buildWalls() {
    const S = POOL_ROOM_SIZE / 2;
    const T = 0.4; // wall thickness

    this._addWall(-S - T, -S - T, S + T, -S); // back
    this._addWall(-S - T, S,       S + T,  S + T); // front
    this._addWall(-S - T, -S - T, -S,      S + T); // left
    this._addWall( S,     -S - T,  S + T,  S + T); // right
  }

  // ── ATRIUM ────────────────────────────────────────────────
  _buildAtrium() {
    // Position the atrium center over the pool area (slightly forward)
    const atriumGrp = new THREE.Group();
    atriumGrp.position.set(-1, 0, -4);
    buildAtrium(atriumGrp, this.materials.ceilMat);
    this.group.add(atriumGrp);
  }

  // ── PROPS ─────────────────────────────────────────────────
  _buildProps() {
    const { group, materials } = this;

    // Flamingo float — inside the pool
    const flamingo = makeFlamingo(materials.pinkMat, materials.darkMat);
    flamingo.position.set(2.5, 0.18, -1.5);
    flamingo.rotation.y = -0.6;
    group.add(flamingo);
    this._flamingo = flamingo;

    // Shower — on the right wall
    const shower = makeShower(materials.metalMat);
    shower.position.set(15.5, 0, 6);
    shower.rotation.y = -Math.PI / 2;
    group.add(shower);

    // Towel hook — left wall
    const towelHook = makeTowelHook(materials.metalMat, materials.towelMat);
    towelHook.position.set(-15.5, 0, -8);
    towelHook.rotation.y = Math.PI / 2;
    group.add(towelHook);

    // Entrance arch (front, corridor feel)
    const archGroup = new THREE.Group();
    buildEntranceArch(archGroup, this.materials.wallMat);
    archGroup.position.set(0, 0, 14);
    group.add(archGroup);

    // Small step platform near far corner (depth cue)
    const stepMat = this.materials.poolLipMat;
    const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.8), stepMat);
    step.position.set(10, 0.06, -14);
    group.add(step);

    // Palm leaf silhouette through the left window gap
    this._addWindowGlow(group);
  }

  _addWindowGlow(group) {
    // Faint teal-sky glow rectangle to suggest a window
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x8de0d8,
      emissive: 0x6cccc4,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), glowMat);
    win.position.set(-17.5, 2.6, -10);
    win.rotation.y = Math.PI / 2;
    group.add(win);
  }

  // ── LIGHTING ───────────────────────────────────────────────
  _placeLights() {
    const { group } = this;

    // Broad ambient — the room is bright and diffuse
    const ambient = new THREE.AmbientLight(0xe8f2f5, 1.6);
    group.add(ambient);

    // Top-down hemisphere (sky from atrium)
    const hemi = new THREE.HemisphereLight(0xd4eef8, 0xc8dcd6, 0.9);
    group.add(hemi);

    // Pool underwater glow
    const poolGlow = new THREE.PointLight(0x30c8c0, 2.2, 14, 2);
    poolGlow.position.set(-1, 0.08, -2);
    group.add(poolGlow);
    this._poolGlow = poolGlow;

    // Atrium skylight beam
    const skyBeam = new THREE.PointLight(0xdaf4ff, 2.8, 18, 1.6);
    skyBeam.position.set(-1, WALL_HEIGHT + 5, -4);
    group.add(skyBeam);

    // Fill light from left window
    const winLight = new THREE.PointLight(0xa0e8e0, 1.0, 20, 2);
    winLight.position.set(-15, 3, -8);
    group.add(winLight);

    // Soft fill on right side
    const fill = new THREE.PointLight(0xffffff, 0.6, 24, 2);
    fill.position.set(12, 3, 0);
    group.add(fill);
  }

  // ── PER-FRAME ─────────────────────────────────────────────
  updateFlicker(_t) {
    // No flicker in pool rooms — lights stay steady
    // Pool glow pulses gently
    if (this._poolGlow) {
      this._poolGlow.intensity = 2.0 + Math.sin(_t * 1.4) * 0.3;
    }
  }

  update(dt) {
    this._flamingoPhase += dt;
    this._waterPhase += dt;

    // Flamingo bobs and slowly rotates
    if (this._flamingo) {
      this._flamingo.position.y = 0.18 + Math.sin(this._flamingoPhase * 0.8) * 0.025;
      this._flamingo.rotation.y += dt * 0.12;
    }

    // Water colour/opacity subtle pulse
    if (this._waterMesh) {
      const pulse = Math.sin(this._waterPhase * 1.1) * 0.05;
      this._waterMesh.material.opacity = 0.76 + pulse;
    }
  }

  setInsanity(_t) {
    // Pool rooms have no insanity effect — the calm is part of the horror
  }

  randomOpenCellFar(_ref, _minDist) {
    // Return a random point in the room for monster placement (unused in L2)
    return new THREE.Vector3((Math.random() - 0.5) * 24, 0, (Math.random() - 0.5) * 24);
  }
}
