// Mutable runtime state for dodgeball — kept outside React.
import { createDodgeState, type DodgeState } from "../../game/dodgeball";
export { createDodgeState, type DodgeState } from "../../game/dodgeball";
export const DS: { current: DodgeState } = { current: createDodgeState() };
export function resetDodgeball() { DS.current = createDodgeState(); }
