import { useEffect, useRef } from "react";
import type { FlightTelemetry } from "./rules/flightTypes";
import { createGameRuntime } from "./runtime/createGameRuntime";

interface GameCanvasProps {
  onTelemetry: (telemetry: FlightTelemetry) => void;
}

export function GameCanvas({ onTelemetry }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtime = createGameRuntime(canvas, onTelemetry);
    runtime.start();

    return () => runtime.dispose();
  }, [onTelemetry]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Zenith Drift game scene" />;
}

