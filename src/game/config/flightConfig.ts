import type { FlightConfig } from "../rules/flightTypes";

export const flightConfig: FlightConfig = {
  fixedStepSeconds: 1 / 120,
  maxFrameSeconds: 0.1,
  minSpeed: 5,
  maxSpeed: 18,
  acceleration: 4.8,
  velocityResponse: 2.6,
  throttleResponse: 0.55,
  yawRate: Math.PI * 0.42,
  pitchRate: Math.PI * 0.28,
  rollRate: Math.PI * 0.48,
  rotationResponse: 5.5,
  maxPitch: Math.PI * 0.32,
  maxRoll: Math.PI * 0.38,
  weaveChargePerSecond: 34,
  weaveCapacity: 100,
  weaveMinimumRelease: 12,
  weaveReleaseImpulse: 12,
  weaveIdleDecayPerSecond: 16,
  currentHalfWidth: 5,
  currentHalfHeight: 4,
  currentStartZ: -8,
  currentEndZ: 46,
};

