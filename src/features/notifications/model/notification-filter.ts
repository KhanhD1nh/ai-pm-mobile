import type { NotificationItem } from "@/shared/contracts";

export const NOTIFICATION_FILTERS = [
  "ALL",
  "UNREAD",
  "ASSIGNED",
  "MENTIONS",
  "ALERTS",
  "AI",
] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

const ASSIGNED_TYPES = new Set([
  "ISSUE_ASSIGNED",
  "ISSUE_PARTICIPANT_ADDED",
  "PROJECT_MEMBER_ADDED",
  "PROJECT_MEMBER_ROLE_CHANGED",
]);

const ALERT_TYPES = new Set([
  "ISSUE_OVERDUE",
  "ISSUE_DUE_SOON",
  "CYCLE_ENDING_SOON",
  "MILESTONE_AT_RISK",
  "MILESTONE_OVERDUE",
  "CI_FAILED",
  "PROJECT_ALERT",
]);

export function matchesNotificationFilter(
  filter: NotificationFilter,
  notification: NotificationItem,
) {
  if (filter === "UNREAD") return !notification.read;
  if (filter === "ASSIGNED") return ASSIGNED_TYPES.has(notification.type);
  if (filter === "MENTIONS") return notification.type === "ISSUE_MENTIONED";
  if (filter === "ALERTS") return ALERT_TYPES.has(notification.type);
  if (filter === "AI") return notification.type.startsWith("AI_");
  return true;
}
