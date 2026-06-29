// src/environment/props.js
// Scattered environment props: moldy chairs, tables, cardboard boxes,
// sticky notes, and the exit portal at the Pool Rooms entrance.
import * as THREE from 'three';
import { CELL, WALL_HEIGHT } from './maze.js';

// ── Note textures ────────────────────────────────────────────────────────────
function makeNoteTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8de9a';
  ctx.fillRect(0, 0, 256, 192);
  // Aged stain
  ctx.fillStyle = 'rgba(100,80,20,0.15)';
  ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = '#2a1f00';
  ctx.font = 'bold 13px Courier New';
  ctx.textBaseline = 'top';
  const words = text.split(' ');
  let line = '', y = 14, maxW = 228;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, 14, y); y += 18; line = w;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, 14, y);
  return new THREE.CanvasTexture(c);
}

const NOTES = [
  "DO NOT STAY STILL. IT HEARS YOUR HEARTBEAT.",
  "Level 0. If you find this, keep walking. The exit is real.",
  "I've counted 212 left turns. It doesn't help.",
  "The lights going out means it's close. RUN.",
  "Pool Rooms exit: follow the humming. Lower pitch = closer.",
  "Day 4. The hum sounds like breathing now.",
  "There are no windows. There is no outside.",
  "KEEP MOVING. DO NOT STOP. DO NOT LOOK BACK.",
];

// ── Chair geometry ─────────────────────────────────────────────────────────
function makeChair(matMoldy) {
  const g = new THREE.Group();
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), matMoldy);
  seat.position.set(0, 0.46, 0);
  g.add(seat);
  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.06), matMoldy);
  back.position.set(0, 0.75, -0.22);
  g.add(back);
  // Legs
  for (const [lx, lz] of [[0.2, 0.2],[-0.2, 0.2],[0.2,-0.2],[-0.2,-0.2]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), matMoldy);
    leg.position.set(lx, 0.23, lz);
    g.add(leg);
  }
  return g;
}

function makeTable(matMoldy) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.6), matMoldy);
  top.position.set(0, 0.75, 0);
  g.add(top);
  for (const [lx, lz] of [[0.43, 0.25],[-0.43, 0.25],[0.43,-0.25],[-0.43,-0.25]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), matMoldy);
    leg.position.set(lx, 0.375, lz);
    g.add(leg);
  }
  return g;
}

function makeBox(matBox) {
  const h = 0.3 + Math.random() * 0.2;
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 0.35), matBox);
  g.position.y = h / 2;
  return g;
}

// ── Exit portal ──────────────────────────────────────────────────────────────
function makeExitPortal() {
  const g = new THREE.Group();
  // Glowing arch frame
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x88ffcc, emissive: 0x44ffaa, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.9
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 3,
    transparent: true, opacity: 0.45, side: THREE.DoubleSide
  });

  // Portal inner face
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.8), innerMat);
  face.position.set(0, 1.4, 0);
  g.add(face);

  // Frame pillars
  for (const x of [-1.1, 1.1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 0.15), archMat);
    pillar.position.set(x, 1.5, 0);
    g.add(pillar);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.15), archMat);
  top.position.set(0, 3.0, 0);
  g.add(top);

  // Glow light
  const light = new THREE.PointLight(0x44ffaa, 2.0, 8, 2);
  light.position.set(0, 1.5, 0.5);
  g.add(light);

  return { group: g, light };
}

// ── Props manager ────────────────────────────────────────────────────────────
export class PropsManager {
  constructor(maze, sceneGroup) {
    this.maze = maze;
    this.group = sceneGroup;
    this.exitPortal = null;
    this.exitPortalWorldPos = null;

    this._moldyMat = new THREE.MeshStandardMaterial({ color: 0x5a4f2a, roughness: 1 });
    this._boxMat   = new THREE.MeshStandardMaterial({ color: 0x8a7555, roughness: 1 });

    this._placeProps();
    this._placeNotes();
    this._placeExitPortal();
  }

  _randomOpenCell(minX = 3, minY = 3) {
    for (let tries = 0; tries < 100; tries++) {
      const x = minX + Math.floor(Math.random() * (this.maze.cols - minX * 2));
      const y = minY + Math.floor(Math.random() * (this.maze.rows - minY * 2));
      if (this.maze.grid[x]?.[y] === 1) {
        return this.maze.cellToWorld(x, y);
      }
    }
    return null;
  }

  _placeProps() {
    // Scatter ~18 chairs, ~8 tables, ~12 boxes in open cells
    for (let i = 0; i < 18; i++) {
      const pos = this._randomOpenCell();
      if (!pos) continue;
      const chair = makeChair(this._moldyMat);
      const offset = (Math.random() - 0.5) * CELL * 0.5;
      chair.position.set(pos.x + offset, 0, pos.z + (Math.random() - 0.5) * CELL * 0.5);
      chair.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(chair);
    }
    for (let i = 0; i < 8; i++) {
      const pos = this._randomOpenCell();
      if (!pos) continue;
      const table = makeTable(this._moldyMat);
      table.position.set(pos.x, 0, pos.z);
      table.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(table);
    }
    for (let i = 0; i < 14; i++) {
      const pos = this._randomOpenCell();
      if (!pos) continue;
      const box = makeBox(this._boxMat);
      box.position.x = pos.x + (Math.random() - 0.5) * CELL * 0.4;
      box.position.z = pos.z + (Math.random() - 0.5) * CELL * 0.4;
      this.group.add(box);
    }
  }

  _placeNotes() {
    for (let i = 0; i < NOTES.length; i++) {
      const pos = this._randomOpenCell();
      if (!pos) continue;
      const noteMat = new THREE.MeshBasicMaterial({
        map: makeNoteTexture(NOTES[i]),
        side: THREE.DoubleSide
      });
      const noteMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.375), noteMat);
      // Place on wall: pick a random cardinal offset and lean against wall
      const wallOffset = 1.8;
      const angle = Math.floor(Math.random() * 4) * Math.PI / 2;
      noteMesh.position.set(
        pos.x + Math.sin(angle) * wallOffset,
        1.2 + Math.random() * 0.5,
        pos.z + Math.cos(angle) * wallOffset
      );
      noteMesh.rotation.y = angle;
      this.group.add(noteMesh);
    }
  }

  _placeExitPortal() {
    // Place exit at the pool zone corridor entrance
    const exitCellX = this.maze.poolStartX - 1;
    const exitCellY = this.maze.poolStartY + Math.floor(9 / 2); // same as corridor Y
    const worldPos = this.maze.cellToWorld(exitCellX, exitCellY);

    const { group, light } = makeExitPortal();
    group.position.set(worldPos.x, 0, worldPos.z);
    this.group.add(group);

    this.exitPortal      = group;
    this.exitLight       = light;
    this.exitPortalWorldPos = new THREE.Vector3(worldPos.x, 1.5, worldPos.z);

    // Pulse the portal light each frame
    this._portalPhase = 0;
  }

  update(dt) {
    if (!this.exitLight) return;
    this._portalPhase += dt * 2.5;
    this.exitLight.intensity = 1.5 + Math.sin(this._portalPhase) * 0.5;
  }

  // Returns true if player is inside the exit portal
  playerAtExit(playerPos, threshold = 1.8) {
    if (!this.exitPortalWorldPos) return false;
    const dx = playerPos.x - this.exitPortalWorldPos.x;
    const dz = playerPos.z - this.exitPortalWorldPos.z;
    return Math.sqrt(dx*dx + dz*dz) < threshold;
  }
}
