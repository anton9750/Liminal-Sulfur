// src/main.js
import * as THREE from 'three';
import { SceneManager }     from './core/scene.js';
import { PlayerController } from './core/controls.js';
import { Maze, CELL }       from './environment/maze.js';
import { PoolLevel }        from './environment/level2.js';
import { Monster }          from './entities/monster.js';
import { AudioSystem }      from './utils/audio.js';
import { PropsManager }     from './environment/props.js';
import { TouchControls, isTouchDevice } from './core/touchControls.js';

import musicUrl from './assets/music.mp3';

const menuEl           = document.getElementById('menu');
const startBtn         = document.getElementById('startBtn');
const deathScreenEl    = document.getElementById('deathScreen');
const winScreenEl      = document.getElementById('winScreen');
const winH1            = winScreenEl.querySelector('h1');
const winP             = winScreenEl.querySelector('p');
const winCta           = document.getElementById('winCta');
const levelTransEl     = document.getElementById('levelTransition');
const sanityBar        = document.getElementById('sanityBarInner');
const sanityLabel      = document.getElementById('sanityLabel');
const staticOverlay    = document.getElementById('staticOverlay');
const distortEl        = document.getElementById('distortOverlay');
const vignetteEl       = document.getElementById('vignette');
const jumpScareEl      = document.getElementById('jumpScare');
const levelTextEl      = document.getElementById('levelText');

const sceneManager = new SceneManager();
const audioSystem  = new AudioSystem();

// ── Mobile / touch support ──────────────────────────────────
const TOUCH_DEVICE = isTouchDevice();
if (TOUCH_DEVICE) document.body.classList.add('touch-device');
let touchControls = null;

function setupTouchControlsFor(playerController) {
  if (!TOUCH_DEVICE) return;
  if (!touchControls) {
    touchControls = new TouchControls(playerController);
  } else {
    touchControls.player = playerController;
  }
  playerController.touchActive = true;
  touchControls.show();
}

// ── Level state ──────────────────────────────────────────────
let currentLevel = 0;
let maze         = null;
let poolLevel    = null;
let props        = null;
let monster      = null;
let player       = null;

let sanity    = 100;
let idleTimer = 0;
let gameOver  = false;
let won       = false;
let transitioning = false;
let monsterGrowlCooldown = 0;
let monsterSawPlayerLastFrame = false;
let jumpScareTimer = 0;
const JUMP_SCARE_DUR = 1.2;

// ── Level 0 setup ────────────────────────────────────────────
function setupLevel0() {
  currentLevel = 0;
  sanity = 100; idleTimer = 0; gameOver = false; won = false;

  maze = new Maze();
  sceneManager.add(maze.group);

  player = new PlayerController(sceneManager.camera, document.body, maze.walls);
  sceneManager.add(sceneManager.camera);
  player.setSpawn(maze.spawnWorldPosition);
  player.onFootstep = () => audioSystem.playFootstep();
  setupTouchControlsFor(player);

  monster = new Monster(maze, maze.materials, { speed: 3.2, catchDistance: 1.0 });
  props   = new PropsManager(maze, maze.group);

  sceneManager.scene.background = new THREE.Color(0x3a3417);
  sceneManager.scene.fog = new THREE.FogExp2(0x4a4420, 0.045);

  levelTextEl.textContent = 'LEVEL 0';
  levelTextEl.style.color = '#cfc99a';
  vignetteEl.style.opacity = '0.6';
  sanityLabel.style.display = '';
  document.getElementById('sanityBarOuter').style.display = '';
}

// ── Level 2 setup ────────────────────────────────────────────
function setupLevel2() {
  currentLevel = 2;
  sanity = 100; idleTimer = 0; gameOver = false; won = false;

  // Tear down level 0
  if (maze)    sceneManager.scene.remove(maze.group);
  if (monster) monster.deactivate();
  props = null;

  poolLevel = new PoolLevel();
  sceneManager.add(poolLevel.group);

  player.walls = poolLevel.walls;
  player.setSpawn(poolLevel.spawnWorldPosition);

  // Re-use the same Monster but re-bind it to the pool level's maze proxy.
  // The pool level exposes a .maze getter that returns itself with the needed interface.
  monster = new Monster(poolLevel, { entityMat: new THREE.MeshStandardMaterial({ color: 0x1a0808, roughness: 0.9 }) }, { speed: 2.8, catchDistance: 1.2 });
  // The monster mesh needs to be added to the pool level's group instead
  poolLevel.group.add(monster.mesh);

  sceneManager.scene.background = new THREE.Color(0xd0e8ec);
  sceneManager.scene.fog = new THREE.FogExp2(0xcce4e8, 0.012);

  levelTextEl.textContent = 'LEVEL 2 — THE POOL ROOMS';
  levelTextEl.style.color = '#88dddd';

  document.body.style.filter = '';
  staticOverlay.style.opacity = '0';
  distortEl.style.opacity = '0';
  vignetteEl.style.opacity = '0.15';

  // Keep sanity bar but repurpose it as monster proximity warning
  sanityLabel.textContent = 'DANGER';
  sanityLabel.style.display = '';
  document.getElementById('sanityBarOuter').style.display = '';
  sanityBar.style.width = '0%';
  sanityBar.style.background = '#cc2222';

  // Activate monster after 8-second grace period
  setTimeout(() => {
    if (currentLevel === 2 && !gameOver) {
      monster.activate(player.object.position);
    }
  }, 8000);
}

// ── Death / win ──────────────────────────────────────────────
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
  if (currentLevel === 0) {
    gameOver = true;
    player.unlock();
    transitioning = true;

    winH1.textContent = 'LEVEL 0 CLEARED';
    winP.textContent  = 'The portal hums. Something shifts behind your eyes. The Pool Rooms await.';
    winCta.textContent = 'click to descend';
    winScreenEl.style.background = 'radial-gradient(ellipse at center, #082215 0%, #000 100%)';
    winScreenEl.style.color = '#44ffaa';
    winScreenEl.style.display = 'flex';
    return;
  }

  // Level 2 win — escape through the portal
  won = true;
  gameOver = true;
  player.unlock();
  audioSystem.playExitChime();
  winH1.textContent = 'YOU ESCAPED THE POOL ROOMS';
  winP.textContent  = 'The portal swallowed you whole. The humming fades. The thing behind you disappears.\nFor now, you are free.';
  winCta.textContent = 'click to play again';
  winScreenEl.style.background = 'radial-gradient(ellipse at center, #001822 0%, #000 100%)';
  winScreenEl.style.color = '#88dddd';
  winScreenEl.style.display = 'flex';
}

function respawnAfterDeath() {
  sanity = 100; idleTimer = 0; gameOver = false; won = false;
  if (monster) monster.deactivate();

  const spawnPos = currentLevel === 0 ? maze.spawnWorldPosition : poolLevel.spawnWorldPosition;
  player.setSpawn(spawnPos);

  deathScreenEl.style.display = 'none';
  staticOverlay.style.opacity = '0';
  distortEl.style.opacity = '0';
  vignetteEl.style.opacity = currentLevel === 0 ? '0.6' : '0.15';
  document.body.style.filter = '';
  audioSystem.stopMusic();
  player.lock();

  // Re-activate monster in level 2 after a brief respawn grace
  if (currentLevel === 2) {
    sanityBar.style.width = '0%';
    setTimeout(() => {
      if (!gameOver) monster.activate(player.object.position);
    }, 5000);
  }
}

function doLevelTransition() {
  winScreenEl.style.display = 'none';
  transitioning = false;

  levelTransEl.style.display = 'flex';
  setTimeout(() => {
    setupLevel2();
    player.lock();
    setTimeout(() => {
      levelTransEl.style.display = 'none';
    }, 1800);
  }, 1200);
}

// Win screen click handler
winScreenEl.addEventListener('click', () => {
  if (transitioning) {
    doLevelTransition();
  } else if (won) {
    sceneManager.scene.remove(poolLevel?.group);
    sceneManager.scene.remove(maze?.group);
    setupLevel0();
    sanityLabel.textContent = 'SANITY';
    sanityLabel.style.display = '';
    document.getElementById('sanityBarOuter').style.display = '';
    winScreenEl.style.display = 'none';
    player.lock();
  }
});

deathScreenEl.addEventListener('click', () => { if (gameOver && !won) respawnAfterDeath(); });
document.body.addEventListener('click', () => {
  if (TOUCH_DEVICE) return;
  if (!gameOver && menuEl.style.display === 'none') player.lock();
});

// ── Sanity FX (level 0 only) ─────────────────────────────────
let distortPhase = 0;

function updateSanityFX(sanity, dt, proximity) {
  sanityBar.style.width      = sanity + '%';
  sanityBar.style.background = sanity > 60 ? '#c9b35b' : sanity > 30 ? '#b06a2a' : '#9c2a2a';

  const vigOpacity = 0.6 + (1 - sanity / 100) * 0.35;
  vignetteEl.style.opacity = vigOpacity.toString();

  if (proximity > 0) {
    staticOverlay.style.opacity = (proximity * 0.38 + Math.random() * 0.04).toString();
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

  if (maze) maze.setInsanity(insane);
  audioSystem.setBreathIntensity(insane);
}

// ── Monster proximity UI for Level 2 ─────────────────────────
function updateL2MonsterUI(proximity) {
  const pct = (proximity * 100).toFixed(0);
  sanityBar.style.width = pct + '%';
  // Red flash static overlay when close
  if (proximity > 0.4) {
    staticOverlay.style.opacity = (proximity * 0.25 + Math.random() * 0.06).toString();
    vignetteEl.style.opacity = (0.15 + proximity * 0.5).toString();
  } else {
    staticOverlay.style.opacity = '0';
    vignetteEl.style.opacity = '0.15';
  }
}

// ── Main loop ────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = performance.now() / 1000;

  if (currentLevel === 0 && maze)       maze.updateFlicker(t);
  if (currentLevel === 2 && poolLevel)  { poolLevel.updateFlicker(t); poolLevel.update(dt); }
  if (props) props.update(dt);
  if (jumpScareTimer > 0) jumpScareTimer -= dt;

  if (!gameOver) {
    const moved    = player.update(dt);
    idleTimer      = moved ? 0 : idleTimer + dt;
    const playerPos = player.object.position;

    // ── Level 0 logic ──────────────────────────────────────
    if (currentLevel === 0) {
      sanity -= dt * (idleTimer > 4 ? 4.5 : 0.6);
      sanity  = Math.max(0, Math.min(100, sanity));

      if (sanity < 20 && !audioSystem.musicSource && audioSystem.musicBuffer) {
        audioSystem.playMusic();
      }

      if (!monster.active && sanity < 35) monster.activate(playerPos);

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
        // It's seen you — sharper, closer-sounding snarl as it picks up speed
        if (result.seesPlayer && !monsterSawPlayerLastFrame && monster.active) {
          audioSystem.playMonsterGrowl(0.3);
        }
        monsterSawPlayerLastFrame = result.seesPlayer;
      }

      // ── Static noise swell near flickering ceiling lights ──────────
      if (maze && maze.flickerLights.length) {
        let nearestDist = Infinity;
        for (const fl of maze.flickerLights) {
          const d = playerPos.distanceTo(fl.light.position);
          if (d < nearestDist) nearestDist = d;
        }
        const LIGHT_STATIC_RANGE = CELL * 2.6; // how close before the hiss swells
        const lightProximity = THREE.MathUtils.clamp(1 - nearestDist / LIGHT_STATIC_RANGE, 0, 1);
        audioSystem.setLightStaticIntensity(lightProximity);
      }

      updateSanityFX(sanity, dt, proximity);

      if (props && props.playerAtExit(playerPos)) triggerWin();

      const toExit = props?.exitPortalWorldPos
        ? playerPos.distanceTo(props.exitPortalWorldPos) : 999;
      levelTextEl.textContent = toExit < 20 ? 'LEVEL 0 › EXIT NEARBY' : 'LEVEL 0';
      levelTextEl.style.color = toExit < 20 ? '#88ffcc' : '#cfc99a';
    }

    // ── Level 2 logic ──────────────────────────────────────
    if (currentLevel === 2) {
      let proximity = 0;

      if (monster && monster.active) {
        // Monster does direct-line pursuit in open pool rooms
        // (grid is null so _findPath returns [], monster uses straight line)
        const result = monster.update(dt, playerPos);
        proximity = result.proximity;
        if (result.caught) triggerDeath();

        monsterGrowlCooldown -= dt;
        if (proximity > 0.45 && monsterGrowlCooldown <= 0) {
          audioSystem.playMonsterGrowl(proximity * 0.15);
          monsterGrowlCooldown = 3.0 + Math.random() * 2;
        }
      }

      updateL2MonsterUI(proximity);

      // Check portal
      if (poolLevel.playerAtPortal(playerPos)) triggerWin();

      // HUD hint
      const toDist = poolLevel.portalWorldPos.distanceTo(playerPos);
      if (toDist < 30) {
        levelTextEl.textContent = 'LEVEL 2 › PORTAL NEARBY — RUN';
        levelTextEl.style.color = '#00ffcc';
      } else if (monster && monster.active) {
        levelTextEl.textContent = 'LEVEL 2 — IT FOLLOWED YOU';
        levelTextEl.style.color = '#ff4444';
      } else {
        levelTextEl.textContent = 'LEVEL 2 — THE POOL ROOMS';
        levelTextEl.style.color = '#88dddd';
      }
    }
  }

  sceneManager.render();
}

// ── START ────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  menuEl.style.display = 'none';
  sceneManager.renderer.domElement.focus();

  setupLevel0();
  player.lock();
  audioSystem.start();

  try {
    await audioSystem.loadMusic(musicUrl);
    console.log('✅ Music loaded');
  } catch (e) {
    console.error('❌ Music failed to load:', e);
  }

  animate();
});
