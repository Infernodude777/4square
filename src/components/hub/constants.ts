// ── Playground layout ────────────────────────────────────────
//  The yard is a fenced 26×26 blacktop with the EAST side extended
//  to 32 wide (Season 2) so the red-light lane gets its own strip.
//  Courts are laid out in clean, non-overlapping zones with a wide
//  walking corridor between them so nothing visually collides.
//
//        ┌──────── school building (north) ────────┐
//        │  GAGA (NW)   WALLBALL (N)  HOPSCOTCH    │
//        │  BASKETBALL (NE corner)                 │
//        │                      RED LIGHT (east    │
//        │                       strip, N→S lane)  │
//        │   FOUR SQUARE    KICKBALL    TETHERBALL │
//        │   (west)         (centre)     (east)    │
//        │      DODGEBALL (south-east)             │
//        │            ↑ spawn / corridor ↑         │
//        └──────────── playground (south) ─────────┘

/** 9×9 painted court, centred here. Spans x −11.5…−2.5, z −0.5…8.5 */
export const FOUR_SQUARE_POS: [number, number, number] = [-7, 0, 4];

/** ~6.9 m circle, centred here. Spans x 3.6…10.4, z 0.6…7.4 */
export const TETHER_POS: [number, number, number] = [7, 0, 4];

/** Wall plane sits here; the court extends south (+Z) about 5.4 m */
export const WALL_POS: [number, number, number] = [0, 0, -10];

/**
 * Kickball diamond — its own dedicated patch in the open centre of the
 * yard. MUST match the KICK_ORIGIN used by the kickball scene so the hub
 * chalk lines up with where the game actually plays.
 */
export const KICK_POS: [number, number, number] = [2, 0, 0];

/**
 * Basketball half court — north-east corner, hoop facing the yard. The court
 * runs ~8 m deeper (north) than the hoop, so z must leave that depth clear of
 * the north fence (z −13) — this origin parks the baseline right against it.
 */
export const BASKET_POS: [number, number, number] = [11, 0, -5];

/** Gaga pit — north-west corner (octagon, radius ~3.7). */
export const GAGA_POS: [number, number, number] = [-8.5, 0, -8];

/** Dodgeball court — south-east, between the bench and the slide. */
export const DODGE_POS: [number, number, number] = [6.5, 0, 9.5];

/**
 * Playable hopscotch board — north-east of the kickball diamond, east of the
 * wallball court. The board runs ~8.8 m NORTH (−z) of this origin, so it has
 * to sit well south of the school building (front face ≈ z −14.25) and the
 * north fence (z −13). z −4 puts the HOME plate at ≈ −12.8, clear of both.
 */
export const HOPSCOTCH_POS: [number, number, number] = [5.2, 0, -4];

/**
 * Red-light lane (Season 2) — its own strip along the extended east fence.
 * The lane runs ~15 m south → north at x ≈ 14.5, between the dodgeball
 * court (south) and the monkey bars (north).
 */
export const REDLIGHT_POS: [number, number, number] = [14.5, 0, 0];

/** Where the player drops in — open corridor, south of both courts */
export const SPAWN: [number, number, number] = [0, 0, 10];

// ── E-key entry gates ────────────────────────────────────────
// Single source of truth for the "press E to play" radii, shared by the
// HubDirector E-key handler and the HubHUD prompt so the two can never
// drift apart (a prompt that claims "Press E" where pressing E does
// nothing is a classic bug).
export type GateId =
  | "foursquare" | "tetherball" | "wallball" | "swing" | "tag" | "kickball"
  | "basketball" | "dodgeball" | "gaga" | "hopscotch" | "redlight";

/** Radius at which pressing E actually starts the mode / mounts the swing. */
export const ENTER_R: Record<GateId, number> = {
  foursquare: 5.2, tetherball: 4.4, wallball: 5.6, swing: 2.0, tag: 3.5,
  kickball: 4.8, basketball: 5.8, dodgeball: 5.0, gaga: 5.4, hopscotch: 4.2,
  redlight: 3.4,
};

/** Slightly wider "something's here" radius (suppresses the tag prompt). */
export const NEAR_ANY_R: Record<GateId, number> = {
  foursquare: 5.5, tetherball: 4.8, wallball: 6.0, swing: 2.5, tag: 3.5,
  kickball: 5.5, basketball: 6.0, dodgeball: 5.2, gaga: 5.6, hopscotch: 4.4,
  redlight: 3.6,
};

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

/** Tag game: player enters by pressing E in the corridor, far enough from the spawn point that a fresh drop-in can't trigger it accidentally */
export const TAG_POS: [number, number, number] = [0, 0, 6];
