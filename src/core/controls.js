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

    // ── Touch / mobile support ──────────────────────────────
    // When true, update() runs gameplay even without pointer lock
    // (mobile has no pointer-lock concept). Set by main.js once
    // touch controls are wired up.
    this.touchActive  = false;
    this.touchMove    = { x: 0, z: 0 }; // virtual joystick vector, same convention as WASD dir
    this.touchSprint  = false;
    this.lookSensitivity = 0.0028;
    this._lookEuler   = new THREE.Euler(0, 0, 0, 'YXZ');

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
  lock()   { if (this.touchActive) return; try { this.controls.lock(); } catch (e) { /* pointer lock unsupported, ignore */ } }
  unlock() { if (this.touchActive) return; try { this.controls.unlock(); } catch (e) { /* ignore */ } }

  /** True when gameplay should run: desktop pointer-lock OR mobile touch mode. */
  get isActive() { return this.isLocked || this.touchActive; }

  /** Set virtual joystick vector. x: -1(left)..1(right), z: -1(forward)..1(back). */
  setVirtualMove(x, z) {
    this.touchMove.x = x;
    this.touchMove.z = z;
  }

  setTouchSprint(on) { this.touchSprint = on; }

  toggleFlashlight() { this.flashlightOn = !this.flashlightOn; }

  /**
   * Rotate the camera directly by a screen-space drag delta. Mirrors
   * PointerLockControls' internal math so it behaves consistently
   * whether driven by mouse (locked) or touch (unlocked) input.
   */
  lookBy(dx, dy) {
    this._lookEuler.setFromQuaternion(this.camera.quaternion);
    this._lookEuler.y -= dx * this.lookSensitivity;
    this._lookEuler.x -= dy * this.lookSensitivity;
    const eps = 0.001;
    this._lookEuler.x = Math.max(-Math.PI / 2 + eps, Math.min(Math.PI / 2 - eps, this._lookEuler.x));
    this.camera.quaternion.setFromEuler(this._lookEuler);
  }

  setSpawn(pos) {
    this.object.position.set(pos.x, this._baseY, pos.z);
  }

  /** Returns true if player moved this frame. */
  update(dt) {
    // Smooth flashlight
    this.flashlight.intensity +=
      ((this.flashlightOn ? 1.6 : 0) - this.flashlight.intensity) * 0.15;

    if (!this.isActive) return false;

    const dir = new THREE.Vector3();
    if (this.keys['KeyW']) dir.z -= 1;
    if (this.keys['KeyS']) dir.z += 1;
    if (this.keys['KeyA']) dir.x -= 1;
    if (this.keys['KeyD']) dir.x += 1;

    // Virtual joystick (mobile) — additive so a future gamepad/keyboard
    // combo still works, then re-clamped via normalize() below.
    dir.x += this.touchMove.x;
    dir.z += this.touchMove.z;

    const moving = dir.lengthSq() > 0.0001;
    const sprinting = moving && (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchSprint);
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

    if (moving) {
      // Clamp to length 1 instead of always normalizing to exactly 1,
      // so a partially-pushed virtual joystick still feels analog.
      if (dir.length() > 1) dir.normalize();
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