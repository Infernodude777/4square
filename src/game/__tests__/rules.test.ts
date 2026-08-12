import { afterEach, describe, expect, it, vi } from "vitest";
import { HOUSE_RULES, isMoveBanned, pickRule, ruleBotMul, ruleName, ruleScoreMul, ruleSpeedMul } from "../rules";

afterEach(() => vi.restoreAllMocks());

describe("king's rules — foursquare house rules (Season 3)", () => {
  it("bans only the moves each rule names", () => {
    expect(isMoveBanned("nosmash", "smash")).toBe(true);
    expect(isMoveBanned("nosmash", "drive")).toBe(false);
    expect(isMoveBanned("nodrops", "drop")).toBe(true);
    expect(isMoveBanned("nodrops", "lob")).toBe(false);
    expect(isMoveBanned("double", "smash")).toBe(false);
    expect(isMoveBanned("botcharge", "drop")).toBe(false);
    expect(isMoveBanned("lightning", "smash")).toBe(false);
    expect(isMoveBanned(null, "smash")).toBe(false);
  });

  it("scales scores, bot skill, and flight time only when the rule says so", () => {
    expect(ruleScoreMul("double")).toBe(2);
    expect(ruleScoreMul("nosmash")).toBe(1);
    expect(ruleScoreMul(null)).toBe(1);
    expect(ruleBotMul("botcharge")).toBe(1.2);
    expect(ruleBotMul("double")).toBe(1);
    expect(ruleBotMul(null)).toBe(1);
    expect(ruleSpeedMul("lightning")).toBe(0.85);
    expect(ruleSpeedMul("nosmash")).toBe(1);
    expect(ruleSpeedMul(null)).toBe(1);
  });

  it("keeps the standing rule 40% of the time, otherwise flips", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);
    expect(pickRule("nosmash")).toBe("nosmash");
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const next = pickRule("nosmash");
    expect(next).not.toBe("nosmash");
    expect(HOUSE_RULES[next]).toBeDefined();
  });

  it("names rules for the announce popups", () => {
    expect(ruleName("nosmash")).toBe("NO SMASHING");
    expect(ruleName("lightning")).toBe("LIGHTNING COURT");
    expect(ruleName(null)).toBe("");
  });
});
