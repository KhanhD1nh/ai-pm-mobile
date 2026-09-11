import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  dismissAppSnackbar,
  getAppSnackbarSnapshot,
  showAppSnackbar,
  subscribeAppSnackbar,
} from "../src/shared/feedback/app-snackbar";

describe("app snackbar store", () => {
  beforeEach(() => dismissAppSnackbar());

  it("publishes a snackbar with sensible defaults", () => {
    showAppSnackbar("Saved");

    expect(getAppSnackbarSnapshot()).toMatchObject({
      message: "Saved",
      tone: "neutral",
      durationMs: 3200,
    });
  });

  it("notifies subscribers when feedback changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppSnackbar(listener);

    showAppSnackbar("Offline", { tone: "warning", durationMs: 4500 });
    const id = getAppSnackbarSnapshot()?.id;
    dismissAppSnackbar(id);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getAppSnackbarSnapshot()).toBeNull();
    unsubscribe();
  });
});
