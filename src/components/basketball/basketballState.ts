// Mutable runtime state for basketball — kept outside React.
import { createBState, type BState } from "../../game/basketball";
export { createBState, type BState } from "../../game/basketball";
export const BS: { current: BState } = { current: createBState() };
export function resetBasketball() { BS.current = createBState(); }
