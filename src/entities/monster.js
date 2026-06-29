// src/entities/monster.js
// Hunts the player using a simple A* pathfinder on the maze grid.
// Falls back to straight-line if path is clear; otherwise navigates corridors.
import * as THREE from 'three';
import { CELL, GRID_W, GRID_H } from '../environment/maze.js';

function heuristic(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export class Monster {
  constructor(maze, materials, { speed = 3.2, catchDistance = 1.0 } = {}) {
    this.maze = maze;
    this.speed = speed;
    this.catchDistance = catchDistance;
    this.active = false;

    // Path state
    this.path = [];
    this.pathTimer = 0;
    this.PATH_INTERVAL = 0.6; // re-path every 0.6 s

    this.mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.4, 4, 8), materials.entityMat);
    this.mesh.visible = false;
    maze.group.add(this.mesh);
  }

  activate(playerPos) {
    this.active = true;
    this.mesh.visible = true;
    this.respawnFarFrom(playerPos);
    this.path = [];
    this.pathTimer = 0;
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
    this.path = [];
  }

  respawnFarFrom(playerPos, minDist = 32) {
    const spot = this.maze.randomOpenCellFar(playerPos, minDist);
    if (spot) this.mesh.position.set(spot.x, 1.0, spot.z);
  }

  // Convert world pos → grid cell
  _worldToCell(wx, wz) {
    const cx = Math.round(wx / CELL + GRID_W / 2);
    const cy = Math.round(wz / CELL + GRID_H / 2);
    return [
      Math.max(1, Math.min(GRID_W - 2, cx)),
      Math.max(1, Math.min(GRID_H - 2, cy))
    ];
  }

  // A* on the maze grid (4-directional)
  _findPath(fromWorld, toWorld) {
    const [sx, sy] = this._worldToCell(fromWorld.x, fromWorld.z);
    const [gx, gy] = this._worldToCell(toWorld.x, toWorld.z);
    const grid = this.maze.grid;

    if (sx === gx && sy === gy) return [];

    const key = (x, y) => x * 1000 + y;
    const open = new Map();
    const closed = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    const startKey = key(sx, sy);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(sx, sy, gx, gy));
    open.set(startKey, [sx, sy]);

    let iterations = 0;
    while (open.size > 0 && iterations < 400) {
      iterations++;
      // Pick lowest fScore node
      let bestKey = null, bestF = Infinity;
      for (const [k] of open) {
        const f = fScore.get(k) ?? Infinity;
        if (f < bestF) { bestF = f; bestKey = k; }
      }
      const [cx, cy] = open.get(bestKey);
      if (cx === gx && cy === gy) {
        // Reconstruct path as world positions
        const path = [];
        let cur = bestKey;
        while (cameFrom.has(cur)) {
          const [nx, ny] = cameFrom.get(cur).cell;
          path.unshift(this.maze.cellToWorld(cx, cy));
          cur = cameFrom.get(cur).from;
        }
        // Build proper path
        const fullPath = [];
        let c2 = bestKey;
        while (cameFrom.has(c2)) {
          const entry = cameFrom.get(c2);
          const [pcx, pcy] = entry.cell;
          fullPath.unshift(this.maze.cellToWorld(pcx, pcy));
          c2 = entry.from;
        }
        return fullPath;
      }

      open.delete(bestKey);
      closed.add(bestKey);

      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (grid[nx]?.[ny] === 0) continue; // wall
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;
        const tentG = (gScore.get(bestKey) ?? Infinity) + 1;
        if (tentG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, { from: bestKey, cell: [nx, ny] });
          gScore.set(nk, tentG);
          fScore.set(nk, tentG + heuristic(nx, ny, gx, gy));
          open.set(nk, [nx, ny]);
        }
      }
    }
    return []; // no path found
  }

  update(dt, playerPos) {
    if (!this.active) return { proximity: 0, caught: false };

    const myPos = this.mesh.position;

    // Periodically recompute path
    this.pathTimer -= dt;
    if (this.pathTimer <= 0) {
      this.pathTimer = this.PATH_INTERVAL;
      this.path = this._findPath(myPos, playerPos);
    }

    // Decide movement direction
    let targetPos;
    if (this.path.length > 0) {
      // Move toward next waypoint
      const wp = this.path[0];
      const dx = wp.x - myPos.x;
      const dz = wp.z - myPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 0.6) {
        this.path.shift(); // reached waypoint
      }
      targetPos = wp;
    } else {
      // Direct line if no path (clear line of sight or start)
      targetPos = playerPos;
    }

    const toTarget = new THREE.Vector3().subVectors(targetPos, myPos);
    toTarget.y = 0;
    const distToTarget = toTarget.length();
    if (distToTarget > 0.01) {
      toTarget.normalize();
      myPos.addScaledVector(toTarget, this.speed * dt);
    }
    myPos.y = 1.0;
    this.mesh.lookAt(playerPos.x, 1.0, playerPos.z);

    const distToPlayer = myPos.distanceTo(new THREE.Vector3(playerPos.x, 1.0, playerPos.z));
    const proximity = THREE.MathUtils.clamp(1 - distToPlayer / 14, 0, 1);
    return { proximity, caught: distToPlayer < this.catchDistance };
  }
}
