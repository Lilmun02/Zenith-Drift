import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

export function createCrownreachScenery(scene: Scene): TransformNode {
  const root = new TransformNode("crownreach-scenery-pass", scene);

  const stone = new StandardMaterial("scenery-stone", scene);
  stone.diffuseColor = new Color3(0.12, 0.15, 0.17);
  stone.specularColor = new Color3(0.18, 0.22, 0.24);

  const glass = new StandardMaterial("scenery-glass", scene);
  glass.diffuseColor = new Color3(0.035, 0.16, 0.2);
  glass.emissiveColor = new Color3(0.01, 0.09, 0.12);
  glass.specularColor = new Color3(0.35, 0.65, 0.72);

  const warm = new StandardMaterial("scenery-window-light", scene);
  warm.diffuseColor = new Color3(0.95, 0.48, 0.16);
  warm.emissiveColor = new Color3(0.72, 0.24, 0.04);

  const metal = new StandardMaterial("scenery-metal", scene);
  metal.diffuseColor = new Color3(0.055, 0.075, 0.09);

  const createTower = (x: number, z: number, height: number, width: number, seed: number) => {
    const body = MeshBuilder.CreateCylinder(`crown-tower-${seed}`, {
      height,
      diameterBottom: width,
      diameterTop: width * 0.68,
      tessellation: 8,
    }, scene);
    body.position = new Vector3(x, -25 + height / 2, z);
    body.rotation.y = seed * 0.37;
    body.material = seed % 3 === 0 ? glass : stone;
    body.parent = root;

    const crown = MeshBuilder.CreateCylinder(`crown-cap-${seed}`, {
      height: 3,
      diameterBottom: width * 0.82,
      diameterTop: width * 0.48,
      tessellation: 8,
    }, scene);
    crown.position = new Vector3(x, -23.5 + height, z);
    crown.material = metal;
    crown.parent = root;

    for (let level = 0; level < Math.floor(height / 9); level += 1) {
      const ring = MeshBuilder.CreateTorus(`window-ring-${seed}-${level}`, {
        diameter: width * 0.78,
        thickness: 0.16,
        tessellation: 16,
      }, scene);
      ring.position = new Vector3(x, -24 + 6 + level * 8, z);
      ring.rotation.x = Math.PI / 2;
      ring.material = level % 2 === 0 ? warm : glass;
      ring.parent = root;
    }
  };

  const towers = [
    [-82, 170, 42, 15], [-55, 198, 58, 17], [-84, 242, 36, 14],
    [82, 174, 46, 15], [58, 202, 64, 18], [84, 246, 40, 14],
    [-45, 265, 50, 16], [45, 268, 55, 16], [-28, 158, 34, 13], [30, 160, 39, 13],
  ] as const;
  towers.forEach(([x, z, h, w], i) => createTower(x, z, h, w, i));

  const spire = MeshBuilder.CreateCylinder("zenith-spire-rework", {
    height: 118,
    diameterBottom: 22,
    diameterTop: 5,
    tessellation: 12,
  }, scene);
  spire.position = new Vector3(0, 34, 218);
  spire.material = glass;
  spire.parent = root;

  const needle = MeshBuilder.CreateCylinder("zenith-needle", {
    height: 34,
    diameterBottom: 3.5,
    diameterTop: 0.15,
    tessellation: 10,
  }, scene);
  needle.position = new Vector3(0, 110, 218);
  needle.material = warm;
  needle.parent = root;

  for (let i = 0; i < 28; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 125 + i * 7.5;
    const lamp = MeshBuilder.CreateCylinder(`street-lamp-${i}`, { height: 4.5, diameter: 0.16, tessellation: 8 }, scene);
    lamp.position = new Vector3(side * 13, -24.5, z);
    lamp.material = metal;
    lamp.parent = root;

    const bulb = MeshBuilder.CreateSphere(`street-light-${i}`, { diameter: 0.65, segments: 8 }, scene);
    bulb.position = new Vector3(side * 13, -22.1, z);
    bulb.material = warm;
    bulb.parent = root;
  }

  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 105 + (i % 3) * 18;
    const rock = MeshBuilder.CreatePolyhedron(`ridge-rock-${i}`, { type: 1, size: 8 + (i % 4) * 3 }, scene);
    rock.position = new Vector3(Math.cos(angle) * radius, -20 + (i % 3) * 2, 220 + Math.sin(angle) * radius);
    rock.scaling.y = 1.4 + (i % 3) * 0.35;
    rock.rotation = new Vector3(i * 0.21, i * 0.47, i * 0.13);
    rock.material = stone;
    rock.parent = root;
  }

  return root;
}
