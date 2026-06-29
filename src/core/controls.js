// src/core/controls.js
// WASD + mouse-look with head bob, sprint, flashlight toggle,
// wall collision, and footstep timing.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { collideAndResolve } from '../utils/collision.js';

const WALK_SPEED   = 2.6;
const SPRINT_SPEED = 5.2;

export class PlayerController {
  constructor(camera, domElement, walls) {
    this.controls = new PointerLockControls(camera, domElement);
    this.camera   = camera;
    this.walls    = walls;

    this.keys           = {};
    this.flashlightOn   = true;

    // Head bob state
    this._bobTimer  = 0;
    this._bobAmount = 0;
    this._baseY     = 1.7;

    // Footstep timing
    this._stepTimer    = 0;
    this._stepInterval = 0.42; // walking step interval (s)
    this.onFootstep    = null; // callback set by main.js

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') this.flashlightOn = !this.flashlightOn;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // Flashlight spot-light attached to camera
    this.flashlight = new THREE.SpotLight(0xfff7e0, 0, 14, Math.PI / 6, 0.4, 1.2);
    this.flashlight.intensity = 0;
    camera.add(this.flashlight);
    this.flashlight.target.position.set(0, 0, -1);
    camera.add(this.flashlight.target);
  }

  get object() { return this.controls.getObject(); }
  get isLocked() { return this.controls.isLocked; }
  lock()   { this.controls.lock(); }
  unlock() { this.controls.unlock(); }

  setSpawn(pos) {
    this.object.position.set(pos.x, this._baseY, pos.z);
  }

  /** Returns true if player moved this frame. */
  update(dt) {
    // Smooth flashlight
    this.flashlight.intensity +=
      ((this.flashlightOn ? 1.6 : 0) - this.flashlight.intensity) * 0.15;

    if (!this.isLocked) return false;

    const dir = new THREE.Vector3();
    if (this.keys['KeyW']) dir.z -= 1;
    if (this.keys['KeyS']) dir.z += 1;
    if (this.keys['KeyA']) dir.x -= 1;
    if (this.keys['KeyD']) dir.x += 1;

    const moving = dir.lengthSq() > 0;
    const sprinting = moving && (this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

    if (moving) {
      dir.normalize();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(forward, -dir.z);
      moveVec.addScaledVector(right,    dir.x);
      moveVec.normalize().multiplyScalar(speed * dt);

      this.object.position.x += moveVec.x;
      this.object.position.z += moveVec.z;
      collideAndResolve(this.object.position, this.walls);

      // Head bob
      const bobSpeed  = sprinting ? 14 : 8;
      const bobHeight = sprinting ? 0.055 : 0.028;
      this._bobTimer += dt * bobSpeed;
      this._bobAmount = Math.sin(this._bobTimer) * bobHeight;

      // Footstep trigger
      const stepInterval = sprinting ? 0.28 : 0.42;
      this._stepTimer -= dt;
      if (this._stepTimer <= 0) {
        this._stepTimer = stepInterval;
        if (this.onFootstep) this.onFootstep();
      }
    } else {
      // Smoothly return head to neutral
      this._bobAmount *= 0.85;
    }

    this.object.position.y = this._baseY + this._bobAmount;
    return moving;
  }
}