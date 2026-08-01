import { createTagState, type TagState } from "../../game/tag";

export { createTagState, TAG_FIELD, type TagState } from "../../game/tag";
export const TAG: { current: TagState } = { current: createTagState() };
export function resetTag() { TAG.current = createTagState(); }
