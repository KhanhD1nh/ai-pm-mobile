import { describe, expect, it } from "vitest";
import { normalizeError } from "../src/shared/errors/app-error";

describe("normalizeError", () => {
  it("maps Expo/iOS fetch connection-loss errors to a safe network error", () => {
    const error = new Error(
      "fetch failed: UnexpectedException: The network connection was lost. (at ExpoModulesCore/Promise.swift:56)",
    );

    expect(normalizeError(error)).toEqual({
      code: "NETWORK_ERROR",
      message:
        "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.",
    });
  });

  it("maps request aborts to a retryable network error", () => {
    const error = new Error("Aborted");
    error.name = "AbortError";

    expect(normalizeError(error)).toEqual({
      code: "NETWORK_ERROR",
      message: "Kết nối mất quá nhiều thời gian. Vui lòng thử lại.",
    });
  });

  it("does not hide unrelated application errors", () => {
    expect(normalizeError(new Error("Invalid local state"))).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Invalid local state",
    });
  });
});
