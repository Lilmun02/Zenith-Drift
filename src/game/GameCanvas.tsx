import { useEffect, useRef } from "react";
import { createGameRuntime } from "./runtime/createGameRuntime";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtime = createGameRuntime(canvas);
    runtime.start();

    return () => runtime.dispose();
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Zenith Drift game scene" />;
}

