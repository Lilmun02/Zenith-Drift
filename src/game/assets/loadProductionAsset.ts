import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";

export interface ProductionAssetOptions {
  url: string;
  name: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: number;
}

/** Loads a real authored GLB/glTF asset and parents it to a stable game node. */
export async function loadProductionAsset(scene: Scene, options: ProductionAssetOptions): Promise<TransformNode> {
  const root = new TransformNode(options.name, scene);
  root.position.copyFrom(options.position ?? Vector3.Zero());
  root.rotation.copyFrom(options.rotation ?? Vector3.Zero());
  root.scaling.setAll(options.scale ?? 1);

  const slash = options.url.lastIndexOf("/");
  const rootUrl = slash >= 0 ? options.url.slice(0, slash + 1) : "./";
  const fileName = slash >= 0 ? options.url.slice(slash + 1) : options.url;
  const result = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene);

  for (const mesh of result.meshes) {
    if (!mesh.parent) mesh.parent = root;
    mesh.receiveShadows = true;
  }

  return root;
}
