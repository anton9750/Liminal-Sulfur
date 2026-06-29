// src/environment/maze.js
// Procedural backrooms maze: grid generation (recursive backtracker +
// irregular carve), the Pool Rooms zone, all static geometry, and the
// flickering fluorescent lights along the corridors.
import * as THREE from 'three';
import { buildMaterials } from './textures.js';

export const CELL = 4;            // size of one grid cell in world units
export const GRID_W = 41;          // must be odd for the maze algorithm
export const GRID_H = 41;
export const WALL_HEIGHT = 3.2;
export const POOL_ZONE_SIZE = 9;   // pool rooms occupy a square zone of cells

export class Maze {
  constructor() {
    this.cols = GRID_W;
    this.rows = GRID_H;
    this.grid = new Array(this.cols).fill(0).map(() => new Array(this.rows).fill(0));
    this.walls = [];          // AABBs for collision: { min: Vector2, max: Vector2 }
    this.flickerLights = [];  // { light, baseIntensity, fixture, phase }
    this.group = new THREE.Group();

    this.materials = buildMaterials({ gridW: GRID_W, gridH: GRID_H, poolZoneSize: POOL_ZONE_SIZE });

    this._carveMaze();
    this._carvePoolZone();
    this._buildGeometry();
    this._placeLights();
  }

  cellToWorld(cx, cy) {
    return new THREE.Vector3((cx - this.cols / 2) * CELL, 0, (cy - this.rows / 2) * CELL);
  }

  get spawnWorldPosition() {
    return this.cellToWorld(1, 1);
  }

  // ---------------------------------------------------------------------
  // GENERATION
  // ---------------------------------------------------------------------
  _carveMaze() {
    const { cols, rows, grid } = this;
    const visited = new Array(cols).fill(0).map(() => new Array(rows).fill(false));
    const stack = [];
    let cx = 1, cy = 1;
    grid[cx][cy] = 1;
    visited[cx][cy] = true;
    stack.push([cx, cy]);

    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];

    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const options = [];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !visited[nx][ny]) {
          options.push([nx, ny, dx, dy]);
        }
      }
      if (options.length === 0) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = options[Math.floor(Math.random() * options.length)];
      grid[x + dx / 2][y + dy / 2] = 1;
      grid[nx][ny] = 1;
      visited[nx][ny] = true;
      stack.push([nx, ny]);
    }

    // Irregularize: randomly knock down extra walls to create wider rooms /
    // long halls instead of a perfectly uniform maze (classic backrooms feel)
    for (let x = 1; x < cols - 1; x++) {
      for (let y = 1; y < rows - 1; y++) {
        if (grid[x][y] === 0 && Math.random() < 0.12) {
          const openNeighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            .filter(([dx, dy]) => grid[x + dx]?.[y + dy] === 1).length;
          if (openNeighbors >= 2) grid[x][y] = 1;
        }
      }
    }
  }

  _carvePoolZone() {
    const { cols, rows, grid } = this;
    this.poolStartX = cols - POOL_ZONE_SIZE - 2;
    this.poolStartY = rows - POOL_ZONE_SIZE - 2;

    for (let x = this.poolStartX; x < this.poolStartX + POOL_ZONE_SIZE; x++) {
      for (let y = this.poolStartY; y < this.poolStartY + POOL_ZONE_SIZE; y++) {
        grid[x][y] = 2; // 2 = pool room floor
      }
    }
    // carve a connecting corridor from the maze into the pool zone
    const corridorY = this.poolStartY + Math.floor(POOL_ZONE_SIZE / 2);
    for (let x = 1; x < this.poolStartX + 1; x++) {
      if (grid[x][corridorY] === 0) grid[x][corridorY] = 1;
    }
  }

  // ---------------------------------------------------------------------
  // GEOMETRY
  // ---------------------------------------------------------------------
  _buildGeometry() {
    const { cols, rows, grid, materials, group } = this;

    // Floor + ceiling spanning the whole grid
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(cols * CELL, rows * CELL), materials.carpetMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(cols * CELL, rows * CELL), materials.ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, WALL_HEIGHT, 0);
    group.add(ceiling);

    // Pool room floor overlay + water + pillars
    const poolWorldCenter = this.cellToWorld(
      this.poolStartX + POOL_ZONE_SIZE / 2,
      this.poolStartY + POOL_ZONE_SIZE / 2
    );
    this.poolWorldCenter = poolWorldCenter;

    const poolFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ZONE_SIZE * CELL, POOL_ZONE_SIZE * CELL),
      materials.poolFloorMat
    );
    poolFloor.rotation.x = -Math.PI / 2;
    poolFloor.position.set(poolWorldCenter.x, -0.05, poolWorldCenter.z);
    group.add(poolFloor);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL_ZONE_SIZE * CELL * 0.7, POOL_ZONE_SIZE * CELL * 0.7),
      materials.waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(poolWorldCenter.x, 0.08, poolWorldCenter.z);
    group.add(water);

    for (let i = 0; i < 10; i++) {
      const px = poolWorldCenter.x + (Math.random() - 0.5) * POOL_ZONE_SIZE * CELL * 0.8;
      const pz = poolWorldCenter.z + (Math.random() - 0.5) * POOL_ZONE_SIZE * CELL * 0.8;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, WALL_HEIGHT, 0.8), materials.pillarMat);
      pillar.position.set(px, WALL_HEIGHT / 2, pz);
      group.add(pillar);
      this.walls.push({ min: new THREE.Vector2(px - 0.5, pz - 0.5), max: new THREE.Vector2(px + 0.5, pz + 0.5) });
    }

    // Walls: one box per wall cell, instanced for performance. Also collect
    // AABBs for simple tile-based collision.
    const wallInstances = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (grid[x][y] === 0) wallInstances.push(this.cellToWorld(x, y));
      }
    }

    const wallGeo = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);
    const wallMesh = new THREE.InstancedMesh(wallGeo, materials.wallMat, wallInstances.length);
    const dummy = new THREE.Object3D();
    wallInstances.forEach((pos, i) => {
      dummy.position.set(pos.x, WALL_HEIGHT / 2, pos.z);
      dummy.updateMatrix();
      wallMesh.setMatrixAt(i, dummy.matrix);
      this.walls.push({
        min: new THREE.Vector2(pos.x - CELL / 2, pos.z - CELL / 2),
        max: new THREE.Vector2(pos.x + CELL / 2, pos.z + CELL / 2)
      });
    });
    group.add(wallMesh);
  }

  // ---------------------------------------------------------------------
  // LIGHTING — flickering fluorescent ceiling lights along corridors
  // ---------------------------------------------------------------------
  _placeLights() {
    const { cols, rows, grid, group, materials } = this;
    for (let x = 2; x < cols - 2; x += 4) {
      for (let y = 2; y < rows - 2; y += 4) {
        if (grid[x][y] !== 0) {
          const pos = this.cellToWorld(x, y);
          const light = new THREE.PointLight(0xfff3c4, 1.1, CELL * 5, 2);
          light.position.set(pos.x, WALL_HEIGHT - 0.3, pos.z);
          group.add(light);

          const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(CELL * 0.6, 0.08, 0.6),
            materials.fixtureMat
          );
          fixture.position.set(pos.x, WALL_HEIGHT - 0.1, pos.z);
          group.add(fixture);

          this.flickerLights.push({ light, baseIntensity: light.intensity, fixture, phase: Math.random() * 100 });
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // PER-FRAME UPDATE
  // ---------------------------------------------------------------------
  updateFlicker(timeSeconds) {
    const ins = this._insanity ?? 0;
    this.flickerLights.forEach(fl => {
      const flicker = Math.sin(timeSeconds * 30 + fl.phase) * Math.sin(timeSeconds * 7 + fl.phase);
      const dropChance = 0.003 + ins * 0.035;
      const dropout = Math.random() < dropChance ? (ins > 0.5 ? 0 : 0.05) : 1;
      fl.light.intensity = Math.max(0, fl.baseIntensity * (0.85 + 0.15 * flicker) * dropout);
      fl.fixture.material.emissiveIntensity = 1.2 * (fl.light.intensity / fl.baseIntensity);
    });
  }

  // Picks a random open cell at least minDist world units from a reference point.
  randomOpenCellFar(referencePos, minDist, maxTries = 60) {
    let tries = 0;
    while (tries < maxTries) {
      const ex = 1 + Math.floor(Math.random() * (this.cols - 2));
      const ey = 1 + Math.floor(Math.random() * (this.rows - 2));
      if (this.grid[ex][ey] !== 0) {
        const wpos = this.cellToWorld(ex, ey);
        if (wpos.distanceTo(referencePos) > minDist) return wpos;
      }
      tries++;
    }
    return null;
  }

  // ── Insanity-driven flicker intensity ─────────────────────────────
  setInsanity(t) {
    this._insanity = Math.max(0, Math.min(1, t));
  }
}
