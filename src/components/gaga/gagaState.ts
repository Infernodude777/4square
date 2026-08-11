// Mutable runtime state for gaga ball — kept outside React.
import { createGagaState, type GagaState } from "../../game/gaga";
export { createGagaState, type GagaState } from "../../game/gaga";
export const GS: { current: GagaState } = { current: createGagaState() };
export function resetGaga() { GS.current = createGagaState(); }
