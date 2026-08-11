import { describe, expect, it } from "vitest";
import {
  blobCanTag,
  blobMembers,
  checkRoundEnd,
  createTagState,
  IT_IMMUNITY,
  ROUND_TIME,
  TAG_REACH,
} from "../tag";

describe("tag", () => {
  it("regular tag ends on the timer with the least-IT player winning", () => {
    const t = createTagState();
    t.mode = "regular";
    t.phase = "play";
    t.roundTimer = 0;
    // Everyone has been IT a lot… except the player.
    Object.values(t.entities).forEach((e) => (e.itTime = 10));
    t.entities.player.itTime = 2;

    expect(checkRoundEnd(t)).toBe(true);
    expect(t.phase).toBe("end");
    expect(t.winnerMsg).toContain("YOU WIN");
  });

  it("freeze tag ends when every non-IT player is frozen", () => {
    const t = createTagState();
    t.mode = "freeze";
    t.phase = "play";
    const it = t.entities[t.itId];
    Object.values(t.entities).forEach((e) => {
      if (e !== it) e.frozen = true;
    });
    expect(checkRoundEnd(t)).toBe(true);
    expect(t.winnerMsg.length).toBeGreaterThan(0);
  });

  it("blob tag ends when only the player is still free", () => {
    const t = createTagState();
    t.mode = "blob";
    t.phase = "play";
    let idx = 1;
    Object.values(t.entities).forEach((e) => {
      if (e.id !== "player") e.blobIdx = idx++;
    });
    t.entities.player.blobIdx = -1;
    t.blobSize = idx - 1;

    expect(checkRoundEnd(t)).toBe(true);
    expect(t.winnerMsg).toContain("LAST ONE FREE");
  });

  it("only the head and tail of the blob chain can tag", () => {
    const t = createTagState();
    t.mode = "blob";
    // createTagState pre-assigns a random bot as blob head — clear the
    // chain first, then build a deliberate 3-link one.
    Object.values(t.entities).forEach((e) => (e.blobIdx = -1));
    t.entities.rex.blobIdx = 0;
    t.entities.ziggy.blobIdx = 1;
    t.entities.ada.blobIdx = 2;

    expect(blobCanTag(t.entities.rex, t.entities)).toBe(true);
    expect(blobCanTag(t.entities.ada, t.entities)).toBe(true);
    expect(blobCanTag(t.entities.ziggy, t.entities)).toBe(false);
    expect(blobMembers(t.entities)).toHaveLength(3);
  });

  it("exposes sane shared constants", () => {
    expect(ROUND_TIME).toBe(60);
    expect(IT_IMMUNITY).toBeGreaterThanOrEqual(1.5);
    expect(TAG_REACH).toBeGreaterThan(1);
  });
});
