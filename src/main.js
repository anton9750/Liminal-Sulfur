// src/main.js
import * as THREE from 'three';
import { SceneManager }    from './core/scene.js';
import { PlayerController } from './core/controls.js';
import { Maze }             from './environment/maze.js';
import { Monster }          from './entities/monster.js';
import { AudioSystem }      from './utils/audio.js';
import { PropsManager }     from './environment/props.js';

// Import music so Vite handles it correctly
import musicUrl from './assets/music.mp3';

const menuEl        = document.getElementById('menu');
const startBtn      = document.getElementById('startBtn');
const deathScreenEl = document.getElementById('deathScreen');
const winScreenEl   = document.getElementById('winScreen');
const sanityBar     = document.getElementById('sanityBarInner');
const staticOverlay = document.getElementById('staticOverlay');
const distortEl     = document.getElementById('distortOverlay');
const vignetteEl    = document.getElementById('vignette');
const jumpScareEl   = document.getElementById('jumpScare');
const levelTextEl   = document.getElementById('levelText');

const sceneManager = new SceneManager();
const maze         = new Maze();
sceneManager.add(maze.group);

const player  = new PlayerController(sceneManager.camera, document.body, maze.walls);
sceneManager.add(sceneManager.camera);
player.setSpawn(maze.spawnWorldPosition);

const monster     = new Monster(maze, maze.materials, { speed: 3.2, catchDistance: 1.0 });
const audioSystem = new AudioSystem();
const props       = new PropsManager(maze, maze.group);

let sanity    = 100;
let idleTimer = 0;
let gameOver  = false;
let won       = false;
let monsterGrowlCooldown = 0;

let jumpScareTimer = 0;
const JUMP_SCARE_DUR = 1.2;

function triggerDeath() {
  gameOver = true;
  player.unlock();
  audioSystem.playJumpScare();
  jumpScareEl.style.opacity = '1';
  jumpScareTimer = JUMP_SCARE_DUR;

  setTimeout(() => {
    jumpScareEl.style.opacity = '0';
    deathScreenEl.style.display = 'flex';
  }, 500);
}

function triggerWin() {
  won = true;
  gameOver = true;
  player.unlock();
  audioSystem.playExitChime();
  winScreenEl.style.display = 'flex';
}

function respawnPlayer() {
  sanity = 100;
  idleTimer = 0;
  gameOver = false;
  won = false;
  monster.deactivate();
  player.setSpawn(maze.spawnWorldPosition);
  deathScreenEl.style.display = 'none';
  winScreenEl.style.display = 'none';
  staticOverlay.style.opacity = '0';
  distortEl.style.opacity = '0';
  vignetteEl.style.opacity = '0.6';

  audioSystem.stopMusic();
  player.lock();
}

deathScreenEl.addEventListener('click', () => { if (gameOver && !won) respawnPlayer(); });
winScreenEl.addEventListener('click', () => { if (won) respawnPlayer(); });

document.body.addEventListener('click', () => {
  if (!gameOver && menuEl.style.display === 'none') player.lock();
});

player.onFootstep = () => audioSystem.playFootstep();

let distortPhase = 0;

function updateSanityFX(sanity, dt, proximity) {
  sanityBar.style.width = sanity + '%';
  sanityBar.style.background = sanity > 60 ? '#c9b35b' : sanity > 30 ? '#b06a2a' : '#9c2a2a';

  const vigOpacity = 0.6 + (1 - sanity / 100) * 0.35;
  vignetteEl.style.opacity = vigOpacity.toString();

  if (proximity > 0) {
    const noise = Math.random() * 0.04;
    staticOverlay.style.opacity = (proximity * 0.38 + noise).toString();
  } else {
    staticOverlay.style.opacity = '0';
  }

  const insane = Math.max(0, (60 - sanity) / 60);
  distortPhase += dt * (1 + insane * 6);
  const hueShift = insane * (20 + Math.sin(distortPhase * 2.1) * 15);
  const blurAmt  = insane * (1.5 + Math.sin(distortPhase * 3.3) * 0.8);
  const saturate = 1 + insane * 0.6;

  document.body.style.filter = insane > 0.05
    ? `hue-rotate(${hueShift.toFixed(1)}deg) blur(${blurAmt.toFixed(2)}px) saturate(${saturate.toFixed(2)})`
    : '';

  maze.setInsanity(insane);
  audioSystem.setBreathIntensity(insane);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  props.update(dt);
  maze.updateFlicker(performance.now() / 1000);

  if (jumpScareTimer > 0) jumpScareTimer -= dt;

  if (!gameOver) {
    const moved = player.update(dt);
    idleTimer = moved ? 0 : idleTimer + dt;

    sanity -= dt * (idleTimer > 4 ? 4.5 : 0.6);
    sanity = Math.max(0, Math.min(100, sanity));

    if (sanity < 20 && !audioSystem.musicSource && audioSystem.musicBuffer) {
      audioSystem.playMusic();
    }

    const playerPos = player.object.position;

    if (!monster.active && sanity < 35) {
      monster.activate(playerPos);
    }

    let proximity = 0;
    if (monster.active) {
      const result = monster.update(dt, playerPos);
      proximity = result.proximity;
      if (result.caught) triggerDeath();

      monsterGrowlCooldown -= dt;
      if (proximity > 0.5 && monsterGrowlCooldown <= 0) {
        audioSystem.playMonsterGrowl(proximity * 0.18);
        monsterGrowlCooldown = 2.5 + Math.random() * 2;
      }
    }

    updateSanityFX(sanity, dt, proximity);

    if (props.playerAtExit(playerPos)) triggerWin();

    const toExit = props.exitPortalWorldPos ? playerPos.distanceTo(props.exitPortalWorldPos) : 999;
    if (toExit < 20) {
      levelTextEl.textContent = 'LEVEL 0 › EXIT NEARBY';
      levelTextEl.style.color = '#88ffcc';
    } else {
      levelTextEl.textContent = 'LEVEL 0';
      levelTextEl.style.color = '#cfc99a';
    }
  }

  sceneManager.render();
}

// START
startBtn.addEventListener('click', async () => {
  menuEl.style.display = 'none';
  sceneManager.renderer.domElement.focus();
  player.lock();

  audioSystem.start();

  try {
    await audioSystem.loadMusic(musicUrl);   // ← Use imported URL
    console.log('✅ Music loaded');
  } catch (e) {
    console.error('❌ Music failed to load:', e);
  }

  animate();
});