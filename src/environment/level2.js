// src/environment/level2.js
// Level 2 — The Pool Rooms (Expanded)
//
// ALL geometry is placed in world space (no group offsets).
// Zone layout (top-down, +Z = south):
//
//   [Zone A: Arch Corridor]  runs Z: -70 to -30, centered X: 0, width 10
//        |
//   [Zone E: Grand Atrium]   centered at 0,0  (36x36 box, Z: -18 to +18)
//        |
//   [Connector south]        Z: +18 to +30, width 8
//        |
//   [Zone D: Sunset Gallery] runs Z: +30 to +86, centered X: 0, width 10
//        (portal at Z: +89)
//
//   [Connector west from E]  X: -18 to -30, Z: -4 to +4, height 5
//        |
//   [Zone B: Dark Cistern]   circle center at (-44, 0, 0), radius 16
//        |
//   [Connector south from B] X: -44 to -38, Z: 0 to +20 width 8
//        |
//   [Zone C: Flooded Court]  centered at (-42, 0, +40), 30x22

import * as THREE from 'three';

export const WALL_HEIGHT = 5.0;

// ─────────────────────────────────────────────────────────────
// TEXTURES
// ─────────────────────────────────────────────────────────────

function makeTileTex(r, g, b, tileSize = 28) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 512, 512);
  const cols = Math.ceil(512 / tileSize), rows = Math.ceil(512 / tileSize);
  for (let tx = 0; tx < cols; tx++) for (let ty = 0; ty < rows; ty++) {
    const v = (Math.random() * 14 - 7) | 0;
    ctx.fillStyle = `rgba(${r+v},${g+v},${b+v},0.22)`;
    ctx.fillRect(tx*tileSize+1, ty*tileSize+1, tileSize-2, tileSize-2);
  }
  ctx.strokeStyle = 'rgba(40,36,30,0.45)'; ctx.lineWidth = 1.6;
  for (let x = 0; x <= 512; x += tileSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,512); ctx.stroke(); }
  for (let y = 0; y <= 512; y += tileSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeWaterTex(r, g, b) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0,0,256,256);
  for (let i = 0; i < 140; i++) {
    const x=Math.random()*256, y=Math.random()*256, rad=4+Math.random()*20;
    const alpha=0.07+Math.random()*0.16;
    const grd=ctx.createRadialGradient(x,y,0,x,y,rad);
    grd.addColorStop(0,`rgba(200,255,250,${alpha})`);
    grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─────────────────────────────────────────────────────────────
// MATERIALS
// ─────────────────────────────────────────────────────────────

function buildMaterials() {
  const mk = (tex, repX, repY, rough, metal, col) => {
    const t = tex.clone(); t.repeat.set(repX, repY); t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: metal, color: col });
  };

  // White tile (Zones A + E)
  const wT = makeTileTex(233, 231, 225, 28);
  // Teal-dark tile (Zone B)
  const bT = makeTileTex(30, 50, 48, 22);
  // Sandy beige (Zone C)
  const sT = makeTileTex(210, 198, 165, 32);
  // Sunset orange (Zone D — small fine tile)
  const oT = makeTileTex(200, 96, 64, 14);

  // Water textures
  const tealWaterTex  = makeWaterTex(64,200,192);
  const greenWaterTex = makeWaterTex(20,130,100);

  const mkW = (tex, rep, col, opacity) => {
    const t = tex.clone(); t.repeat.set(rep,rep); t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map:t, color:col, transparent:true, opacity, roughness:0.04, metalness:0.28, side:THREE.FrontSide });
  };

  return {
    // Zone A/E — white
    wFloor: mk(wT, 18, 18, 0.18, 0.04, 0xf0eeea),
    wWall:  mk(wT,  6,  2, 0.20, 0.04, 0xf0eeea),
    wCeil:  mk(wT, 16, 16, 0.22, 0.03, 0xf4f2ee),
    // Zone B — dark teal
    bFloor: mk(bT, 12, 12, 0.30, 0.05, 0x1e3230),
    bWall:  mk(bT,  5,  2, 0.32, 0.05, 0x1e3230),
    bCeil:  mk(bT, 10, 10, 0.30, 0.04, 0x1a2a28),
    // Zone C — sandy
    sFloor: mk(sT, 14, 14, 0.55, 0.02, 0xcfc3a0),
    sWall:  mk(sT,  5,  2, 0.58, 0.02, 0xcfc3a0),
    // Zone D — sunset
    oFloor: mk(oT, 22, 22, 0.20, 0.08, 0xd06848),
    oWall:  mk(oT,  8,  3, 0.22, 0.08, 0xd06848),
    oCeil:  mk(oT, 16, 16, 0.20, 0.06, 0xc86040),
    // Water
    tealW:  mkW(tealWaterTex,  4, 0x40c8c0, 0.76),
    greenW: mkW(greenWaterTex, 3, 0x20a88a, 0.82),
    // Misc
    metal:  new THREE.MeshStandardMaterial({ color:0xb8b8b8, roughness:0.25, metalness:0.88 }),
    pink:   new THREE.MeshStandardMaterial({ color:0xe8629a, roughness:0.55 }),
    dark:   new THREE.MeshStandardMaterial({ color:0x1a0808, roughness:0.9 }),
    // Emissive ceiling strip (Zone A)
    strip:  new THREE.MeshStandardMaterial({ color:0xe8f8ff, emissive:0xd0f0ff, emissiveIntensity:2.0, side:THREE.DoubleSide }),
    // Skylight (atrium)
    skyLight: new THREE.MeshStandardMaterial({ color:0xdaf4ff, emissive:0xb8e8ff, emissiveIntensity:2.2, side:THREE.DoubleSide }),
    // Open sky (Zone C ceiling replacement)
    openSky: new THREE.MeshStandardMaterial({ color:0x88ccee, emissive:0x5599bb, emissiveIntensity:1.0, transparent:true, opacity:0.7, side:THREE.DoubleSide }),
    // Sunset glow pillar
    sunGlow: new THREE.MeshStandardMaterial({ color:0xffa060, emissive:0xff8040, emissiveIntensity:1.6, side:THREE.DoubleSide }),
    // Portal
    portalRing: new THREE.MeshStandardMaterial({ color:0x88ffee, emissive:0x44ffcc, emissiveIntensity:2.5, roughness:0.1, metalness:0.6 }),
    portalDisc: new THREE.MeshStandardMaterial({ color:0x00ffcc, emissive:0x00ffcc, emissiveIntensity:3.0, transparent:true, opacity:0.88, side:THREE.DoubleSide }),
  };
}

// ─────────────────────────────────────────────────────────────
// LOW-LEVEL GEOMETRY HELPERS  (all positions in WORLD space)
// ─────────────────────────────────────────────────────────────

function addPlane(grp, w, h, mat, x, y, z, rotX=0, rotY=0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.set(rotX, rotY, 0); m.position.set(x, y, z);
  grp.add(m); return m;
}
function addBox(grp, w, h, d, mat, x, y, z, rotY=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.rotation.y = rotY; m.position.set(x, y, z);
  grp.add(m); return m;
}
function addWallAABB(walls, x0, z0, x1, z1) {
  walls.push({ min: new THREE.Vector2(Math.min(x0,x1), Math.min(z0,z1)), max: new THREE.Vector2(Math.max(x0,x1), Math.max(z0,z1)) });
}

/** Rectangular room shell in world space. No group offsets. */
function addRoom(grp, walls, cx, cz, w, d, h, mFloor, mWall, mCeil, openSides=[]) {
  const hw=w/2, hd=d/2, T=0.3;
  // Floor
  addPlane(grp, w, d, mFloor, cx, 0, cz, -Math.PI/2, 0);
  // Ceiling
  if (mCeil) addPlane(grp, w, d, mCeil, cx, h, cz, Math.PI/2, 0);

  // North wall (−Z)
  if (!openSides.includes('N')) { addPlane(grp, w, h, mWall, cx, h/2, cz-hd, 0, 0); addWallAABB(walls, cx-hw-T, cz-hd-T, cx+hw+T, cz-hd); }
  // South wall (+Z)
  if (!openSides.includes('S')) { addPlane(grp, w, h, mWall, cx, h/2, cz+hd, 0, Math.PI); addWallAABB(walls, cx-hw-T, cz+hd, cx+hw+T, cz+hd+T); }
  // West wall (−X)
  if (!openSides.includes('W')) { addPlane(grp, d, h, mWall, cx-hw, h/2, cz, 0, Math.PI/2); addWallAABB(walls, cx-hw-T, cz-hd-T, cx-hw, cz+hd+T); }
  // East wall (+X)
  if (!openSides.includes('E')) { addPlane(grp, d, h, mWall, cx+hw, h/2, cz, 0, -Math.PI/2); addWallAABB(walls, cx+hw, cz-hd-T, cx+hw+T, cz+hd+T); }
}

/** Arch (two pillars + torus cap) placed in world space */
function addArch(grp, wx, wy, wz, archW, archH, mat, rotY=0) {
  const hw = archW/2, rCol = 0.5;
  const g = new THREE.Group();
  // Left column half-cylinder
  const lc = new THREE.Mesh(new THREE.CylinderGeometry(rCol,rCol,archH,32,1,true,Math.PI,Math.PI), mat);
  lc.position.set(-hw, archH/2, 0); g.add(lc);
  // Right column
  const rc = new THREE.Mesh(new THREE.CylinderGeometry(rCol,rCol,archH,32,1,true,0,Math.PI), mat);
  rc.position.set(hw, archH/2, 0); g.add(rc);
  // Torus cap
  const arc = new THREE.Mesh(new THREE.TorusGeometry(hw, rCol, 16, 48, Math.PI), mat);
  arc.rotation.z = Math.PI; arc.position.set(0, archH, 0); g.add(arc);
  g.position.set(wx, wy, wz); g.rotation.y = rotY;
  grp.add(g); return g;
}

// ─────────────────────────────────────────────────────────────
// ATRIUM RINGS (wavy balcony overhangs above Zone E pool)
// ─────────────────────────────────────────────────────────────

function addWavyRing(grp, cx, baseY, cy_z, innerR, outerR, segments, wavesPerRing, waveAmp, phase, mat) {
  const verts=[], uvs=[], normals=[], indices=[];
  for (let i=0;i<=segments;i++) {
    const angle=(i/segments)*Math.PI*2, wave=Math.sin(angle*wavesPerRing+phase)*waveAmp;
    const r1=innerR, r2=outerR+wave, nx=Math.cos(angle), nz=Math.sin(angle);
    verts.push(nx*r1,0,nz*r1, nx*r2,0,nz*r2);
    uvs.push(i/segments,0, i/segments,1);
    normals.push(0,1,0, 0,1,0);
  }
  for (let i=0;i<segments;i++) {
    const a=i*2,b=a+1,c=a+2,d=a+3; indices.push(a,c,b, b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geo.setIndex(indices); geo.computeVertexNormals();

  const ring=new THREE.Mesh(geo,mat); ring.position.set(cx,baseY,cy_z); grp.add(ring);
  const ringU=new THREE.Mesh(geo,mat); ringU.position.set(cx,baseY-0.12,cy_z); ringU.rotation.x=Math.PI; grp.add(ringU);
  const fH=1.8;
  const fGeo=new THREE.CylinderGeometry(outerR+waveAmp*0.5,outerR+waveAmp*0.5,fH,80,1,true);
  const fascia=new THREE.Mesh(fGeo,mat); fascia.position.set(cx,baseY-fH/2,cy_z); grp.add(fascia);
}

function buildAtrium(grp, cx, cz, mat, skylightMat) {
  const levels=5, baseY=WALL_HEIGHT+0.1;
  for (let i=0;i<levels;i++) {
    const y=baseY+i*2.2, outerR=9.0-i*1.2, innerR=2.2+i*0.15, waveAmp=0.55-i*0.05, phase=i*1.05;
    addWavyRing(grp, cx, y, cz, innerR, outerR, 96, 3, waveAmp, phase, mat);
  }
  const sky=new THREE.Mesh(new THREE.CircleGeometry(2.2,48), skylightMat);
  sky.rotation.x=-Math.PI/2; sky.position.set(cx, baseY+levels*2.2+0.1, cz); grp.add(sky);
}

// ─────────────────────────────────────────────────────────────
// POOL SHAPE (kidney)
// ─────────────────────────────────────────────────────────────

function makePoolShape() {
  const s=new THREE.Shape();
  s.moveTo(0,-4.2);
  s.bezierCurveTo(4.5,-4.2, 6.5,-1.5, 6.0,1.2);
  s.bezierCurveTo(5.5,3.8, 2.5,5.0, 0.0,4.8);
  s.bezierCurveTo(-3.5,4.6,-7.0,2.5,-6.5,0.0);
  s.bezierCurveTo(-6.0,-2.5,-3.5,-4.2,0.0,-4.2);
  return s;
}
function makeInnerPoolShape() {
  const s=new THREE.Shape();
  s.moveTo(0,-3.6);
  s.bezierCurveTo(3.8,-3.6, 5.7,-1.3, 5.2,1.0);
  s.bezierCurveTo(4.7,3.2, 2.1,4.3, 0.0,4.1);
  s.bezierCurveTo(-3.0,3.9,-6.1,2.0,-5.6,0.0);
  s.bezierCurveTo(-5.2,-2.1,-2.9,-3.6,0.0,-3.6);
  return s;
}

// ─────────────────────────────────────────────────────────────
// FLAMINGO
// ─────────────────────────────────────────────────────────────

function makeFlamingo(pinkMat, darkMat) {
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.TorusGeometry(0.52,0.20,14,48),pinkMat);
  body.rotation.x=Math.PI/2; body.position.y=0.20; g.add(body);
  const neckPts=[
    new THREE.Vector3(0,0.32,0.45),new THREE.Vector3(0.08,0.60,0.52),
    new THREE.Vector3(0.18,0.88,0.38),new THREE.Vector3(0.28,1.08,0.10),
    new THREE.Vector3(0.30,1.22,-0.05)
  ];
  const neck=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts),16,0.065,10,false),pinkMat); g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.115,14,10),pinkMat); head.position.set(0.30,1.32,-0.05); g.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(0.038,0.22,8),darkMat); beak.rotation.z=-Math.PI/2.2; beak.position.set(0.48,1.28,-0.05); g.add(beak);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8),darkMat); eye.position.set(0.36,1.37,0.07); g.add(eye);
  return g;
}

// ─────────────────────────────────────────────────────────────
// BUILD FUNCTIONS PER ZONE
// ─────────────────────────────────────────────────────────────

// ── ZONE E  Grand Atrium  (36×36, center 0,0) ────────────────
// Opens: North (to Zone A corridor), South (to connector→D), West (to connector→B)
function buildZoneE(grp, walls, m, anim) {
  const W=36, D=36, H=WALL_HEIGHT, hw=18, hd=18;

  // Floor + ceiling
  addPlane(grp, W, D, m.wFloor,  0, 0,  0, -Math.PI/2);
  addPlane(grp, W, D, m.wCeil,   0, H,  0,  Math.PI/2);

  // North wall — has a 6-wide arch opening at center (connects to Zone A)
  addPlane(grp, (W-6)/2, H, m.wWall, -(hw/2+1.5), H/2, -hd, 0,0);
  addPlane(grp, (W-6)/2, H, m.wWall,  (hw/2+1.5), H/2, -hd, 0,0);
  addWallAABB(walls, -hw-0.3, -hd-0.3, -3, -hd);
  addWallAABB(walls,  3,      -hd-0.3, hw+0.3, -hd);

  // South wall — 6-wide arch opening (connects south corridor)
  addPlane(grp, (W-6)/2, H, m.wWall, -(hw/2+1.5), H/2, hd, 0, Math.PI);
  addPlane(grp, (W-6)/2, H, m.wWall,  (hw/2+1.5), H/2, hd, 0, Math.PI);
  addWallAABB(walls, -hw-0.3, hd, -3, hd+0.3);
  addWallAABB(walls,  3,      hd, hw+0.3, hd+0.3);

  // East wall — solid
  addPlane(grp, D, H, m.wWall, hw, H/2, 0, 0, -Math.PI/2);
  addWallAABB(walls, hw, -hd-0.3, hw+0.3, hd+0.3);

  // West wall — 6-wide arch opening (connects to Zone B corridor)
  addPlane(grp, (D-6)/2, H, m.wWall, -hw, H/2, -(hd/2+1.5), 0, Math.PI/2);
  addPlane(grp, (D-6)/2, H, m.wWall, -hw, H/2,  (hd/2+1.5), 0, Math.PI/2);
  addWallAABB(walls, -hw-0.3, -hd-0.3, -hw, -3);
  addWallAABB(walls, -hw-0.3,  3,      -hw, hd+0.3);

  // Arch decorations
  addArch(grp, 0, 0, -hd, 5, H*0.85, m.wWall);
  addArch(grp, 0, 0,  hd, 5, H*0.85, m.wWall, Math.PI);
  addArch(grp, -hw, 0, 0, 5, H*0.85, m.wWall, Math.PI/2);

  // Kidney pool (offset slightly from center)
  const px=-1, pz=-2;
  const surround=new THREE.Mesh(new THREE.ShapeGeometry(makePoolShape(),48), m.wFloor);
  surround.rotation.x=-Math.PI/2; surround.position.set(px,0.015,pz); grp.add(surround);
  const lip=new THREE.Mesh(new THREE.ExtrudeGeometry(makePoolShape(),{depth:0.12,bevelEnabled:false}), m.wFloor);
  lip.rotation.x=-Math.PI/2; lip.position.set(px,0.015,pz); grp.add(lip);
  const water=new THREE.Mesh(new THREE.ShapeGeometry(makeInnerPoolShape(),48), m.tealW);
  water.rotation.x=-Math.PI/2; water.position.set(px,0.18,pz); grp.add(water);
  anim.atriumWater = water;

  // Atrium overhangs
  buildAtrium(grp, px, pz, m.wCeil, m.skyLight);

  // Flamingo
  const flamingo=makeFlamingo(m.pink, m.dark);
  flamingo.position.set(px+3.5, 0.18, pz+1); flamingo.rotation.y=-0.6;
  grp.add(flamingo); anim.flamingo=flamingo;

  // Lighting
  grp.add(new THREE.AmbientLight(0xe8f2f5, 1.6));
  grp.add(new THREE.HemisphereLight(0xd4eef8, 0xc8dcd6, 0.9));
  const poolGlow=new THREE.PointLight(0x30c8c0,2.2,14,2);
  poolGlow.position.set(px,0.08,pz); grp.add(poolGlow); anim.poolGlow=poolGlow;
  const skyBeam=new THREE.PointLight(0xdaf4ff,2.8,18,1.6);
  skyBeam.position.set(px,H+5,pz); grp.add(skyBeam);
}

// ── ZONE A  Arch Corridor  (width 10, Z: -22 to -70) ─────────
// Connects south → Zone E north opening
// Corridor runs north-south: from Z=-22 to Z=-70, centered X=0
function buildZoneA(grp, walls, m) {
  const CW=10, H=WALL_HEIGHT;
  const zStart=-22, zEnd=-70;
  const D=Math.abs(zEnd-zStart); // 48
  const cz=(zStart+zEnd)/2; // -46
  const hw=CW/2;

  // Floor + ceiling
  addPlane(grp, CW, D, m.wFloor, 0, 0,    cz, -Math.PI/2);
  addPlane(grp, CW, D, m.wCeil,  0, H, cz,  Math.PI/2);

  // North cap wall
  addPlane(grp, CW, H, m.wWall, 0, H/2, zEnd, 0,0);
  addWallAABB(walls, -hw-0.3, zEnd-0.3, hw+0.3, zEnd);

  // East wall (solid)
  addPlane(grp, D, H, m.wWall, hw, H/2, cz, 0, -Math.PI/2);
  addWallAABB(walls, hw, zEnd-0.3, hw+0.3, zStart+0.3);

  // West wall (solid)
  addPlane(grp, D, H, m.wWall, -hw, H/2, cz, 0, Math.PI/2);
  addWallAABB(walls, -hw-0.3, zEnd-0.3, -hw, zStart+0.3);

  // NO south wall — opens into Zone E

  // Arched alcoves on the east side (every ~7 units)
  const alcoveCount = 6;
  for (let i=0; i<alcoveCount; i++) {
    const az = zEnd + 5 + i*7.5;
    if (az >= zStart) break;
    // Alcove recess box (pushed into east wall)
    addBox(grp, 0.9, H*0.88, 2.4, m.wWall, hw+0.4, H*0.88/2, az);
    // Arch frame
    addArch(grp, hw, 0, az, 2.8, H*0.82, m.wWall, -Math.PI/2);
  }

  // Ceiling strip lights
  for (let i=0; i<5; i++) {
    const lz = zEnd + 6 + i*9;
    addPlane(grp, CW-2, 0.5, m.strip, 0, H-0.03, lz, Math.PI/2);
    const stripLight=new THREE.PointLight(0xe8f8ff, 1.2, 12, 2);
    stripLight.position.set(0, H-0.2, lz); grp.add(stripLight);
  }

  // Shallow water strip along east side
  addPlane(grp, 1.5, D-4, m.tealW, hw-0.8, 0.04, cz, -Math.PI/2);
}

// ── CONNECTOR  E→B  (west from atrium X: -18 to -30, Z: -3 to +3) ──
function buildConnectorEB(grp, walls, m) {
  const CW=6, H=WALL_HEIGHT;
  const xStart=-18, xEnd=-30;
  const D=Math.abs(xEnd-xStart); // 12
  const cx=(xStart+xEnd)/2;     // -24

  addPlane(grp, D, CW, m.wFloor, cx, 0,    0, -Math.PI/2);
  addPlane(grp, D, CW, m.wCeil,  cx, H, 0,  Math.PI/2);

  // North + South short walls
  addPlane(grp, D, H, m.wWall, cx, H/2, -CW/2, 0,0);
  addWallAABB(walls, xEnd-0.3, -CW/2-0.3, xStart+0.3, -CW/2);
  addPlane(grp, D, H, m.wWall, cx, H/2,  CW/2, 0, Math.PI);
  addWallAABB(walls, xEnd-0.3, CW/2, xStart+0.3, CW/2+0.3);
  // West cap connects into Zone B — no wall
  // East opens into Zone E — no wall
}

// ── ZONE B  Dark Cistern  (circle radius 16, center -46, 0) ──
function buildZoneB(grp, walls, m, anim) {
  const cx=-46, cz=0, R=16, H=WALL_HEIGHT+4;

  // Cylinder walls
  const wallGeo=new THREE.CylinderGeometry(R,R,H,56,1,true);
  const wallMesh=new THREE.Mesh(wallGeo,m.bWall);
  wallMesh.position.set(cx,H/2,cz); grp.add(wallMesh);

  // Dome cap
  const domeGeo=new THREE.SphereGeometry(R,56,28,0,Math.PI*2,0,Math.PI/2);
  const dome=new THREE.Mesh(domeGeo,m.bCeil);
  dome.position.set(cx,H,cz); grp.add(dome);

  // Floor
  addPlane(grp, R*2, R*2, m.bFloor, cx, 0.01, cz, -Math.PI/2);

  // Round pool
  const poolGeo=new THREE.CircleGeometry(9,64);
  const pool=new THREE.Mesh(poolGeo, m.greenW);
  pool.rotation.x=-Math.PI/2; pool.position.set(cx,0.15,cz); grp.add(pool);
  anim.cisternPool=pool;

  // Pool lip ring
  const lip=new THREE.Mesh(new THREE.TorusGeometry(9.1,0.22,10,64),m.bWall);
  lip.rotation.x=Math.PI/2; lip.position.set(cx,0.22,cz); grp.add(lip);

  // Niche arches x8
  for (let i=0;i<8;i++) {
    const angle=(i/8)*Math.PI*2;
    const nx=cx+Math.cos(angle)*(R-0.3), nz=cz+Math.sin(angle)*(R-0.3);
    addArch(grp, nx, 0, nz, 2.6, H*0.45, m.bWall, -angle+Math.PI/2);
    const niLight=new THREE.PointLight(0x20c8a0,1.6,9,2);
    niLight.position.set(cx+Math.cos(angle)*(R*0.7), H*0.22, cz+Math.sin(angle)*(R*0.7));
    grp.add(niLight);
  }

  // Approximate collision with 12-gon
  for (let i=0;i<12;i++) {
    const a0=(i/12)*Math.PI*2, a1=((i+1)/12)*Math.PI*2;
    const x0=cx+Math.cos(a0)*R, z0=cz+Math.sin(a0)*R;
    const x1=cx+Math.cos(a1)*R, z1=cz+Math.sin(a1)*R;
    addWallAABB(walls, Math.min(x0,x1)-0.5, Math.min(z0,z1)-0.5, Math.max(x0,x1)+0.5, Math.max(z0,z1)+0.5);
  }

  // Lights
  const amb=new THREE.PointLight(0x0a4840,2.5,R*2.2,1.8);
  amb.position.set(cx,H*0.6,cz); grp.add(amb);
  const glow=new THREE.PointLight(0x10c888,2.8,14,2);
  glow.position.set(cx,0.1,cz); grp.add(glow); anim.cisternGlow=glow;

  // Opening East (toward connector EB, at angle 0 rad = east)
  // The wall mesh is open by default (cylinder geometry is open)
  // Just need to leave collision gap at east (angle 0, x=cx+R)
  // Already handled by 12-gon — the east-most segment is the gap
}

// ── CONNECTOR  B→C  (south from cistern, X: -49 to -43, Z: 16 to 30) ──
function buildConnectorBC(grp, walls, m) {
  const CW=8, H=WALL_HEIGHT;
  const xc=-46, zStart=16, zEnd=30;
  const D=Math.abs(zEnd-zStart);
  const cz=(zStart+zEnd)/2;

  addPlane(grp, CW, D, m.bFloor, xc, 0,    cz, -Math.PI/2);
  addPlane(grp, CW, D, m.bCeil,  xc, H, cz,  Math.PI/2);
  addPlane(grp, D, H, m.bWall, xc-CW/2, H/2, cz, 0, Math.PI/2);
  addWallAABB(walls, xc-CW/2-0.3, zStart-0.3, xc-CW/2, zEnd+0.3);
  addPlane(grp, D, H, m.bWall, xc+CW/2, H/2, cz, 0, -Math.PI/2);
  addWallAABB(walls, xc+CW/2, zStart-0.3, xc+CW/2+0.3, zEnd+0.3);
}

// ── ZONE C  Flooded Court  (30×22 open-sky, center -46, +44) ──
function buildZoneC(grp, walls, m) {
  const cx=-46, cz=44, W=30, D=22, H=WALL_HEIGHT+2;
  const hw=W/2, hd=D/2;

  // Floor tile + water overlay
  addPlane(grp, W, D, m.sFloor, cx, 0.01, cz, -Math.PI/2);
  addPlane(grp, W, D, m.tealW,  cx, 0.12, cz, -Math.PI/2);

  // Walls (no ceiling — open sky)
  addPlane(grp, W, H, m.sWall, cx, H/2, cz-hd);                  addWallAABB(walls, cx-hw-0.3, cz-hd-0.3, cx+hw+0.3, cz-hd);
  addPlane(grp, W, H, m.sWall, cx, H/2, cz+hd, 0, Math.PI);      addWallAABB(walls, cx-hw-0.3, cz+hd,     cx+hw+0.3, cz+hd+0.3);
  addPlane(grp, D, H, m.sWall, cx-hw, H/2, cz, 0, Math.PI/2);    addWallAABB(walls, cx-hw-0.3, cz-hd-0.3, cx-hw, cz+hd+0.3);
  addPlane(grp, D, H, m.sWall, cx+hw, H/2, cz, 0, -Math.PI/2);   addWallAABB(walls, cx+hw, cz-hd-0.3, cx+hw+0.3, cz+hd+0.3);

  // Diagonal overhang at NE corner
  addBox(grp, 14, 0.5, 10, m.sWall, cx+hw-5, H, cz-hd+4, Math.PI/6);

  // Open sky plane (emissive)
  addPlane(grp, W, D, m.openSky, cx, H+0.2, cz, Math.PI/2);

  // Sunlight
  const sun=new THREE.DirectionalLight(0xfff4d0,2.2);
  sun.position.set(cx+8,20,cz-6); sun.target.position.set(cx,0,cz);
  grp.add(sun); grp.add(sun.target);
  const fill=new THREE.PointLight(0xa8d4e8,0.8,W*1.5,1.5);
  fill.position.set(cx,H,cz); grp.add(fill);
}

// ── CONNECTOR  E→D  (south from atrium, X: -3 to +3, Z: +18 to +30) ──
function buildConnectorED(grp, walls, m) {
  const CW=6, H=WALL_HEIGHT;
  const zStart=18, zEnd=30, cx=0;
  const D=Math.abs(zEnd-zStart), cz=(zStart+zEnd)/2;

  addPlane(grp, CW, D, m.wFloor, cx, 0,    cz, -Math.PI/2);
  addPlane(grp, CW, D, m.wCeil,  cx, H, cz,  Math.PI/2);
  addPlane(grp, D, H, m.wWall, cx-CW/2, H/2, cz, 0, Math.PI/2);
  addWallAABB(walls, cx-CW/2-0.3, zStart-0.3, cx-CW/2, zEnd+0.3);
  addPlane(grp, D, H, m.wWall, cx+CW/2, H/2, cz, 0, -Math.PI/2);
  addWallAABB(walls, cx+CW/2, zStart-0.3, cx+CW/2+0.3, zEnd+0.3);
}

// ── ZONE D  Sunset Gallery  (width 12, Z: +30 to +88) ────────
// Portal is behind a small arch at the far (north) end, Z=+91
function buildZoneD(grp, walls, m, portalRef, anim) {
  const CW=12, H=WALL_HEIGHT, hw=CW/2;
  const zStart=30, zEnd=88;
  const D=Math.abs(zEnd-zStart), cz=(zStart+zEnd)/2;

  // Floor + ceiling
  addPlane(grp, CW, D, m.oFloor, 0, 0,    cz, -Math.PI/2);
  addPlane(grp, CW, D, m.oCeil,  0, H, cz,  Math.PI/2);

  // North cap (dead end)
  addPlane(grp, CW, H, m.oWall, 0, H/2, zEnd);
  addWallAABB(walls, -hw-0.3, zEnd, hw+0.3, zEnd+0.3);

  // East wall
  addPlane(grp, D, H, m.oWall,  hw, H/2, cz, 0, -Math.PI/2);
  addWallAABB(walls,  hw, zStart-0.3,  hw+0.3, zEnd+0.3);

  // West wall
  addPlane(grp, D, H, m.oWall, -hw, H/2, cz, 0, Math.PI/2);
  addWallAABB(walls, -hw-0.3, zStart-0.3, -hw, zEnd+0.3);

  // NO south wall — open to connector

  // Pillars (both sides)
  for (let i=0;i<7;i++) {
    const pz=zStart+5+i*8;
    addBox(grp, 0.7, H, 0.7, m.oWall,  hw-0.35, H/2, pz);
    addBox(grp, 0.7, H, 0.7, m.oWall, -hw+0.35, H/2, pz);
  }

  // Ceiling emissive light strips (orange glow through "windows")
  for (let i=0;i<6;i++) {
    const lz=zStart+4+i*9;
    addPlane(grp, 1.0, CW-2, m.sunGlow, 0, H-0.04, lz, Math.PI/2);
    const sl=new THREE.PointLight(0xff7040,1.8,14,2);
    sl.position.set(0,H-0.3,lz); grp.add(sl);
  }

  // Narrow reflective pool down center
  addPlane(grp, 2.5, D-6, m.tealW, 0, 0.06, cz, -Math.PI/2);

  // Small arch door at far end (above portal)
  addArch(grp, 0, 0, zEnd-1, 3.5, H*0.75, m.oWall, Math.PI);

  // Purple atmosphere toward far end
  const haze=new THREE.PointLight(0x8830c0,1.5,18,2);
  haze.position.set(0,H/2,zEnd-4); grp.add(haze);

  // ── PORTAL  (just beyond the arch, Z=+92) ──
  const pz=92;
  const portalGrp=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9,0.2,16,64), m.portalRing);
  portalGrp.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.7,64), m.portalDisc);
  portalGrp.add(disc);
  portalGrp.position.set(0, H*0.38, pz);
  grp.add(portalGrp);
  anim.portal=portalGrp;

  portalRef.pos    = new THREE.Vector3(0, H*0.38, pz);
  portalRef.radius = 2.5;

  const pLight=new THREE.PointLight(0x00ffcc,4.0,12,2);
  pLight.position.set(0,H*0.38,pz); grp.add(pLight); anim.portalLight=pLight;
}

// ─────────────────────────────────────────────────────────────
// POOL LEVEL CLASS
// ─────────────────────────────────────────────────────────────

export class PoolLevel {
  constructor() {
    this.group  = new THREE.Group();
    this.walls  = [];
    this._anim  = {};
    this._portal = {};
    this._phase = 0;

    this.flickerLights = [];

    const m = buildMaterials();
    buildZoneE(this.group, this.walls, m, this._anim);
    buildConnectorEB(this.group, this.walls, m);
    buildZoneA(this.group, this.walls, m);
    buildZoneB(this.group, this.walls, m, this._anim);
    buildConnectorBC(this.group, this.walls, m);
    buildZoneC(this.group, this.walls, m);
    buildConnectorED(this.group, this.walls, m);
    buildZoneD(this.group, this.walls, m, this._portal, this._anim);
  }

  // Player spawns at center of atrium, facing north
  get spawnWorldPosition() { return new THREE.Vector3(0, 0, 0); }

  get portalWorldPos()      { return this._portal.pos || new THREE.Vector3(0, 0, 9999); }

  playerAtPortal(playerPos) {
    if (!this._portal.pos) return false;
    return playerPos.distanceTo(this._portal.pos) < this._portal.radius;
  }

  // Monster proxy — open-world direct pursuit (no grid)
  get maze() { return this; }
  get grid()  { return null; }
  randomOpenCellFar(playerPos, minDist=20) {
    const spots=[
      new THREE.Vector3(0,0,-50),   // Zone A
      new THREE.Vector3(-46,0,0),   // Zone B
      new THREE.Vector3(-46,0,44),  // Zone C
      new THREE.Vector3(0,0,60),    // Zone D
    ];
    for (const s of spots) if (s.distanceTo(playerPos)>=minDist) return s;
    return spots[0];
  }
  cellToWorld(cx,cy) { return new THREE.Vector3(cx,0,cy); }

  updateFlicker(t) {
    if (this._anim.poolGlow)     this._anim.poolGlow.intensity     = 2.0+Math.sin(t*1.4)*0.3;
    if (this._anim.cisternGlow)  this._anim.cisternGlow.intensity  = 2.4+Math.sin(t*0.9+1.2)*0.5;
    if (this._anim.portalLight)  this._anim.portalLight.intensity  = 3.5+Math.sin(t*3.0)*1.0;
  }

  update(dt) {
    this._phase += dt;
    if (this._anim.flamingo) {
      this._anim.flamingo.position.y = 0.18+Math.sin(this._phase*0.8)*0.025;
      this._anim.flamingo.rotation.y += dt*0.12;
    }
    if (this._anim.atriumWater) {
      this._anim.atriumWater.material.opacity = 0.74+Math.sin(this._phase*1.1)*0.05;
    }
    if (this._anim.cisternPool) {
      this._anim.cisternPool.material.opacity = 0.80+Math.sin(this._phase*0.7+0.5)*0.06;
    }
    if (this._anim.portal) {
      this._anim.portal.rotation.z += dt*0.9;
      const s=1.0+Math.sin(this._phase*2.5)*0.05;
      this._anim.portal.scale.set(s,s,1);
    }
  }

  setInsanity(_t) {}
}
