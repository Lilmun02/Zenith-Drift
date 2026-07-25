import { Engine } from "@babylonjs/core/Engines/engine";
import { flightConfig } from "../config/flightConfig";
import { KeyboardFlightInput } from "../input/KeyboardFlightInput";
import type { FlightTelemetry } from "../rules/flightTypes";
import { createPrototypeScene } from "../scenes/createPrototypeScene";

export interface GameRuntime {
  start: () => void;
  dispose: () => void;
}

export function createGameRuntime(
  canvas: HTMLCanvasElement,
  onTelemetry: (telemetry: FlightTelemetry) => void,
): GameRuntime {
  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: false,
    stencil: true,
  });
  const playableScene = createPrototypeScene(engine);
  const input = new KeyboardFlightInput();
  let accumulator = 0;
  let telemetryElapsed = 0;

  const resize = () => engine.resize();

  return {
    start() {
      window.addEventListener("resize", resize);
      input.attach();
      onTelemetry(playableScene.emitTelemetry());
      engine.runRenderLoop(() => {
        const frameSeconds = Math.min(
          engine.getDeltaTime() / 1000,
          flightConfig.maxFrameSeconds,
        );
        accumulator += frameSeconds;
        telemetryElapsed += frameSeconds;
        const sampledInput = input.sample();

        while (accumulator >= flightConfig.fixedStepSeconds) {
          playableScene.step(sampledInput, flightConfig.fixedStepSeconds);
          accumulator -= flightConfig.fixedStepSeconds;
        }

        playableScene.syncPresentation();
        if (telemetryElapsed >= 0.1) {
          onTelemetry(playableScene.emitTelemetry());
          telemetryElapsed = 0;
        }
        playableScene.scene.render();
      });
    },
    dispose() {
      window.removeEventListener("resize", resize);
      input.dispose();
      engine.stopRenderLoop();
      playableScene.scene.dispose();
      engine.dispose();
    },
  };
}
