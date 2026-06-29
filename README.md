# THE BACKROOMS

A first-person horror game built entirely with Three.js and the Web Audio API — no external assets, no texture files, no audio files. Everything is procedurally generated at runtime.

**[Play it live →](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/)**

---

## About

You've noclipped out of reality into **Level 0** — an endless expanse of yellow wallpaper, stained carpet, and fluorescent lights that won't stop humming. Something else is here with you. Find the Pool Rooms exit before it finds you.

Standing still too long draws its attention. Keep moving.

---

## Features

- **Procedural maze** — recursive backtracker with irregular wall carving for a genuine backrooms feel; no two runs are the same
- **Pool Rooms zone** — a distinct tile-floored area with water and pillars in the far corner, connected by a carved corridor
- **A\* monster pathfinding** — the entity navigates corridors using a grid-based A\* search, re-pathing every 0.6s; it doesn't walk into walls anymore
- **Sanity system** — drains passively, faster while idle; triggers monster activation below 35, drives all visual and audio feedback
- **Procedural audio** — 100% Web Audio API synthesis:
  - 60Hz electrical hum + harmonic
  - Carpet footsteps (pitch-varied muffled thuds)
  - Breathing that intensifies as sanity drops
  - Monster growls when it gets close
  - Jump scare audio sting on death
  - Exit portal chime on escape
- **Screen distortion** — CSS `hue-rotate` + `blur` + `saturate` scale with insanity; flickering lights drop out more aggressively at low sanity
- **Head bob** — subtle camera oscillation tied to movement speed
- **Environment props** — scattered moldy chairs, tables, cardboard boxes, and handwritten sticky notes
- **Exit portal** — glowing green arch at the Pool Rooms entrance; reach it to escape
- **No external dependencies** beyond Three.js and Vite

---

## Controls

| Key | Action |
|-----|--------|
| `W A S D` | Move |
| `Mouse` | Look |
| `Shift` | Sprint |
| `F` | Toggle flashlight |
| `Click` | Lock pointer / resume |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

Then open `http://localhost:5173`.

---

## Building & Deploying

```bash
npm run build
```

Output goes to `dist/`. The repo includes a GitHub Actions workflow that builds and deploys to GitHub Pages automatically on every push to `main`.

To set it up:
1. Go to your repo **Settings → Pages**
2. Set Source to **GitHub Actions**
3. Push to `main` — the workflow handles the rest

> Make sure `vite.config.js` has `base: '/your-repo-name/'` set, or the deployed build will load a blank page.

---

## Project Structure

```
src/
├── core/
│   ├── scene.js        # THREE.Scene, camera, renderer, fog
│   └── controls.js     # WASD + pointer lock, head bob, footstep timing
├── entities/
│   └── monster.js      # A* pathfinding entity
├── environment/
│   ├── maze.js         # Procedural maze generation + geometry + lights
│   ├── textures.js     # Canvas-generated textures and materials
│   └── props.js        # Furniture, sticky notes, exit portal
├── utils/
│   ├── audio.js        # Full Web Audio API sound system
│   └── collision.js    # Circle-vs-AABB resolution
└── main.js             # Game loop, sanity system, UI wiring
```

---

## Tech Stack

- **[Three.js](https://threejs.org/)** r160 — 3D rendering
- **Web Audio API** — all sound synthesis
- **Vite** — bundler and dev server
- No textures, no audio files, no external fonts

---

## License

MIT
