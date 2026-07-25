import { useCallback, useState } from "react";
import { GameCanvas } from "../game/GameCanvas";
import type { FlightTelemetry } from "../game/rules/flightTypes";
import { FlightHud } from "./FlightHud";

const initialTelemetry: FlightTelemetry = {
  speed: 5,
  throttle: 0.35,
  weaveTension: 0,
  weaving: false,
  insideCurrent: false,
  releaseCount: 0,
};

export function App() {
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const updateTelemetry = useCallback((value: FlightTelemetry) => setTelemetry(value), []);

  return (
    <main className="app-shell">
      <GameCanvas onTelemetry={updateTelemetry} />
      <section className="title-card" aria-label="Prototype status">
        <p className="eyebrow">HIGH-DRIFTS PROTOTYPE</p>
        <h1>ZENITH DRIFT</h1>
        <p>Crownreach Approach · High-Drifts Region</p>
      </section>
      <FlightHud telemetry={telemetry} />
    </main>
  );
}

