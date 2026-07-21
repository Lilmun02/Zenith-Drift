import { GameCanvas } from "../game/GameCanvas";

export function App() {
  return (
    <main className="app-shell">
      <GameCanvas />
      <section className="title-card" aria-label="Prototype status">
        <p className="eyebrow">HIGH-DRIFTS PROTOTYPE</p>
        <h1>ZENITH DRIFT</h1>
        <p>Engine recovery scaffold online</p>
      </section>
    </main>
  );
}

