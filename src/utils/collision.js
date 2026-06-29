// src/utils/collision.js
// Simple circle-vs-AABB collision resolution used for the player and any
// other capsule-like actor moving through the maze's wall list.

export const PLAYER_RADIUS = 0.35;

// Pushes `pos` (a THREE.Vector3, only x/z used) out of any overlapping wall
// AABB from `walls` (array of { min: Vector2, max: Vector2 }).
export function collideAndResolve(pos, walls, radius = PLAYER_RADIUS) {
  for (const w of walls) {
    const closestX = Math.max(w.min.x, Math.min(pos.x, w.max.x));
    const closestZ = Math.max(w.min.y, Math.min(pos.z, w.max.y));
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const overlap = radius - dist;
      pos.x += (dx / dist) * overlap;
      pos.z += (dz / dist) * overlap;
    }
  }
}
