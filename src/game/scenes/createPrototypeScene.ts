import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";

export function createPrototypeScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.025, 0.075, 0.11, 1);

  const camera = new ArcRotateCamera(
    "prototype-camera",
    -Math.PI / 2,
    Math.PI / 2.6,
    10,
    Vector3.Zero(),
    scene,
  );
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 16;
  camera.attachControl(canvas, true);

  const light = new HemisphericLight("sky-light", new Vector3(0.25, 1, 0.1), scene);
  light.intensity = 1.25;

  const driftCore = MeshBuilder.CreatePolyhedron(
    "drift-core",
    { type: 2, size: 2.2 },
    scene,
  );
  driftCore.rotation.x = 0.2;
  driftCore.rotation.z = -0.15;

  const coreMaterial = new StandardMaterial("drift-core-material", scene);
  coreMaterial.diffuseColor = new Color3(0.08, 0.42, 0.52);
  coreMaterial.emissiveColor = new Color3(0.01, 0.12, 0.16);
  coreMaterial.specularColor = new Color3(0.45, 0.9, 0.95);
  driftCore.material = coreMaterial;

  scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    driftCore.rotation.y += deltaSeconds * 0.18;
  });

  return scene;
}

