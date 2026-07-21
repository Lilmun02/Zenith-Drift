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

The current gameplay foundation includes configurable arcade flight, keyboard input, a chase camera, prototype current filaments, Driftweave tension/release, and a diagnostic HUD. It intentionally contains no backend, persistence, resource economy, upgrades, or production assets.

## Prototype controls

- `W` / `S`: pitch
- `A` / `D`: yaw
- `Q` / `E`: roll
- `Shift` / `Ctrl`: throttle
- Hold `Space` while between the current filaments to build Driftweave tension; release to convert it into acceleration.

