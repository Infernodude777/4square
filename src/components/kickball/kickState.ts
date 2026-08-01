import { createKickState, type KickState } from "../../game/kickball";

export { createKickState, KICK_FIELD, type KickState } from "../../game/kickball";
export const KICK: { current: KickState } = { current: createKickState() };
export function resetKick() { KICK.current = createKickState(); }
