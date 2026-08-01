// Mutable runtime state for wallball — kept outside React.
import { createWState, type WallState } from "../../game/wallball";
export { createWState, type WallState } from "../../game/wallball";
export const WS: { current: WallState } = { current: createWState() };
export function resetWall() { WS.current = createWState(); }
