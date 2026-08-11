// Mutable runtime state for hopscotch — kept outside React.
import { createHState, type HState } from "../../game/hopscotch";
export { createHState, type HState } from "../../game/hopscotch";
export const HS: { current: HState } = { current: createHState() };
export function resetHopscotch() { HS.current = createHState(); }
