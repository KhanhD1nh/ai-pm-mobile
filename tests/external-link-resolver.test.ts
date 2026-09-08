import { describe, expect, it } from "vitest";
import { resolveExternalPath } from "../src/features/navigation/external-link-resolver";

describe("resolveExternalPath", () => {
  it("routes issue deep links into a concrete Home stack on cold launch", () => {
    expect(resolveExternalPath("aipm://issue/TEST-7")).toBe(
      "/(tabs)/(home)/issue/TEST-7",
    );
  });

  it("routes project deep links into the Projects stack", () => {
    expect(
      resolveExternalPath(
        "aipm://project/65fb0d96-bafd-4bbf-b6b4-74e81fa830cd",
      ),
    ).toBe("/(tabs)/(projects)/project/65fb0d96-bafd-4bbf-b6b4-74e81fa830cd");
  });

  it("supports path-based forms and rejects unrelated schemes", () => {
    expect(resolveExternalPath("aipm:///issue/AIPM-42")).toBe(
      "/(tabs)/(home)/issue/AIPM-42",
    );
    expect(resolveExternalPath("https://example.com/issue/AIPM-42")).toBeNull();
  });
});
