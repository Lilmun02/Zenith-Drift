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

export interface PlayableScene {
  scene: Scene;
  state: FlightState;
  step: (input: FlightInput, dt: number) => void;
  syncPresentation: () => void;
  emitTelemetry: () => FlightTelemetry;
}

function createShip(scene: Scene): AbstractMesh {
  const root = MeshBuilder.CreateBox("airship-root", { size: 0.01 }, scene);
  root.isVisible = false;

  const hull = MeshBuilder.CreateCapsule(
    "airship-hull",
    { height: 2.8, radius: 0.55, tessellation: 12 },
    scene,
  );
  hull.rotation.x = Math.PI / 2;
  hull.scaling = new Vector3(0.85, 1, 1.25);
  hull.parent = root;

  const hullMaterial = new StandardMaterial("airship-hull-material", scene);
  hullMaterial.diffuseColor = new Color3(0.12, 0.3, 0.36);
  hullMaterial.emissiveColor = new Color3(0.01, 0.06, 0.08);
  hullMaterial.specularColor = new Color3(0.5, 0.85, 0.9);
  hull.material = hullMaterial;

  const sailMaterial = new StandardMaterial("airship-sail-material", scene);
  sailMaterial.diffuseColor = new Color3(0.17, 0.62, 0.68);
  sailMaterial.emissiveColor = new Color3(0.02, 0.13, 0.15);

  for (const side of [-1, 1]) {
    const vane = MeshBuilder.CreateBox(
      `weave-vane-${side}`,
      { width: 1.9, height: 0.08, depth: 0.65 },
      scene,
    );
    vane.position = new Vector3(side * 1.1, 0.1, 0.15);
    vane.rotation.z = side * -0.16;
    vane.parent = root;
    vane.material = sailMaterial;
  }

  return root;
}

function createCurrentFilament(scene: Scene, x: number, color: Color3): void {
  const path: Vector3[] = [];
  for (let z = flightConfig.currentStartZ; z <= flightConfig.currentEndZ; z += 2) {
    path.push(new Vector3(x + Math.sin(z * 0.18) * 0.35, Math.cos(z * 0.13) * 0.4, z));
  }

  const filament = MeshBuilder.CreateTube(
    `current-filament-${x}`,
    { path, radius: 0.11, tessellation: 8, cap: 0 },
    scene,
  );
  const material = new StandardMaterial(`current-material-${x}`, scene);
  material.diffuseColor = color;
  material.emissiveColor = color.scale(0.85);
  material.disableLighting = true;
  filament.material = material;
}

function updateRibbon(
  ribbon: LinesMesh,
  shipPosition: Vector3,
  currentX: number,
  scene: Scene,
): LinesMesh {
  return MeshBuilder.CreateLines(
    ribbon.name,
    {
      points: [shipPosition, new Vector3(currentX, 0, shipPosition.z + 4)],
      instance: ribbon,
    },
    scene,
  );
}

export function createPrototypeScene(engine: Engine): PlayableScene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.32, 0.58, 0.72, 1);
  scene.ambientColor = new Color3(0.24, 0.34, 0.39);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0013;
  scene.fogColor = new Color3(0.43, 0.67, 0.78);

  const light = new HemisphericLight("sky-light", new Vector3(0.25, 1, 0.1), scene);
  light.intensity = 0.72;
  light.groundColor = new Color3(0.15, 0.22, 0.28);

  const sunLight = new DirectionalLight("sun-light", new Vector3(-0.45, -0.8, 0.3), scene);
  sunLight.intensity = 1.05;
  sunLight.diffuse = new Color3(1, 0.88, 0.68);

  const sun = MeshBuilder.CreateSphere("distant-sun", { diameter: 34, segments: 16 }, scene);
  sun.position = new Vector3(-260, 130, 390);
  const sunMaterial = new StandardMaterial("sun-material", scene);
  sunMaterial.diffuseColor = new Color3(1, 0.62, 0.3);
  sunMaterial.emissiveColor = new Color3(1, 0.48, 0.16);
  sunMaterial.disableLighting = true;
  sun.material = sunMaterial;

  createCurrentFilament(scene, -flightConfig.currentHalfWidth, new Color3(0.15, 0.75, 0.9));
  createCurrentFilament(scene, flightConfig.currentHalfWidth, new Color3(0.75, 0.3, 0.88));

  const ship = createShip(scene);
  const world = createHighDriftsWorld(scene);
  const camera = new FollowCamera("flight-camera", new Vector3(0, 4, -20), scene);
  camera.lockedTarget = ship;
  camera.radius = 11;
  camera.heightOffset = 3.4;
  camera.rotationOffset = 180;
  camera.fov = 1.05;
  camera.cameraAcceleration = 0.22;
  camera.maxCameraSpeed = 90;
  camera.maxZ = 1200;
  camera.attachControl(true);

  let leftRibbon = MeshBuilder.CreateLines(
    "left-weave-ribbon",
    { points: [Vector3.Zero(), new Vector3(-flightConfig.currentHalfWidth, 0, 4)], updatable: true },
    scene,
  );
  let rightRibbon = MeshBuilder.CreateLines(
    "right-weave-ribbon",
    { points: [Vector3.Zero(), new Vector3(flightConfig.currentHalfWidth, 0, 4)], updatable: true },
    scene,
  );
  leftRibbon.color = new Color3(0.25, 0.9, 1);
  rightRibbon.color = new Color3(0.95, 0.45, 1);
  leftRibbon.isVisible = false;
  rightRibbon.isVisible = false;

  const state = createInitialFlightState();
  world.update(state.position);

  const syncPresentation = () => {
    ship.position.set(state.position.x, state.position.y, state.position.z);
    ship.rotation.set(-state.pitch, state.yaw, -state.roll);
    sun.position.set(state.position.x - 260, state.position.y + 130, state.position.z + 390);
    world.update(state.position);
    const shipPosition = ship.getAbsolutePosition();
    leftRibbon = updateRibbon(leftRibbon, shipPosition, -flightConfig.currentHalfWidth, scene);
    rightRibbon = updateRibbon(rightRibbon, shipPosition, flightConfig.currentHalfWidth, scene);
    leftRibbon.isVisible = state.weaveActive && state.weaveTension > 0;
    rightRibbon.isVisible = leftRibbon.isVisible;
  };

  syncPresentation();
  scene.onDisposeObservable.add(() => world.dispose());

  return {
    scene,
    state,
    step(input, dt) {
      stepFlight(state, input, flightConfig, dt);
    },
    syncPresentation,
    emitTelemetry: () => createTelemetry(state, flightConfig),
  };
}
