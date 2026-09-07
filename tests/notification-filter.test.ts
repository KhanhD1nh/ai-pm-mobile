import { describe, expect, it } from 'vitest';
import { matchesNotificationFilter } from '../src/features/notifications/model/notification-filter';

const notification = (type: string, read = false) => ({ type, read }) as any;

describe('notification filters', () => {
  it('filters unread notifications', () => {
    expect(matchesNotificationFilter('UNREAD', notification('ISSUE_ASSIGNED', false))).toBe(true);
    expect(matchesNotificationFilter('UNREAD', notification('ISSUE_ASSIGNED', true))).toBe(false);
  });

  it('recognizes assigned, mention, alert and AI categories', () => {
    expect(matchesNotificationFilter('ASSIGNED', notification('ISSUE_ASSIGNED'))).toBe(true);
    expect(matchesNotificationFilter('MENTIONS', notification('COMMENT_MENTION'))).toBe(true);
    expect(matchesNotificationFilter('ALERTS', notification('PROJECT_AT_RISK'))).toBe(true);
    expect(matchesNotificationFilter('AI', notification('AI_ACTION_READY'))).toBe(true);
  });

  it('lets ALL pass every notification', () => {
    expect(matchesNotificationFilter('ALL', notification('SOMETHING_NEW', true))).toBe(true);
  });
});
