// ── Playground layout ────────────────────────────────────────
//  The yard is a fenced 26×26 blacktop. Courts are laid out in three
//  clean, non-overlapping zones with a wide walking corridor between
//  them so nothing visually collides.
//
//        ┌──────── school building (north) ────────┐
//        │            WALLBALL  (z ≈ −10 … −5)     │
//        │                                          │
//        │   FOUR SQUARE          TETHERBALL        │
//        │   (x ≈ −11…−3)         (x ≈ 4…10)        │
//        │            ↑ spawn / corridor ↑          │
//        └──────────── playground (south) ──────────┘

/** 9×9 painted court, centred here. Spans x −11.5…−2.5, z −0.5…8.5 */
export const FOUR_SQUARE_POS: [number, number, number] = [-7, 0, 4];

/** ~6.9 m circle, centred here. Spans x 3.6…10.4, z 0.6…7.4 */
export const TETHER_POS: [number, number, number] = [7, 0, 4];

/** Wall plane sits here; the court extends south (+Z) about 5.4 m */
export const WALL_POS: [number, number, number] = [0, 0, -10];

/** Where the player drops in — open corridor, south of both courts */
export const SPAWN: [number, number, number] = [0, 0, 10];

/** Swingset position in the south-west corner of the schoolyard */
export const SWING_POS: [number, number, number] = [-8.8, 0, 12.0];

// ── Swing geometry ───────────────────────────────────────────
//  These MUST match the <SwingSet> model in World.tsx. Both the model
//  and the rider read `swingAngle()` so the seat and the kid sitting on
//  it can never drift out of sync.
export const SWING_ROT_Y    = 0.5;    // the set's rotation-y
export const SWING_PIVOT_Y  = 2.5;    // height of the top bar
export const SWING_ROPE_LEN = 1.52;   // top bar → seat plank
export const SWING_SEAT_X   = -0.7;   // local x of the seat you ride
export const SWING_AMP      = 0.42;   // swing amplitude (radians)
export const SWING_SPEED    = 1.5;    // swing driver speed

/** Angle of the ridden seat at a given clock time. */
export function swingAngle(time: number): number {
  return Math.sin(time * SWING_SPEED) * SWING_AMP;
}

/** Convert a point in the swing-set's local space into world space. */
function swingLocalToWorld(lx: number, ly: number, lz: number) {
  const c = Math.cos(SWING_ROT_Y);
  const s = Math.sin(SWING_ROT_Y);
  return {
    x: SWING_POS[0] + lx * c + lz * s,
    y: ly,
    z: SWING_POS[2] - lx * s + lz * c,
  };
}

/** World transform of the ridden seat plank at a given time. */
export function swingSeat(time: number) {
  const a = swingAngle(time);
  const p = swingLocalToWorld(
    SWING_SEAT_X,
    SWING_PIVOT_Y - SWING_ROPE_LEN * Math.cos(a),
    -SWING_ROPE_LEN * Math.sin(a),
  );
  return { ...p, angle: a };
}

/**
 * Facing angle that seats the rider with their back to the fence, looking
 * north up the yard toward the school. The model's forward is +Z, so we
 * face the reverse of the swing's local +Z axis.
 */
export const SWING_FACING = SWING_ROT_Y - Math.PI;

/** Clear patch of blacktop to hop down onto, in front of the frame. */
export const SWING_DISMOUNT = swingLocalToWorld(SWING_SEAT_X, 0, -1.8);

/** Tag game: player enters by pressing E somewhere in the open yard centre */
export const TAG_POS: [number, number, number] = [0, 0, 0];
