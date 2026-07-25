import { add, approach, clamp, forwardFromRotation, length, rightFromYaw, scale } from "./flightMath.ts";
import type { FlightConfig, FlightInput, FlightState, FlightTelemetry } from "./flightTypes.ts";

export function createInitialFlightState(): FlightState {
  return {
    position: { x: 0, y: 0, z: -12 },
    velocity: { x: 0, y: 0, z: 5 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    yawVelocity: 0,
    pitchVelocity: 0,
    rollVelocity: 0,
    throttle: 0.35,
    weaveActive: false,
    weaveTension: 0,
    lastReleaseStrength: 0,
    releaseCount: 0,
  };
}

export function isInsideCurrent(state: FlightState, config: FlightConfig): boolean {
  return (
    Math.abs(state.position.x) <= config.currentHalfWidth &&
    Math.abs(state.position.y) <= config.currentHalfHeight &&
    state.position.z >= config.currentStartZ &&
    state.position.z <= config.currentEndZ
  );
}

export function stepFlight(
  state: FlightState,
  input: FlightInput,
  config: FlightConfig,
  dt: number,
): void {
  const safeDt = clamp(dt, 0, config.maxFrameSeconds);
  state.throttle = clamp(
    state.throttle + input.throttle * config.throttleResponse * safeDt,
    0,
    1,
  );

  state.yawVelocity = approach(
    state.yawVelocity,
    input.yaw * config.yawRate,
    config.rotationResponse,
    safeDt,
  );
  state.pitchVelocity = approach(
    state.pitchVelocity,
    input.pitch * config.pitchRate,
    config.rotationResponse,
    safeDt,
  );
  state.rollVelocity = approach(
    state.rollVelocity,
    input.roll * config.rollRate - input.yaw * config.maxRoll * 0.65,
    config.rotationResponse,
    safeDt,
  );

  state.yaw += state.yawVelocity * safeDt;
  state.pitch = clamp(state.pitch + state.pitchVelocity * safeDt, -config.maxPitch, config.maxPitch);
  state.roll = clamp(state.roll + state.rollVelocity * safeDt, -config.maxRoll, config.maxRoll);

  const forward = forwardFromRotation(state.yaw, state.pitch);
  const targetSpeed = config.minSpeed + (config.maxSpeed - config.minSpeed) * state.throttle;
  const currentSpeed = length(state.velocity);
  const acceleratedSpeed = Math.min(targetSpeed, currentSpeed + config.acceleration * safeDt);
  const desiredVelocity = scale(forward, acceleratedSpeed);
  state.velocity = {
    x: approach(state.velocity.x, desiredVelocity.x, config.velocityResponse, safeDt),
    y: approach(state.velocity.y, desiredVelocity.y, config.velocityResponse, safeDt),
    z: approach(state.velocity.z, desiredVelocity.z, config.velocityResponse, safeDt),
  };

  const inCurrent = isInsideCurrent(state, config);
  const canWeave = input.weave && inCurrent;
  if (canWeave) {
    const crossingBonus = 0.6 + Math.min(1, Math.abs(input.yaw) + Math.abs(input.roll) * 0.5);
    state.weaveTension = clamp(
      state.weaveTension + config.weaveChargePerSecond * crossingBonus * safeDt,
      0,
      config.weaveCapacity,
    );
  } else if (!input.weave) {
    state.weaveTension = Math.max(
      0,
      state.weaveTension - config.weaveIdleDecayPerSecond * safeDt,
    );
  }

  if (state.weaveActive && !input.weave) {
    if (state.weaveTension >= config.weaveMinimumRelease) {
      const releaseStrength = state.weaveTension / config.weaveCapacity;
      const lateralRelease = scale(rightFromYaw(state.yaw), input.yaw * releaseStrength * 2.5);
      state.velocity = add(
        state.velocity,
        add(scale(forward, config.weaveReleaseImpulse * releaseStrength), lateralRelease),
      );
      state.lastReleaseStrength = releaseStrength;
      state.releaseCount += 1;
      state.weaveTension = 0;
    } else {
      state.lastReleaseStrength = 0;
    }
  }

  state.weaveActive = input.weave;
  state.position = add(state.position, scale(state.velocity, safeDt));
}

export function createTelemetry(state: FlightState, config: FlightConfig): FlightTelemetry {
  return {
    speed: length(state.velocity),
    throttle: state.throttle,
    weaveTension: state.weaveTension,
    weaving: state.weaveActive,
    insideCurrent: isInsideCurrent(state, config),
    releaseCount: state.releaseCount,
  };
}
