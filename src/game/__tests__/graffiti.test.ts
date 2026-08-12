import { beforeEach, describe, expect, it } from "vitest";
import { MAX_MARKS, addMark, clearMarks, loadMarks, sanitizeMark } from "../graffiti";

beforeEach(() => clearMarks());

describe("the chalk wall — graffiti (Season 3)", () => {
  it("sanitises marks: trims, caps length, drops control characters", () => {
    expect(sanitizeMark("  hi there  ")).toBe("hi there");
    expect(sanitizeMark("a".repeat(80)).length).toBe(40);
    expect(sanitizeMark("no\u0000control\u0007chars")).toBe("nocontrolchars");
    expect(sanitizeMark("   ")).toBe("");
  });

  it("stores marks and ignores empty scrawls", () => {
    addMark("ADA smells like rust");
    expect(loadMarks()).toEqual(["ADA smells like rust"]);
    addMark("   ");
    expect(loadMarks()).toHaveLength(1);
  });

  it("keeps only the newest MAX_MARKS", () => {
    for (let i = 0; i < MAX_MARKS + 3; i++) addMark(`mark ${i}`);
    const wall = loadMarks();
    expect(wall).toHaveLength(MAX_MARKS);
    expect(wall[0]).toBe("mark 3");
    expect(wall[wall.length - 1]).toBe(`mark ${MAX_MARKS + 2}`);
  });

  it("clearMarks wipes the wall", () => {
    addMark("hi");
    clearMarks();
    expect(loadMarks()).toEqual([]);
  });
});
