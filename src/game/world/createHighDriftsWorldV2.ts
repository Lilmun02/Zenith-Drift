import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
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

const CENTER_Z = 360;
const SEA_Y = -34;

function mat(scene: Scene, name: string, diffuse: Color3, emissive = Color3.Black()): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = diffuse;
  m.emissiveColor = emissive;
  m.specularColor = diffuse.scale(0.2);
  return m;
}

function terrainHeight(x: number, z: number): number {
  const dz = z - CENTER_Z;
  const island = Math.max(0, 1 - Math.sqrt((x / 560) ** 2 + (dz / 600) ** 2));
  const rolling = Math.sin(x * 0.012) * 9 + Math.cos(z * 0.011) * 7 + Math.sin((x + z) * 0.006) * 8;
  const westMass = Math.exp(-(((x + 330) / 145) ** 2 + ((z - 430) / 310) ** 2)) * 92;
  const eastMass = Math.exp(-(((x - 340) / 180) ** 2 + ((z - 530) / 240) ** 2)) * 70;
  const cityFlatten = Math.exp(-((x / 150) ** 2 + ((z - 235) / 150) ** 2));
  return SEA_Y + 7 + island * (24 + rolling + westMass + eastMass) * (1 - cityFlatten * 0.7);
}

function createTerrain(scene: Scene, root: TransformNode) {
  const seaMat = mat(scene, "v2-sea", new Color3(0.025, 0.12, 0.19), new Color3(0.004, 0.025, 0.045));
  seaMat.alpha = 0.96;
  const sea = MeshBuilder.CreateGround("v2-sea", { width: 2200, height: 2200 }, scene);
  sea.position = new Vector3(0, SEA_Y, CENTER_Z);
  sea.material = seaMat;
  sea.parent = root;

  const groundMat = mat(scene, "v2-ground", new Color3(0.2, 0.28, 0.18));
  const ground = MeshBuilder.CreateGround("v2-terrain", { width: 1180, height: 1250, subdivisions: 110, updatable: true }, scene);
  ground.position.z = CENTER_Z;
  ground.material = groundMat;
  ground.parent = root;

  const positions = ground.getVerticesData(VertexBuffer.PositionKind);
  const indices = ground.getIndices();
  if (positions && indices) {
    const colors: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2] + CENTER_Z;
      const y = terrainHeight(x, z);
      positions[i + 1] = y;
      const slopeBand = Math.max(0, Math.min(1, (y + 14) / 65));
      const noise = Math.sin(x * 0.055 + z * 0.031) * 0.025;
      let c: Color4;
      if (y < SEA_Y + 3) c = new Color4(0.38 + noise, 0.32 + noise, 0.22, 1);
      else if (y > 35) c = new Color4(0.23 + noise, 0.24 + noise, 0.22 + noise, 1);
      else c = new Color4(0.13 + noise, 0.24 + slopeBand * 0.08, 0.13, 1);
      colors.push(c.r, c.g, c.b, c.a);
    }
    const normals = new Array<number>(positions.length).fill(0);
    VertexData.ComputeNormals(positions, indices, normals);
    ground.updateVerticesData(VertexBuffer.PositionKind, positions);
    ground.updateVerticesData(VertexBuffer.NormalKind, normals);
    ground.setVerticesData(VertexBuffer.ColorKind, colors);
    ground.useVertexColors = true;
  }

  const rockMat = mat(scene, "v2-rock", new Color3(0.16, 0.17, 0.18));
  const ridgePoints: Array<[number, number, number]> = [
    [-430, 430, 58], [-390, 510, 76], [-350, 580, 95], [-300, 650, 72],
    [430, 470, 62], [375, 570, 80], [320, 660, 68],
  ];
  ridgePoints.forEach(([x, z, h], i) => {
    const rock = MeshBuilder.CreateCylinder(`ridge-${i}`, { height: h, diameterTop: 8, diameterBottom: 62, tessellation: 7 }, scene);
    rock.position = new Vector3(x, terrainHeight(x, z) + h / 2 - 6, z);
    rock.scaling.z = 1.35;
    rock.rotation.y = i * 0.4;
    rock.material = rockMat;
    rock.parent = root;
  });
}

function createRoad(scene: Scene, root: TransformNode) {
  const asphalt = mat(scene, "v2-asphalt", new Color3(0.035, 0.042, 0.05));
  const lineMat = mat(scene, "v2-road-lines", new Color3(0.72, 0.58, 0.25), new Color3(0.1, 0.065, 0.01));
  const road = MeshBuilder.CreateBox("crownreach-boulevard", { width: 20, height: 0.45, depth: 390 }, scene);
  road.position = new Vector3(0, terrainHeight(0, 220) + 0.35, 235);
  road.material = asphalt;
  road.parent = root;
  for (const side of [-1, 1]) {
    const line = MeshBuilder.CreateBox(`road-edge-${side}`, { width: 0.45, height: 0.5, depth: 390 }, scene);
    line.position = new Vector3(side * 8.2, road.position.y + 0.05, 235);
    line.material = lineMat;
    line.parent = root;
  }
  for (let z = 70; z < 410; z += 18) {
    const dash = MeshBuilder.CreateBox(`road-dash-${z}`, { width: 0.35, height: 0.51, depth: 8 }, scene);
    dash.position = new Vector3(0, road.position.y + 0.06, z);
    dash.material = lineMat;
    dash.parent = root;
  }
}

function createTree(scene: Scene, root: TransformNode, x: number, z: number, scale = 1) {
  const trunkMat = mat(scene, "tree-trunk-v2", new Color3(0.12, 0.075, 0.045));
  const leafMat = mat(scene, "tree-leaf-v2", new Color3(0.055, 0.18, 0.09));
  const y = terrainHeight(x, z);
  const trunk = MeshBuilder.CreateCylinder(`tree-trunk-${x}-${z}`, { height: 5 * scale, diameterTop: 0.55 * scale, diameterBottom: 0.9 * scale, tessellation: 8 }, scene);
  trunk.position = new Vector3(x, y + 2.5 * scale, z);
  trunk.material = trunkMat;
  trunk.parent = root;
  const clusters = [[0,0,0],[-1.1,0.3,0.4],[1.1,0.5,-0.2],[0.3,0.8,0.9]];
  clusters.forEach((p, i) => {
    const crown = MeshBuilder.CreateSphere(`tree-crown-${x}-${z}-${i}`, { diameter: (3.3 - i * 0.18) * scale, segments: 8 }, scene);
    crown.scaling.y = 1.25;
    crown.position = new Vector3(x + p[0] * scale, y + (5.2 + p[1]) * scale, z + p[2] * scale);
    crown.material = leafMat;
    crown.parent = root;
  });
}

function createBuilding(scene: Scene, root: TransformNode, x: number, z: number, width: number, depth: number, height: number, index: number) {
  const stone = mat(scene, `city-stone-${index}`, new Color3(0.105 + (index % 3) * 0.015, 0.13, 0.15));
  const glass = mat(scene, `city-glass-${index}`, new Color3(0.035, 0.16, 0.22), new Color3(0.004, 0.045, 0.065));
  const glow = mat(scene, `city-glow-${index}`, new Color3(0.08, 0.55, 0.68), new Color3(0.02, 0.35, 0.52));
  const y = terrainHeight(x, z);

  const base = MeshBuilder.CreateBox(`city-base-${index}`, { width: width * 1.08, depth: depth * 1.08, height: 5 }, scene);
  base.position = new Vector3(x, y + 2.5, z);
  base.material = stone;
  base.parent = root;

  const body = MeshBuilder.CreateCylinder(`city-body-${index}`, { height, diameterTop: width * 0.7, diameterBottom: width, tessellation: 8 }, scene);
  body.scaling.z = depth / width;
  body.position = new Vector3(x, y + 5 + height / 2, z);
  body.material = index % 2 ? glass : stone;
  body.parent = root;

  const crown = MeshBuilder.CreateCylinder(`city-crown-${index}`, { height: 3.5, diameterTop: width * 0.25, diameterBottom: width * 0.72, tessellation: 8 }, scene);
  crown.scaling.z = depth / width;
  crown.position = new Vector3(x, y + 6.7 + height, z);
  crown.material = glow;
  crown.parent = root;

  const ring = MeshBuilder.CreateTorus(`city-ring-${index}`, { diameter: width * 0.82, thickness: 0.32, tessellation: 20 }, scene);
  ring.scaling.z = depth / width;
  ring.position = new Vector3(x, y + 5 + height * 0.72, z);
  ring.rotation.x = Math.PI / 2;
  ring.material = glow;
  ring.parent = root;
}

function createCrownreach(scene: Scene, root: TransformNode) {
  const placements: Array<[number, number, number, number, number]> = [
    [-62,130,23,25,38], [62,130,25,23,42], [-72,178,28,24,58], [72,178,27,25,54],
    [-66,235,31,28,70], [66,235,30,29,66], [-72,300,27,25,52], [72,300,29,24,57],
    [-58,350,22,22,40], [58,350,24,22,44], [-110,225,22,25,34], [110,225,24,25,38],
  ];
  placements.forEach((p, i) => createBuilding(scene, root, ...p, i));

  const dark = mat(scene, "zenith-spire-dark", new Color3(0.035, 0.06, 0.075));
  const glow = mat(scene, "zenith-spire-glow", new Color3(0.1, 0.7, 0.82), new Color3(0.04, 0.55, 0.8));
  const y = terrainHeight(0, 245);
  const lower = MeshBuilder.CreateCylinder("zenith-spire-lower", { height: 72, diameterTop: 18, diameterBottom: 34, tessellation: 10 }, scene);
  lower.position = new Vector3(0, y + 36, 245);
  lower.material = dark;
  lower.parent = root;
  const upper = MeshBuilder.CreateCylinder("zenith-spire-upper", { height: 58, diameterTop: 2.5, diameterBottom: 17, tessellation: 10 }, scene);
  upper.position = new Vector3(0, y + 101, 245);
  upper.material = dark;
  upper.parent = root;
  for (const h of [24, 48, 70, 96]) {
    const ring = MeshBuilder.CreateTorus(`spire-ring-${h}`, { diameter: 28 - h * 0.09, thickness: 0.55, tessellation: 32 }, scene);
    ring.position = new Vector3(0, y + h, 245);
    ring.rotation.x = Math.PI / 2;
    ring.material = glow;
    ring.parent = root;
  }
  const beacon = MeshBuilder.CreateSphere("spire-beacon", { diameter: 4.2, segments: 16 }, scene);
  beacon.position = new Vector3(0, y + 132, 245);
  beacon.material = glow;
  beacon.parent = root;

  const lampMat = glow;
  for (let z = 80; z <= 400; z += 28) {
    for (const side of [-1,1]) {
      const pole = MeshBuilder.CreateCylinder(`lamp-${side}-${z}`, { height: 5.5, diameter: 0.22, tessellation: 8 }, scene);
      pole.position = new Vector3(side * 12.5, terrainHeight(side * 12.5, z) + 2.75, z);
      pole.material = dark;
      pole.parent = root;
      const lamp = MeshBuilder.CreateSphere(`lamp-glow-${side}-${z}`, { diameter: 0.7, segments: 8 }, scene);
      lamp.position = new Vector3(side * 12.5, pole.position.y + 2.75, z);
      lamp.material = lampMat;
      lamp.parent = root;
    }
  }
}

function populateNature(scene: Scene, root: TransformNode) {
  const positions: Array<[number, number, number]> = [
    [-180,80,1.2],[-220,115,1.0],[-250,160,1.25],[-285,205,1.1],[-320,255,1.3],[-350,310,1.1],
    [180,85,1.1],[220,125,1.25],[260,170,1.0],[300,220,1.25],[335,280,1.1],[365,340,1.3],
    [-200,430,1.2],[-260,500,1.3],[-310,560,1.15],[205,445,1.1],[255,515,1.3],[315,585,1.15]
  ];
  positions.forEach(([x,z,s]) => createTree(scene, root, x, z, s));
}

export function createHighDriftsWorldV2(scene: Scene): HighDriftsWorld {
  const root = new TransformNode("high-drifts-v2", scene);
  createTerrain(scene, root);
  createRoad(scene, root);
  createCrownreach(scene, root);
  populateNature(scene, root);

  return {
    update(_position: Vec3) {},
    dispose() { root.dispose(false, true); },
  };
}
