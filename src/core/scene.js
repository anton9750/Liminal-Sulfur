// src/core/scene.js
// Owns the THREE.Scene, camera, renderer, and base lighting/fog. Keeps all
// the "engine plumbing" out of main.js.
import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3a3417);
    this.scene.fog = new THREE.FogExp2(0x4a4420, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.05, 200
    );
    this.camera.position.set(0, 1.7, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    document.body.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x554d28, 0.55));

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  add(obj) {
    this.scene.add(obj);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
