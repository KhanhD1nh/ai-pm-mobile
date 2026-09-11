import { describe, expect, it } from "vitest";
import { resolveSwipeActionRelease } from "../src/shared/gestures/swipe-action";

describe("resolveSwipeActionRelease", () => {
  it("keeps a short swipe closed", () => {
    expect(
      resolveSwipeActionRelease({
        projectedX: -30,
        actionWidth: 96,
        rowWidth: 390,
      }),
    ).toBe("close");
  });

  it("reveals the action for a normal swipe", () => {
    expect(
      resolveSwipeActionRelease({
        projectedX: -90,
        actionWidth: 96,
        rowWidth: 390,
      }),
    ).toBe("open");
  });

  it("executes the action for a full swipe", () => {
    expect(
      resolveSwipeActionRelease({
        projectedX: -240,
        actionWidth: 96,
        rowWidth: 390,
      }),
    ).toBe("action");
  });
});
