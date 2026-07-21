import { Engine } from "@babylonjs/core/Engines/engine";
import { createPrototypeScene } from "../scenes/createPrototypeScene";

export interface GameRuntime {
  start: () => void;
  dispose: () => void;
}

export function createGameRuntime(canvas: HTMLCanvasElement): GameRuntime {
  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: false,
    stencil: true,
  });
  const scene = createPrototypeScene(engine, canvas);

  const resize = () => engine.resize();

  return {
    start() {
      window.addEventListener("resize", resize);
      engine.runRenderLoop(() => scene.render());
    },
    dispose() {
      window.removeEventListener("resize", resize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    },
  };
}

