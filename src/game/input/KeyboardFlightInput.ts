import type { FlightInput } from "../rules/flightTypes";

const CONTROLLED_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "Space",
]);

export class KeyboardFlightInput {
  readonly #pressed = new Set<string>();

  readonly #onKeyDown = (event: KeyboardEvent) => {
    if (CONTROLLED_KEYS.has(event.code)) event.preventDefault();
    this.#pressed.add(event.code);
  };

  readonly #onKeyUp = (event: KeyboardEvent) => {
    if (CONTROLLED_KEYS.has(event.code)) event.preventDefault();
    this.#pressed.delete(event.code);
  };

  attach(): void {
    window.addEventListener("keydown", this.#onKeyDown);
    window.addEventListener("keyup", this.#onKeyUp);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.#onKeyDown);
    window.removeEventListener("keyup", this.#onKeyUp);
    this.#pressed.clear();
  }

  sample(): FlightInput {
    return {
      pitch: Number(this.#pressed.has("KeyW")) - Number(this.#pressed.has("KeyS")),
      yaw: Number(this.#pressed.has("KeyD")) - Number(this.#pressed.has("KeyA")),
      roll: Number(this.#pressed.has("KeyE")) - Number(this.#pressed.has("KeyQ")),
      throttle:
        Number(this.#pressed.has("ShiftLeft") || this.#pressed.has("ShiftRight")) -
        Number(this.#pressed.has("ControlLeft") || this.#pressed.has("ControlRight")),
      weave: this.#pressed.has("Space"),
    };
  }
}

