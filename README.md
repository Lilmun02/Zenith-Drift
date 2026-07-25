# Zenith Drift

Web-based prototype scaffold for **Zenith Drift**, using React for interface composition and Babylon.js for the 3D runtime.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Commands

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

No environment variables or external services are required for the recovery scaffold.

## Current scope

The current gameplay foundation includes configurable arcade flight, keyboard input, a chase camera, Driftweave tension/release, a diagnostic HUD, and a continuous High-Drifts terrain region. The explorable slice includes coastline and water, connected highways and city streets, Crownreach, Forgeworks, a ridge village, forests, ancient landmarks, a lighthouse, and moving road traffic. It intentionally contains no backend, persistence, resource economy, upgrades, or production assets.

## Prototype controls

- `W` / `S`: pitch
- `A` / `D`: yaw
- `Q` / `E`: roll
- `Shift` / `Ctrl`: throttle
- Hold `Space` inside the active current corridor to build Driftweave tension; release to convert it into acceleration.

