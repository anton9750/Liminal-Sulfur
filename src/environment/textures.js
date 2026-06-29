// src/environment/textures.js
// Procedurally generates all canvas-based textures used by the maze, so no
// external image assets are needed.
import * as THREE from 'three';

export function makeWallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  // base sickly yellow wallpaper
  ctx.fillStyle = '#c9b66a';
  ctx.fillRect(0, 0, 256, 256);
  // noisy stains
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const r = Math.random() * 2.2;
    const shade = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(${120 + shade},${100 + shade},${50 + shade},${Math.random() * 0.25})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // faint vertical wallpaper seams
  ctx.strokeStyle = 'rgba(80,70,30,0.25)';
  for (let x = 0; x < 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

export function makeCarpetTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a7a3d';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const shade = Math.random() * 30 - 15;
    ctx.fillStyle = `rgba(${110 + shade},${95 + shade},${40 + shade},0.5)`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeCeilingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cfc89a';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(90,85,50,0.5)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 256; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  for (let y = 0; y <= 256; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makePoolTileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#dcd9c2';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(120,115,90,0.6)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  for (let y = 0; y <= 256; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Builds every texture + material the game needs in one call, with repeats
// already configured for the given grid/pool dimensions.
export function buildMaterials({ gridW, gridH, poolZoneSize }) {
  const wallTex = makeWallTexture();
  const carpetTex = makeCarpetTexture();
  const ceilingTex = makeCeilingTexture();
  const poolTex = makePoolTileTexture();

  carpetTex.repeat.set(gridW / 2, gridH / 2);
  ceilingTex.repeat.set(gridW / 2, gridH / 2);
  poolTex.repeat.set(poolZoneSize, poolZoneSize);

  return {
    wallMat: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
    carpetMat: new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 1 }),
    ceilingMat: new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.9 }),
    poolFloorMat: new THREE.MeshStandardMaterial({ map: poolTex, roughness: 0.6 }),
    waterMat: new THREE.MeshStandardMaterial({
      color: 0x2f6e63, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2
    }),
    pillarMat: new THREE.MeshStandardMaterial({ color: 0xcfc89a, roughness: 0.8 }),
    fixtureMat: new THREE.MeshStandardMaterial({
      color: 0xfff7d6, emissive: 0xfff2b0, emissiveIntensity: 1.4
    }),
    entityMat: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 })
  };
}
