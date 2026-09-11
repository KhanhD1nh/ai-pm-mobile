export type SwipeActionReleaseDecision = "close" | "open" | "action";

export function resolveSwipeActionRelease({
  projectedX,
  actionWidth,
  rowWidth,
}: {
  projectedX: number;
  actionWidth: number;
  rowWidth: number;
}): SwipeActionReleaseDecision {
  const fullSwipeDistance =
    rowWidth > 0
      ? Math.max(actionWidth * 1.75, rowWidth * 0.52)
      : actionWidth * 2.2;

  if (projectedX <= -fullSwipeDistance) return "action";
  if (projectedX <= -actionWidth * 0.42) return "open";
  return "close";
}

export function getSwipeActionDragLimit(rowWidth: number, actionWidth: number) {
  return rowWidth > 0 ? Math.max(actionWidth, rowWidth) : actionWidth * 3;
}
