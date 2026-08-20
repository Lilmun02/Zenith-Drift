import { FollowCamera } from "@babylonjs/core/Cameras/followCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Shaders/color.fragment";
import "@babylonjs/core/Shaders/color.vertex";
import "@babylonjs/core/Shaders/default.fragment";
import "@babylonjs/core/Shaders/default.vertex";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { flightConfig } from "../config/flightConfig";
import { createTelemetry, createInitialFlightState, stepFlight } from "../rules/flightRules";
import type { FlightInput, FlightState, FlightTelemetry } from "../rules/flightTypes";
import { createHighDriftsWorld } from "../world/createHighDriftsWorld";
import { createCrownreachScenery } from "../world/createCrownreachScenery";

export interface PlayableScene { scene: Scene; state: FlightState; step: (input: FlightInput, dt: number) => void; syncPresentation: () => void; emitTelemetry: () => FlightTelemetry; }

function createShip(scene: Scene): AbstractMesh {
  const root = MeshBuilder.CreateBox("airship-root", { size: 0.01 }, scene); root.isVisible = false;
  const metal = new StandardMaterial("ship-metal", scene); metal.diffuseColor = new Color3(0.035, 0.08, 0.12); metal.specularColor = new Color3(0.35, 0.62, 0.72);
  const trim = new StandardMaterial("ship-trim", scene); trim.diffuseColor = new Color3(0.48, 0.25, 0.09); trim.specularColor = new Color3(0.7, 0.45, 0.2);
  const glow = new StandardMaterial("weave-glow", scene); glow.diffuseColor = new Color3(0.04, 0.55, 0.72); glow.emissiveColor = new Color3(0.02, 0.8, 1);
  const hull = MeshBuilder.CreateCapsule("airship-hull", { height: 4.8, radius: 0.72, tessellation: 20 }, scene); hull.rotation.x = Math.PI / 2; hull.scaling = new Vector3(0.82, 1, 1.28); hull.parent = root; hull.material = metal;
  const nose = MeshBuilder.CreateCylinder("ship-nose", { height: 1.2, diameterTop: 0, diameterBottom: 1.15, tessellation: 20 }, scene); nose.rotation.x = Math.PI / 2; nose.position.z = 2.8; nose.parent = root; nose.material = trim;
  const cockpit = MeshBuilder.CreateSphere("cockpit", { diameter: 1.05, segments: 16 }, scene); cockpit.scaling = new Vector3(0.72, 0.38, 1.1); cockpit.position = new Vector3(0, 0.52, 0.55); cockpit.parent = root; cockpit.material = glow;
  for (const side of [-1, 1]) { const wing = MeshBuilder.CreateBox(`wing-${side}`, { width: 2.8, height: 0.12, depth: 1.25 }, scene); wing.position = new Vector3(side * 1.65, -0.05, 0.25); wing.rotation.z = side * -0.1; wing.parent = root; wing.material = metal; const tip = MeshBuilder.CreateBox(`wing-glow-${side}`, { width: 0.18, height: 0.1, depth: 1.05 }, scene); tip.position = new Vector3(side * 3.02, -0.02, 0.25); tip.parent = root; tip.material = glow; }
  const tail = MeshBuilder.CreateBox("tail-fin", { width: 0.14, height: 1.35, depth: 1.25 }, scene); tail.position = new Vector3(0, 0.72, -2.05); tail.rotation.x = -0.18; tail.parent = root; tail.material = trim;
  for (const side of [-1, 1]) { const engine = MeshBuilder.CreateCylinder(`engine-${side}`, { height: 1.15, diameter: 0.48, tessellation: 16 }, scene); engine.rotation.x = Math.PI / 2; engine.position = new Vector3(side * 0.72, -0.38, -1.45); engine.parent = root; engine.material = metal; const exhaust = MeshBuilder.CreateSphere(`engine-glow-${side}`, { diameter: 0.38, segments: 12 }, scene); exhaust.scaling.z = 1.8; exhaust.position = new Vector3(side * 0.72, -0.38, -2.05); exhaust.parent = root; exhaust.material = glow; }
  return root;
}

function updateRibbon(ribbon: LinesMesh, shipPosition: Vector3, currentX: number, scene: Scene): LinesMesh { return MeshBuilder.CreateLines(ribbon.name, { points: [shipPosition, new Vector3(currentX, 0, shipPosition.z + 4)], instance: ribbon }, scene); }

export function createPrototypeScene(engine: Engine): PlayableScene {
  const scene = new Scene(engine); scene.clearColor = new Color4(0.055, 0.11, 0.19, 1); scene.ambientColor = new Color3(0.12, 0.18, 0.26); scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.0017; scene.fogColor = new Color3(0.18, 0.31, 0.43);
  const light = new HemisphericLight("sky-light", new Vector3(0.15, 1, 0.15), scene); light.intensity = 0.52; light.diffuse = new Color3(0.45, 0.66, 0.82); light.groundColor = new Color3(0.06, 0.09, 0.13);
  const sunLight = new DirectionalLight("sun-light", new Vector3(-0.5, -0.72, 0.28), scene); sunLight.intensity = 1.35; sunLight.diffuse = new Color3(1, 0.68, 0.4);
  const sun = MeshBuilder.CreateSphere("distant-sun", { diameter: 28, segments: 20 }, scene); sun.position = new Vector3(-260, 115, 390); const sunMaterial = new StandardMaterial("sun-material", scene); sunMaterial.diffuseColor = new Color3(1, 0.42, 0.12); sunMaterial.emissiveColor = new Color3(1, 0.28, 0.06); sunMaterial.disableLighting = true; sun.material = sunMaterial;
  const ship = createShip(scene); const world = createHighDriftsWorld(scene); createCrownreachScenery(scene);
  const camera = new FollowCamera("flight-camera", new Vector3(0, 4, -20), scene); camera.lockedTarget = ship; camera.radius = 13.5; camera.heightOffset = 4.2; camera.rotationOffset = 180; camera.fov = 0.9; camera.cameraAcceleration = 0.12; camera.maxCameraSpeed = 55; camera.maxZ = 1400; camera.attachControl(true);
  let leftRibbon = MeshBuilder.CreateLines("left-weave-ribbon", { points: [Vector3.Zero(), new Vector3(-flightConfig.currentHalfWidth, 0, 4)], updatable: true }, scene); let rightRibbon = MeshBuilder.CreateLines("right-weave-ribbon", { points: [Vector3.Zero(), new Vector3(flightConfig.currentHalfWidth, 0, 4)], updatable: true }, scene); leftRibbon.color = new Color3(0.18, 0.88, 1); rightRibbon.color = new Color3(0.72, 0.28, 1); leftRibbon.isVisible = false; rightRibbon.isVisible = false;
  const state = createInitialFlightState(); world.update(state.position);
  const syncPresentation = () => { ship.position.set(state.position.x, state.position.y, state.position.z); ship.rotation.set(-state.pitch, state.yaw, -state.roll); sun.position.set(state.position.x - 260, state.position.y + 115, state.position.z + 390); world.update(state.position); const shipPosition = ship.getAbsolutePosition(); leftRibbon = updateRibbon(leftRibbon, shipPosition, -flightConfig.currentHalfWidth, scene); rightRibbon = updateRibbon(rightRibbon, shipPosition, flightConfig.currentHalfWidth, scene); leftRibbon.isVisible = state.weaveActive && state.weaveTension > 0; rightRibbon.isVisible = leftRibbon.isVisible; };
  syncPresentation(); scene.onDisposeObservable.add(() => world.dispose());
  return { scene, state, step(input, dt) { stepFlight(state, input, flightConfig, dt); }, syncPresentation, emitTelemetry: () => createTelemetry(state, flightConfig) };
}
