import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { Vec3 } from "../rules/flightTypes";

export interface HighDriftsWorld {
  update: (position: Vec3) => void;
  dispose: () => void;
}

interface WorldMaterials {
  rock: StandardMaterial;
  moss: StandardMaterial;
  road: StandardMaterial;
  stone: StandardMaterial;
  metal: StandardMaterial;
  glass: StandardMaterial;
  crystal: StandardMaterial;
  foliage: StandardMaterial;
  trunk: StandardMaterial;
  cloud: StandardMaterial;
  lane: StandardMaterial;
}

const palette = {
  rock: new Color3(0.17, 0.22, 0.25),
  moss: new Color3(0.14, 0.32, 0.23),
  road: new Color3(0.09, 0.13, 0.15),
  stone: new Color3(0.42, 0.48, 0.47),
  metal: new Color3(0.2, 0.29, 0.32),
  glass: new Color3(0.1, 0.4, 0.5),
  crystal: new Color3(0.18, 0.75, 0.9),
  foliage: new Color3(0.17, 0.5, 0.34),
  trunk: new Color3(0.25, 0.18, 0.12),
  cloud: new Color3(0.82, 0.91, 0.94),
  lane: new Color3(0.18, 0.85, 0.95),
};

function material(
  name: string,
  color: Color3,
  scene: Scene,
  emissive = Color3.Black(),
): StandardMaterial {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = color;
  value.emissiveColor = emissive;
  value.specularColor = color.scale(0.25);
  return value;
}

function createMaterials(scene: Scene): WorldMaterials {
  const cloud = material("cloud-vapor", palette.cloud, scene, new Color3(0.2, 0.26, 0.28));
  cloud.alpha = 0.2;
  cloud.disableDepthWrite = true;
  cloud.backFaceCulling = false;

  return {
    rock: material("world-rock", palette.rock, scene, new Color3(0.025, 0.03, 0.035)),
    moss: material("world-moss", palette.moss, scene, new Color3(0.018, 0.04, 0.025)),
    road: material("skyport-road", palette.road, scene),
    stone: material("city-stone", palette.stone, scene),
    metal: material("forge-metal", palette.metal, scene),
    glass: material("city-glass", palette.glass, scene, new Color3(0.018, 0.12, 0.15)),
    crystal: material("drift-crystal", palette.crystal, scene, new Color3(0.06, 0.5, 0.7)),
    foliage: material("verdant-foliage", palette.foliage, scene),
    trunk: material("verdant-trunk", palette.trunk, scene),
    cloud,
    lane: material("air-lane", palette.lane, scene, new Color3(0.04, 0.55, 0.7)),
  };
}

function createPlateau(
  scene: Scene,
  parent: TransformNode,
  materials: WorldMaterials,
  name: string,
  position: Vector3,
  radius: number,
  depth: number,
  sides = 12,
): void {
  const rock = MeshBuilder.CreateCylinder(
    `${name}-mass`,
    {
      height: depth,
      diameterTop: radius * 2,
      diameterBottom: radius * 0.38,
      tessellation: sides,
    },
    scene,
  );
  rock.position = position.add(new Vector3(0, -depth * 0.5, 0));
  rock.parent = parent;
  rock.material = materials.rock;

  const crown = MeshBuilder.CreateCylinder(
    `${name}-surface`,
    {
      height: 1.4,
      diameterTop: radius * 1.98,
      diameterBottom: radius * 1.9,
      tessellation: sides,
    },
    scene,
  );
  crown.position = position.add(new Vector3(0, 0.3, 0));
  crown.parent = parent;
  crown.material = materials.moss;
}

function createBuilding(
  scene: Scene,
  parent: TransformNode,
  materials: WorldMaterials,
  name: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
): void {
  const building = MeshBuilder.CreateBox(name, { width, depth, height }, scene);
  building.position = new Vector3(x, height * 0.5 - 6.5, z);
  building.parent = parent;
  building.material = height > 24 ? materials.glass : materials.stone;

  const beacon = MeshBuilder.CreateCylinder(
    `${name}-beacon`,
    { height: 0.5, diameter: Math.max(1.2, width * 0.24), tessellation: 12 },
    scene,
  );
  beacon.position = new Vector3(x, height - 6.1, z);
  beacon.parent = parent;
  beacon.material = materials.crystal;
}

function createSkyportCity(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const district = new TransformNode("district-crownreach", scene);
  district.parent = root;
  district.position.z = 240;
  createPlateau(scene, district, materials, "crownreach", new Vector3(0, -8, 115), 88, 35, 16);

  const avenue = MeshBuilder.CreateBox(
    "crownreach-main-avenue",
    { width: 12, height: 0.7, depth: 145 },
    scene,
  );
  avenue.position = new Vector3(0, -6.7, 115);
  avenue.parent = district;
  avenue.material = materials.road;

  const crossAvenue = MeshBuilder.CreateBox(
    "crownreach-cross-avenue",
    { width: 145, height: 0.72, depth: 10 },
    scene,
  );
  crossAvenue.position = new Vector3(0, -6.65, 115);
  crossAvenue.parent = district;
  crossAvenue.material = materials.road;

  let buildingIndex = 0;
  for (const x of [-58, -38, -20, 20, 38, 58]) {
    for (const z of [62, 88, 114, 140, 166]) {
      const variation = Math.abs(Math.sin(x * 0.13 + z * 0.07));
      createBuilding(
        scene,
        district,
        materials,
        `crownreach-building-${buildingIndex}`,
        x,
        z,
        10 + variation * 8,
        10 + (1 - variation) * 8,
        10 + variation * 34,
      );
      buildingIndex += 1;
    }
  }

  const tower = MeshBuilder.CreateCylinder(
    "crownreach-zenith-tower",
    { height: 76, diameterTop: 8, diameterBottom: 18, tessellation: 10 },
    scene,
  );
  tower.position = new Vector3(0, 31, 116);
  tower.parent = district;
  tower.material = materials.glass;

  const halo = MeshBuilder.CreateTorus(
    "crownreach-halo",
    { diameter: 25, thickness: 1, tessellation: 48 },
    scene,
  );
  halo.position = new Vector3(0, 62, 116);
  halo.rotation.x = Math.PI / 2;
  halo.parent = district;
  halo.material = materials.crystal;

  for (const side of [-1, 1]) {
    const dock = MeshBuilder.CreateBox(
      `crownreach-dock-${side}`,
      { width: 32, height: 2, depth: 8 },
      scene,
    );
    dock.position = new Vector3(side * 98, -4, 105);
    dock.parent = district;
    dock.material = materials.metal;
  }
}

function createVerdantTerraces(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const district = new TransformNode("district-verdant-terraces", scene);
  district.parent = root;
  createPlateau(scene, district, materials, "verdant-main", new Vector3(-145, 18, 255), 72, 42, 14);
  createPlateau(scene, district, materials, "verdant-high", new Vector3(-204, 47, 322), 48, 34, 12);

  for (let index = 0; index < 42; index += 1) {
    const angle = index * 2.399;
    const radius = 12 + (index % 7) * 7;
    const x = -145 + Math.cos(angle) * radius;
    const z = 255 + Math.sin(angle) * radius;
    const trunk = MeshBuilder.CreateCylinder(
      `verdant-tree-trunk-${index}`,
      { height: 5, diameter: 1.1, tessellation: 6 },
      scene,
    );
    trunk.position = new Vector3(x, 21, z);
    trunk.parent = district;
    trunk.material = materials.trunk;

    const crown = MeshBuilder.CreateSphere(
      `verdant-tree-crown-${index}`,
      { diameter: 5 + (index % 3), segments: 5 },
      scene,
    );
    crown.position = new Vector3(x, 25, z);
    crown.scaling.y = 1.4;
    crown.parent = district;
    crown.material = materials.foliage;
  }
}

function createForgeworks(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const district = new TransformNode("district-forgeworks", scene);
  district.parent = root;
  createPlateau(scene, district, materials, "forgeworks", new Vector3(155, -3, 274), 68, 46, 12);

  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    const tank = MeshBuilder.CreateCylinder(
      `forge-tank-${index}`,
      { height: 15 + (index % 3) * 6, diameter: 10 + (index % 2) * 5, tessellation: 12 },
      scene,
    );
    tank.position = new Vector3(
      155 + Math.cos(angle) * 38,
      5 + (index % 3) * 3,
      274 + Math.sin(angle) * 38,
    );
    tank.parent = district;
    tank.material = materials.metal;
  }

  for (const side of [-1, 1]) {
    const stack = MeshBuilder.CreateCylinder(
      `forge-stack-${side}`,
      { height: 52, diameterTop: 5, diameterBottom: 10, tessellation: 10 },
      scene,
    );
    stack.position = new Vector3(155 + side * 22, 23, 274);
    stack.parent = district;
    stack.material = materials.metal;
  }
}

function createAncientReach(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const district = new TransformNode("district-ancient-reach", scene);
  district.parent = root;
  createPlateau(scene, district, materials, "ancient-reach", new Vector3(12, 34, 430), 78, 58, 15);

  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2;
    const pillar = MeshBuilder.CreateCylinder(
      `reach-pillar-${index}`,
      { height: 18 + (index % 4) * 5, diameter: 4, tessellation: 6 },
      scene,
    );
    pillar.position = new Vector3(
      12 + Math.cos(angle) * 44,
      46 + (index % 4) * 2.5,
      430 + Math.sin(angle) * 44,
    );
    pillar.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.08;
    pillar.parent = district;
    pillar.material = materials.stone;
  }

  const gate = MeshBuilder.CreateTorus(
    "ancient-reach-gate",
    { diameter: 54, thickness: 3.2, tessellation: 64 },
    scene,
  );
  gate.position = new Vector3(12, 66, 430);
  gate.parent = district;
  gate.material = materials.crystal;
}

function createAirLanes(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  for (let index = 0; index < 10; index += 1) {
    const ring = MeshBuilder.CreateTorus(
      `current-gate-${index}`,
      { diameter: 18, thickness: 0.42, tessellation: 32 },
      scene,
    );
    ring.position = new Vector3(Math.sin(index * 0.72) * 15, 2 + Math.sin(index) * 5, 20 + index * 38);
    ring.parent = root;
    ring.material = materials.lane;
  }
}

function createCloudBanks(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const banks = [
    new Vector3(-220, -48, 80),
    new Vector3(230, 62, 120),
    new Vector3(-280, 70, 330),
    new Vector3(270, -55, 410),
  ];

  banks.forEach((center, bankIndex) => {
    for (let index = 0; index < 7; index += 1) {
      const cloud = MeshBuilder.CreateSphere(
        `cloud-bank-${bankIndex}-${index}`,
        { diameter: 48 + (index % 3) * 12, segments: 6 },
        scene,
      );
      cloud.position = center.add(new Vector3((index - 3) * 25, (index % 2) * 6, Math.sin(index) * 22));
      cloud.scaling = new Vector3(1.7, 0.34, 1);
      cloud.parent = root;
      cloud.material = materials.cloud;
    }
  });
}

function createTraffic(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): TransformNode[] {
  const traffic: TransformNode[] = [];
  for (let index = 0; index < 7; index += 1) {
    const craft = new TransformNode(`ambient-skiff-${index}`, scene);
    craft.parent = root;
    const hull = MeshBuilder.CreateCapsule(
      `ambient-skiff-hull-${index}`,
      { height: 5, radius: 0.75, tessellation: 8 },
      scene,
    );
    hull.rotation.x = Math.PI / 2;
    hull.parent = craft;
    hull.material = materials.metal;
    const sail = MeshBuilder.CreateBox(
      `ambient-skiff-sail-${index}`,
      { width: 5, height: 0.12, depth: 1.1 },
      scene,
    );
    sail.parent = craft;
    sail.material = materials.lane;
    traffic.push(craft);
  }
  return traffic;
}

export function createHighDriftsWorld(scene: Scene): HighDriftsWorld {
  const materials = createMaterials(scene);
  const root = new TransformNode("authored-high-drifts-region", scene);
  createSkyportCity(scene, root, materials);
  createVerdantTerraces(scene, root, materials);
  createForgeworks(scene, root, materials);
  createAncientReach(scene, root, materials);
  createAirLanes(scene, root, materials);
  createCloudBanks(scene, root, materials);
  const traffic = createTraffic(scene, root, materials);
  let elapsed = 0;

  return {
    update(_position) {
      elapsed += Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
      traffic.forEach((craft, index) => {
        const phase = elapsed * (0.11 + index * 0.008) + index * 0.9;
        craft.position.set(
          Math.sin(phase) * (115 + index * 13),
          15 + Math.sin(phase * 1.7) * 22,
          225 + Math.cos(phase) * (150 + index * 10),
        );
        craft.rotation.y = phase + Math.PI;
      });
    },
    dispose() {
      for (const mesh of root.getChildMeshes()) mesh.dispose();
      root.dispose();
      for (const value of Object.values(materials)) value.dispose();
    },
  };
}

