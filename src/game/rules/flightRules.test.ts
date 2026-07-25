import assert from "node:assert/strict";
import test from "node:test";
import { flightConfig } from "../config/flightConfig.ts";
import { createInitialFlightState, stepFlight } from "./flightRules.ts";
import type { FlightInput } from "./flightTypes.ts";

const neutralInput: FlightInput = { pitch: 0, roll: 0, yaw: 0, throttle: 0, weave: false };

test("neutral flight advances the ship without producing invalid values", () => {
  const state = createInitialFlightState();
  for (let index = 0; index < 240; index += 1) {
    stepFlight(state, neutralInput, flightConfig, flightConfig.fixedStepSeconds);
  }

  assert.ok(state.position.z > -2);
  assert.ok(Number.isFinite(state.position.x));
  assert.ok(Number.isFinite(state.velocity.z));
});

test("pitch and roll remain inside configured safety limits", () => {
  const state = createInitialFlightState();
  const input: FlightInput = { ...neutralInput, pitch: 1, roll: 1 };
  for (let index = 0; index < 1200; index += 1) {
    stepFlight(state, input, flightConfig, flightConfig.fixedStepSeconds);
  }

  assert.ok(Math.abs(state.pitch) <= flightConfig.maxPitch);
  assert.ok(Math.abs(state.roll) <= flightConfig.maxRoll);
});

test("Driftweaving charges only inside the current field", () => {
  const state = createInitialFlightState();
  const input: FlightInput = { ...neutralInput, weave: true, yaw: 1 };

  state.position = { x: flightConfig.currentHalfWidth + 2, y: 0, z: 0 };
  stepFlight(state, input, flightConfig, 1);
  assert.equal(state.weaveTension, 0);

  state.position = { x: 0, y: 0, z: 0 };
  stepFlight(state, input, flightConfig, 1);
  assert.ok(state.weaveTension > 0);
});

test("releasing a charged weave produces one impulse and clears tension", () => {
  const state = createInitialFlightState();
  state.position = { x: 0, y: 0, z: 0 };
  const weaveInput: FlightInput = { ...neutralInput, weave: true, yaw: 1 };

  for (let index = 0; index < 240; index += 1) {
    stepFlight(state, weaveInput, flightConfig, flightConfig.fixedStepSeconds);
  }
  const speedBeforeRelease = Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z);
  stepFlight(state, neutralInput, flightConfig, flightConfig.fixedStepSeconds);
  const speedAfterRelease = Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z);

  assert.equal(state.releaseCount, 1);
  assert.equal(state.weaveTension, 0);
  assert.ok(speedAfterRelease > speedBeforeRelease);
});
