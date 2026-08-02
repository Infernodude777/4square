// Shared mutable ref for the kickball runtime state.
// Kept out of React so we can mutate freely in useFrame.
import { createKickState, type KickState } from "../../game/kickball";

export const KS: { current: KickState } = { current: createKickState() };

export function resetKickball() {
  KS.current = createKickState();
}
