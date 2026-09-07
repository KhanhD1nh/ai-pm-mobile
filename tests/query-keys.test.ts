import { describe, expect, it } from 'vitest';
import { issueKeys } from '../src/features/issues/query-keys';
import { projectKeys } from '../src/features/projects/query-keys';
import { notificationKeys } from '../src/features/notifications/query-keys';
import { agentKeys } from '../src/features/agents/query-keys';

describe('query key isolation', () => {
  it('isolates My Work by organization and user', () => {
    expect(issueKeys.myWork('org-a', 'user-a')).not.toEqual(issueKeys.myWork('org-b', 'user-a'));
    expect(issueKeys.myWork('org-a', 'user-a')).not.toEqual(issueKeys.myWork('org-a', 'user-b'));
  });

  it('isolates issue detail by organization', () => {
    expect(issueKeys.detail('org-a', 'AIPM-1')).not.toEqual(issueKeys.detail('org-b', 'AIPM-1'));
  });

  it('isolates paged project boards by server-side filters', () => {
    expect(issueKeys.projectInfiniteFiltered('project-a', { priority: 'HIGH' }))
      .not.toEqual(issueKeys.projectInfiniteFiltered('project-a', { priority: 'LOW' }));
    expect(issueKeys.projectInfiniteFiltered('project-a', { q: 'login' }))
      .not.toEqual(issueKeys.projectInfiniteFiltered('project-a', { q: 'telegram' }));
  });

  it('keeps project detail scoped by project id', () => {
    expect(projectKeys.detail('project-a')).not.toEqual(projectKeys.detail('project-b'));
  });

  it('isolates workspace-level notifications and agents by organization', () => {
    expect(notificationKeys.list('org-a')).not.toEqual(notificationKeys.list('org-b'));
    expect(notificationKeys.list('org-a', 'ALL')).not.toEqual(notificationKeys.list('org-a', 'ALERTS'));
    expect(notificationKeys.unread('org-a')).not.toEqual(notificationKeys.unread('org-b'));
    expect(agentKeys.list('org-a')).not.toEqual(agentKeys.list('org-b'));
    expect(agentKeys.actions('org-a')).not.toEqual(agentKeys.actions('org-b'));
  });
});
