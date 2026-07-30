// Shared mutable ref for the tetherball runtime state.
// Kept out of React so we can mutate freely in useFrame.
import { createTState, type TState } from "../../game/tetherball";

export {
  POLE_H,
  POLE_R,
  R_COURT,
  BALL_R,
  ROPE_MAX,
  ROPE_MIN,
  HEIGHT_MARK,
  WIN_WRAPS,
  BALL_HIT_RANGE,
  BALL_GLOW_Y,
  FEEDBACK_RANGE,
} from "../../game/tetherball";

export const TS: { current: TState } = { current: createTState() };

export function resetTether() {
  TS.current = createTState();
}
