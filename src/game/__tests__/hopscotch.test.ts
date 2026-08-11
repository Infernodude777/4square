import { describe, expect, it } from "vitest";
import {
  createHState,
  stepH,
  tryHop,
  cellAt,
  cellPos,
  CELLS,
  CELL_SIZE,
  FAULT_PENALTY,
} from "../hopscotch";
import * as THREE from "three";

describe("hopscotch time trial", () => {
  it("counts down then starts the run", () => {
    const t = createHState();
    expect(t.phase).toBe("countdown");
    expect(t.countdown).toBe(3);
    stepH(t, 1);
    stepH(t, 1);
    expect(t.phase).toBe("countdown");
    stepH(t, 1.01);
    expect(t.phase).toBe("play");
  });

  it("hitting the next cell in order advances the target", () => {
    const t = createHState();
    t.phase = "play";
    for (let k = 0; k < CELLS; k++) {
      expect(tryHop(t, k)).toBe(true);
      expect(t.standing).toBe(k);
    }
    expect(t.target).toBe(CELLS);
    expect(t.phase).toBe("over");
    expect(t.finishTime).not.toBeNull();
  });

  it("a wrong cell is a fault and does not advance", () => {
    const t = createHState();
    t.phase = "play";
    expect(tryHop(t, 3)).toBe(false); // wrong first hop
    expect(t.faults).toBe(1);
    expect(t.target).toBe(0);
    expect(t.standing).toBe(-1);
  });

  it("fast runs beat the bots, slow runs lose", () => {
    const fast = createHState();
    fast.phase = "play";
    fast.time = 5; // finish fast → beats every bot time (~14.5s+)
    for (let k = 0; k < CELLS; k++) tryHop(fast, k);
    expect(fast.winner).toBe(0);
    expect(fast.finishTime).toBeCloseTo(5, 5);

    const slow = createHState();
    slow.phase = "play";
    slow.time = 40;
    for (let k = 0; k < CELLS; k++) tryHop(slow, k);
    expect(slow.winner).toBe(1);
  });

  it("faults add the penalty to the finish time", () => {
    const t = createHState();
    t.phase = "play";
    t.time = 10;
    for (let k = 0; k < CELLS; k++) {
      if (k % 2 === 1) tryHop(t, k - 1); // wrong cell on odd hops → 5 faults
      tryHop(t, k);
    }
    expect(t.faults).toBe(5);
    expect(t.finishTime).toBeCloseTo(10 + 5 * FAULT_PENALTY, 5);
  });

  it("cellAt maps world points to cells", () => {
    const c = cellPos(0, new THREE.Vector3());
    expect(cellAt(c.x, c.z)).toBe(0);
    // just inside the half-size + tolerance radius → still cell 0
    expect(cellAt(c.x + CELL_SIZE / 2, c.z)).toBe(0);
    // clearly outside → no cell
    expect(cellAt(c.x + CELL_SIZE, c.z)).toBe(-1);
    expect(cellAt(50, 50)).toBe(-1);
  });
});
