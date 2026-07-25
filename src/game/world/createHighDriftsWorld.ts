import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import type { Vec3 } from "../rules/flightTypes";

export interface HighDriftsWorld {
  update: (position: Vec3) => void;
  dispose: () => void;
}

interface WorldMaterials {
  terrain: StandardMaterial;
  rock: StandardMaterial;
  water: StandardMaterial;
  road: StandardMaterial;
  concrete: StandardMaterial;
  roof: StandardMaterial;
  glass: StandardMaterial;
  metal: StandardMaterial;
  foliage: StandardMaterial;
  foliageDark: StandardMaterial;
  trunk: StandardMaterial;
  sand: StandardMaterial;
  emissive: StandardMaterial;
}

const worldCenterZ = 330;
const worldSize = 1050;
const terrainBase = -30;

function makeMaterial(
  scene: Scene,
  name: string,
  diffuse: Color3,
  emissive = Color3.Black(),
): StandardMaterial {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = diffuse;
  value.emissiveColor = emissive;
  value.specularColor = diffuse.scale(0.12);
  return value;
}

function createMaterials(scene: Scene): WorldMaterials {
  const water = makeMaterial(
    scene,
    "drift-sea",
    new Color3(0.035, 0.21, 0.29),
    new Color3(0.005, 0.035, 0.05),
  );
  water.alpha = 0.92;

  return {
    terrain: makeMaterial(scene, "high-drifts-ground", new Color3(0.82, 0.82, 0.78)),
    rock: makeMaterial(scene, "ridge-rock", new Color3(0.24, 0.26, 0.24)),
    water,
    road: makeMaterial(scene, "road-asphalt", new Color3(0.055, 0.065, 0.068)),
    concrete: makeMaterial(scene, "settlement-stone", new Color3(0.48, 0.45, 0.38)),
    roof: makeMaterial(scene, "settlement-roof", new Color3(0.24, 0.1, 0.075)),
    glass: makeMaterial(
      scene,
      "settlement-glass",
      new Color3(0.08, 0.3, 0.36),
      new Color3(0.008, 0.045, 0.052),
    ),
    metal: makeMaterial(scene, "industrial-metal", new Color3(0.18, 0.21, 0.21)),
    foliage: makeMaterial(scene, "tree-canopy", new Color3(0.1, 0.3, 0.14)),
    foliageDark: makeMaterial(scene, "tree-canopy-dark", new Color3(0.055, 0.19, 0.09)),
    trunk: makeMaterial(scene, "tree-trunk", new Color3(0.19, 0.12, 0.07)),
    sand: makeMaterial(scene, "coastal-sand", new Color3(0.55, 0.48, 0.32)),
    emissive: makeMaterial(
      scene,
      "district-beacons",
      new Color3(0.25, 0.64, 0.66),
      new Color3(0.06, 0.3, 0.32),
    ),
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function terrainHeight(x: number, z: number): number {
  const localZ = z - worldCenterZ;
  const distance = Math.sqrt((x / 510) ** 2 + (localZ / 500) ** 2);
  const coast = 1 - smoothstep(0.7, 1, distance);
  const rolling =
    Math.sin(x * 0.018) * 4.2 +
    Math.cos(z * 0.014) * 3.4 +
    Math.sin((x + z) * 0.009) * 5.4;
  const westernRidge = Math.exp(-(((x + 300) / 115) ** 2 + ((z - 390) / 260) ** 2)) * 50;
  const northernRidge = Math.exp(-(((x - 210) / 170) ** 2 + ((z - 690) / 115) ** 2)) * 38;
  const cityPlain = 1 - smoothstep(80, 210, Math.hypot(x, z - 220));
  const industrialPlain = 1 - smoothstep(55, 130, Math.hypot(x - 235, z - 390));
  const flattened = rolling * (1 - cityPlain * 0.9) * (1 - industrialPlain * 0.75);
  return terrainBase + coast * (26 + flattened + westernRidge + northernRidge);
}

function createTerrain(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const sea = MeshBuilder.CreateGround(
    "drift-sea",
    { width: 1900, height: 1900, subdivisions: 1 },
    scene,
  );
  sea.position = new Vector3(0, terrainBase - 2.7, worldCenterZ);
  sea.parent = root;
  sea.material = materials.water;

  const terrain = MeshBuilder.CreateGround(
    "continuous-high-drifts-terrain",
    { width: worldSize, height: worldSize, subdivisions: 92, updatable: true },
    scene,
  );
  terrain.position.z = worldCenterZ;
  terrain.parent = root;
  terrain.material = materials.terrain;

  const positions = terrain.getVerticesData(VertexBuffer.PositionKind);
  const indices = terrain.getIndices();
  if (positions && indices) {
    const colors: number[] = [];
    for (let index = 0; index < positions.length; index += 3) {
      const x = positions[index];
      const z = positions[index + 2] + worldCenterZ;
      const height = terrainHeight(x, z);
      positions[index + 1] = height;
      const variation = Math.sin(x * 0.07) * Math.cos(z * 0.05) * 0.025;
      const color =
        height < terrainBase - 0.7
          ? new Color4(0.48 + variation, 0.4 + variation, 0.25, 1)
          : height > 9
            ? new Color4(0.3 + variation, 0.31 + variation, 0.28 + variation, 1)
            : height > -10
              ? new Color4(0.18 + variation, 0.34 + variation, 0.18, 1)
              : new Color4(0.3 + variation, 0.42 + variation, 0.2, 1);
      colors.push(color.r, color.g, color.b, color.a);
    }
    const normals = new Array<number>(positions.length).fill(0);
    VertexData.ComputeNormals(positions, indices, normals);
    terrain.updateVerticesData(VertexBuffer.PositionKind, positions);
    terrain.updateVerticesData(VertexBuffer.NormalKind, normals);
    terrain.setVerticesData(VertexBuffer.ColorKind, colors);
    terrain.useVertexColors = true;
    terrain.refreshBoundingInfo();
  }

  for (const side of [-1, 1]) {
    const beach = MeshBuilder.CreateGround(
      `shoreline-${side}`,
      { width: 100, height: 500, subdivisions: 1 },
      scene,
    );
    beach.position = new Vector3(side * 470, terrainBase - 1.8, worldCenterZ + 20);
    beach.rotation.y = side * 0.08;
    beach.parent = root;
    beach.material = materials.sand;
  }
}

function createRoad(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
  name: string,
  points: Array<[number, number]>,
  width: number,
): void {
  const samples: Array<[number, number]> = [];
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const start = points[segment];
    const end = points[segment + 1];
    const steps = Math.max(2, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 10));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      samples.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }
  samples.push(points[points.length - 1]);

  const left: Vector3[] = [];
  const right: Vector3[] = [];
  for (let index = 0; index < samples.length; index += 1) {
    const [x, z] = samples[index];
    const previous = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const dx = next[0] - previous[0];
    const dz = next[1] - previous[1];
    const length = Math.max(0.001, Math.hypot(dx, dz));
    const offsetX = (-dz / length) * width * 0.5;
    const offsetZ = (dx / length) * width * 0.5;
    const y = terrainHeight(x, z) + 0.38;
    left.push(new Vector3(x + offsetX, y, z + offsetZ));
    right.push(new Vector3(x - offsetX, y, z - offsetZ));
  }
  const road = MeshBuilder.CreateRibbon(
    name,
    { pathArray: [left, right], sideOrientation: Mesh.DOUBLESIDE },
    scene,
  );
  road.parent = root;
  road.material = materials.road;
}

function createRoadNetwork(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  createRoad(
    scene,
    root,
    materials,
    "coastal-highway",
    [
      [-30, -80],
      [-18, 20],
      [-8, 110],
      [0, 210],
      [25, 310],
      [95, 380],
      [190, 410],
      [285, 390],
      [350, 330],
      [390, 240],
    ],
    15,
  );
  createRoad(
    scene,
    root,
    materials,
    "western-ridge-road",
    [
      [-5, 205],
      [-85, 245],
      [-155, 310],
      [-190, 400],
      [-150, 500],
      [-70, 575],
      [30, 625],
    ],
    11,
  );
  createRoad(
    scene,
    root,
    materials,
    "northern-connector",
    [
      [5, 215],
      [80, 250],
      [150, 305],
      [230, 385],
      [245, 500],
      [205, 610],
    ],
    12,
  );
  for (const x of [-70, -35, 0, 35, 70]) {
    createRoad(scene, root, materials, `crownreach-street-x-${x}`, [[x, 145], [x, 285]], 7);
  }
  for (const z of [155, 190, 225, 260]) {
    createRoad(scene, root, materials, `crownreach-street-z-${z}`, [[-88, z], [88, z]], 7);
  }
}

function createBuilding(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
  name: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  tower = false,
): void {
  const ground = terrainHeight(x, z);
  const body = tower
    ? MeshBuilder.CreateCylinder(
        name,
        { height, diameterTop: width * 0.55, diameterBottom: width, tessellation: 10 },
        scene,
      )
    : MeshBuilder.CreateBox(name, { width, depth, height }, scene);
  body.position = new Vector3(x, ground + height * 0.5, z);
  body.parent = root;
  body.material = tower || height > 28 ? materials.glass : materials.concrete;

  const roof = MeshBuilder.CreateCylinder(
    `${name}-roof`,
    {
      height: 1.4,
      diameterTop: tower ? width * 0.55 : Math.max(width, depth) * 0.7,
      diameterBottom: tower ? width * 0.65 : Math.max(width, depth) * 0.9,
      tessellation: tower ? 10 : 4,
    },
    scene,
  );
  roof.position = new Vector3(x, ground + height + 0.65, z);
  roof.rotation.y = tower ? 0 : Math.PI / 4;
  roof.parent = root;
  roof.material = tower ? materials.emissive : materials.roof;
}

function createCrownreach(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  let index = 0;
  for (const x of [-75, -52, -26, 26, 52, 75]) {
    for (const z of [158, 188, 222, 256]) {
      const variation = Math.abs(Math.sin(x * 0.17 + z * 0.08));
      createBuilding(
        scene,
        root,
        materials,
        `crownreach-building-${index}`,
        x,
        z,
        13 + variation * 7,
        14 + (1 - variation) * 8,
        12 + variation * 30,
      );
      index += 1;
    }
  }
  createBuilding(scene, root, materials, "crownreach-zenith-tower", 0, 218, 24, 24, 92, true);

  const plaza = MeshBuilder.CreateCylinder(
    "crownreach-central-plaza",
    { height: 0.7, diameter: 50, tessellation: 32 },
    scene,
  );
  plaza.position = new Vector3(0, terrainHeight(0, 218) + 0.35, 218);
  plaza.parent = root;
  plaza.material = materials.concrete;
}

function createForgeDistrict(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2;
    const x = 235 + Math.cos(angle) * (35 + (index % 3) * 11);
    const z = 400 + Math.sin(angle) * (30 + (index % 2) * 18);
    const height = 13 + (index % 4) * 6;
    const tank = MeshBuilder.CreateCylinder(
      `forgeworks-tank-${index}`,
      { height, diameter: 12 + (index % 3) * 4, tessellation: 14 },
      scene,
    );
    tank.position = new Vector3(x, terrainHeight(x, z) + height * 0.5, z);
    tank.parent = root;
    tank.material = materials.metal;
  }
  for (const offset of [-24, 24]) {
    createBuilding(scene, root, materials, `forgeworks-stack-${offset}`, 235 + offset, 400, 11, 11, 56, true);
  }
}

function createVillage(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  for (let index = 0; index < 18; index += 1) {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const x = -185 + column * 18 + (row % 2) * 7;
    const z = 425 + row * 25;
    createBuilding(
      scene,
      root,
      materials,
      `ridge-village-home-${index}`,
      x,
      z,
      10 + (index % 3) * 2,
      12,
      7 + (index % 2) * 3,
    );
  }
}

function createForest(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  for (let index = 0; index < 150; index += 1) {
    const angle = index * 2.399963;
    const radius = 95 + (index % 17) * 14;
    const x = Math.cos(angle) * radius - 75;
    const z = worldCenterZ + Math.sin(angle) * radius + 105;
    if (Math.hypot(x, z - 220) < 150 || Math.hypot(x - 235, z - 400) < 100) continue;
    const ground = terrainHeight(x, z);
    if (ground < terrainBase - 0.5) continue;

    const height = 7 + (index % 5);
    const trunk = MeshBuilder.CreateCylinder(
      `wild-tree-trunk-${index}`,
      { height, diameter: 1.3, tessellation: 6 },
      scene,
    );
    trunk.position = new Vector3(x, ground + height * 0.5, z);
    trunk.parent = root;
    trunk.material = materials.trunk;

    const crown = MeshBuilder.CreateSphere(
      `wild-tree-crown-${index}`,
      { diameter: 7 + (index % 4), segments: 5 },
      scene,
    );
    crown.position = new Vector3(x, ground + height + 2.8, z);
    crown.scaling.y = 1.35;
    crown.parent = root;
    crown.material = index % 3 === 0 ? materials.foliageDark : materials.foliage;
  }
}

function createLandmarks(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): void {
  const arch = MeshBuilder.CreateTorus(
    "ancient-reach-stone-arch",
    { diameter: 52, thickness: 5, tessellation: 48 },
    scene,
  );
  arch.position = new Vector3(55, terrainHeight(55, 640) + 22, 640);
  arch.parent = root;
  arch.material = materials.rock;

  for (let index = 0; index < 7; index += 1) {
    const x = 55 + (index - 3) * 13;
    const z = 650 + Math.abs(index - 3) * 5;
    const pillar = MeshBuilder.CreateCylinder(
      `ancient-reach-pillar-${index}`,
      { height: 18 + (index % 3) * 6, diameter: 4.5, tessellation: 7 },
      scene,
    );
    pillar.position = new Vector3(x, terrainHeight(x, z) + 10, z);
    pillar.parent = root;
    pillar.material = materials.rock;
  }

  const lighthouse = MeshBuilder.CreateCylinder(
    "south-coast-lighthouse",
    { height: 46, diameterTop: 7, diameterBottom: 13, tessellation: 12 },
    scene,
  );
  lighthouse.position = new Vector3(-280, terrainHeight(-280, 35) + 23, 35);
  lighthouse.parent = root;
  lighthouse.material = materials.concrete;
  const beacon = MeshBuilder.CreateSphere(
    "south-coast-lighthouse-beacon",
    { diameter: 7, segments: 12 },
    scene,
  );
  beacon.position = lighthouse.position.add(new Vector3(0, 24, 0));
  beacon.parent = root;
  beacon.material = materials.emissive;
}

function createTraffic(
  scene: Scene,
  root: TransformNode,
  materials: WorldMaterials,
): TransformNode[] {
  const traffic: TransformNode[] = [];
  for (let index = 0; index < 12; index += 1) {
    const vehicle = new TransformNode(`road-vehicle-${index}`, scene);
    vehicle.parent = root;
    const body = MeshBuilder.CreateBox(
      `road-vehicle-body-${index}`,
      { width: 3.2, height: 1.3, depth: 5.5 },
      scene,
    );
    body.parent = vehicle;
    body.material = index % 3 === 0 ? materials.emissive : materials.metal;
    traffic.push(vehicle);
  }
  return traffic;
}

export function createHighDriftsWorld(scene: Scene): HighDriftsWorld {
  const materials = createMaterials(scene);
  const root = new TransformNode("continuous-high-drifts-region", scene);
  createTerrain(scene, root, materials);
  createRoadNetwork(scene, root, materials);
  createCrownreach(scene, root, materials);
  createForgeDistrict(scene, root, materials);
  createVillage(scene, root, materials);
  createForest(scene, root, materials);
  createLandmarks(scene, root, materials);
  const traffic = createTraffic(scene, root, materials);
  let elapsed = 0;

  return {
    update(_position) {
      elapsed += Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
      traffic.forEach((vehicle, index) => {
        const phase = elapsed * (0.12 + (index % 4) * 0.012) + index * 0.48;
        const z = -45 + ((phase * 95 + index * 58) % 760);
        const x = Math.sin(z * 0.008) * 22 + (index % 2 === 0 ? -5 : 5);
        vehicle.position.set(x, terrainHeight(x, z) + 1.2, z);
        vehicle.rotation.y = Math.atan2(Math.cos(z * 0.008) * 0.176, 1);
      });
    },
    dispose() {
      for (const mesh of root.getChildMeshes()) mesh.dispose();
      root.dispose();
      for (const value of Object.values(materials)) value.dispose();
    },
  };
}

