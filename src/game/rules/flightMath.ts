import type { Vec3 } from "./flightTypes";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const approach = (current: number, target: number, response: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-response * dt));

export const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const scale = (value: Vec3, scalar: number): Vec3 => ({
  x: value.x * scalar,
  y: value.y * scalar,
  z: value.z * scalar,
});

export const length = (value: Vec3) =>
  Math.hypot(value.x, value.y, value.z);

export function forwardFromRotation(yaw: number, pitch: number): Vec3 {
  const pitchCosine = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * pitchCosine,
    y: Math.sin(pitch),
    z: Math.cos(yaw) * pitchCosine,
  };
}

export function rightFromYaw(yaw: number): Vec3 {
  return { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
}

