export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FlightInput {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  weave: boolean;
}

export interface FlightConfig {
  fixedStepSeconds: number;
  maxFrameSeconds: number;
  minSpeed: number;
  maxSpeed: number;
  acceleration: number;
  velocityResponse: number;
  throttleResponse: number;
  yawRate: number;
  pitchRate: number;
  rollRate: number;
  rotationResponse: number;
  maxPitch: number;
  maxRoll: number;
  weaveChargePerSecond: number;
  weaveCapacity: number;
  weaveMinimumRelease: number;
  weaveReleaseImpulse: number;
  weaveIdleDecayPerSecond: number;
  currentHalfWidth: number;
  currentHalfHeight: number;
  currentStartZ: number;
  currentEndZ: number;
}

export interface FlightState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
  roll: number;
  yawVelocity: number;
  pitchVelocity: number;
  rollVelocity: number;
  throttle: number;
  weaveActive: boolean;
  weaveTension: number;
  lastReleaseStrength: number;
  releaseCount: number;
}

export interface FlightTelemetry {
  speed: number;
  throttle: number;
  weaveTension: number;
  weaving: boolean;
  insideCurrent: boolean;
  releaseCount: number;
}

