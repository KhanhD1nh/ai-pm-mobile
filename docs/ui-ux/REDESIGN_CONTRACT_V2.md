# AI-PM Mobile Redesign Contract v2

Last updated: 2026-09-07

## Research synthesis

The previous pass improved polish but preserved too much dashboard and web information architecture. The new direction is list-first, task-first, and designed for short mobile sessions.

Primary references reviewed:

- Apple Human Interface Guidelines — lists/tables, toolbars, tab views, Liquid Glass
- Expo SDK 57 — `expo-glass-effect`
- Linear Mobile redesign and mobile positioning
- Things 3 Today interaction model
- Todoist mobile navigation customization

## Core product model

AI-PM mobile is an away-from-keyboard companion. It should help a user answer, in order:

1. What needs my attention now?
2. What can I update quickly?
3. What changed while I was away?
4. Where do I drill deeper if needed?

It is not a mobile clone of the desktop project-management surface.

## Visual direction

Calm, dense enough for work, but visually flat and content-led.

- Use the canvas as the default surface.
- Prefer text rows and separators over cards.
- Use grouped surfaces only for settings/options where grouping itself carries meaning.
- Use Liquid Glass only for top-level navigation and compact transient controls.
- Use one clear accent color and neutral status colors.
- Avoid stacked rounded rectangles, KPI tiles, pill-heavy metadata, and decorative shadows.

## Global navigation

- Keep four stable destinations plus Create.
- Keep icon-only navigation with accessibility labels.
- Do not add duplicate create buttons to every screen when the global Create action is already persistent.
- Navigation remains a floating functional layer; content stays visually dominant.

## Home

User goal: decide what to do next within a few seconds.

Hierarchy:

1. Greeting/date
2. Priority work that needs action
3. Remaining work for today
4. Recent projects

Remove from the Home composition:

- KPI grids
- unread/overdue summary widgets that duplicate information already visible elsewhere
- card-style project summaries

## Projects

User goal: enter a project quickly.

- Use an editorial list.
- Project name is primary; key/status/count is metadata.
- Avoid card borders and large avatar blocks.

## Project workspace

User goal: orient, switch between core project areas, then act.

Header:

- Back
- Project name/key
- overflow/search only when necessary

Primary tabs:

- Overview
- Tasks
- Schedule

Use plain content tabs, not a pill container.

Overview hierarchy:

1. Project progress/health
2. Needs attention
3. Secondary project destinations

Do not use metric-card grids.

## Project Tasks

The mobile default is a vertical issue list grouped by status.

- Do not use horizontally scrolling Kanban lanes as the primary mobile representation.
- Search and filters are compact controls.
- Status headings show count.
- Issue rows are text-led with state, identifier, assignee/due metadata.
- Empty status groups can collapse or show a single lightweight add action.

## Issue detail

User goal: read, understand, and change the issue with minimal navigation.

Hierarchy:

1. Identifier + title
2. Description
3. Primary properties: status, assignee, priority, due
4. Activity/comments
5. Secondary properties/actions

Use plain property rows and progressive disclosure. Do not lead with a settings-style property box.

## Inbox

- Use three high-value views: All, Unread, Mentions.
- Extra filters go to a sheet.
- Use flat notification rows with unread emphasis, not card treatment.

## More

- Behave like a native settings/index screen.
- Compact profile identity at top.
- Rows grouped by Account, Workspace, Administration, App.
- Theme/language are rows that open choices instead of persistent segmented-control blocks on the index page.

## Motion

- No full-screen re-entry animation on cached tabs.
- Use pressed-state feedback and direct-manipulation motion only.
- Preserve content during background refresh.

## Verification gate

A changed screen is not complete until visually checked on the connected iPhone in light and dark modes, and the repository passes architecture, typecheck, lint, expo-doctor, and platform exports.