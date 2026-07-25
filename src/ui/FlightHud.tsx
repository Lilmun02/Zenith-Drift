import type { FlightTelemetry } from "../game/rules/flightTypes";

interface FlightHudProps {
  telemetry: FlightTelemetry;
}

export function FlightHud({ telemetry }: FlightHudProps) {
  const tension = Math.round(telemetry.weaveTension);

  return (
    <aside className="flight-hud" aria-label="Flight telemetry">
      <div className="hud-row"><span>Speed</span><strong>{telemetry.speed.toFixed(1)}</strong></div>
      <div className="hud-row"><span>Throttle</span><strong>{Math.round(telemetry.throttle * 100)}%</strong></div>
      <div className="tension-label"><span>Driftweave</span><strong>{tension}%</strong></div>
      <div className="tension-track" aria-label={`Driftweave tension ${tension}%`}>
        <div className="tension-fill" style={{ width: `${tension}%` }} />
      </div>
      <p className={telemetry.insideCurrent ? "current-status active" : "current-status"}>
        {telemetry.insideCurrent ? "CURRENT CAPTURE RANGE" : "SEEK CURRENT FILAMENTS"}
      </p>
      <p className="controls">W/S pitch · A/D yaw · Q/E roll<br />Shift/Ctrl throttle · Hold Space to weave</p>
    </aside>
  );
}

