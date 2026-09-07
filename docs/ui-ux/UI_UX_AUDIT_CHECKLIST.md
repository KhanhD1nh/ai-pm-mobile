# AI-PM Mobile UI/UX Audit Checklist

Score each category from 0 to 2:

- 0 = broken, confusing, inaccessible, or visibly weak
- 1 = usable but inconsistent, generic, or incomplete
- 2 = deliberate and production-polished

Any category scored 0 blocks visual sign-off. A total below 80% means the screen still needs another pass.

## Product clarity

- The purpose of the screen is obvious within a few seconds.
- The primary action is obvious without scanning every control.
- Information is ordered by user value rather than API shape.
- Secondary information does not compete with primary content.

## Navigation

- Current location is clear.
- Back, Close, Dismiss, Push, Tab, and Sheet semantics are predictable.
- Top-level navigation is stable and uncluttered.
- Project-specific navigation does not feel copied from desktop.
- Icon-only controls have understandable symbols and accessibility labels.

## Layout

- Safe areas are correct.
- Keyboard appearance does not trap or cover important actions.
- Content does not collide with bottom navigation or the home indicator.
- Spacing follows a small, consistent rhythm.
- Density feels appropriate for a phone.
- The screen does not look like a desktop page scaled down.

## Typography

- Primary text is comfortable to read.
- Hierarchy is visible without excessive bold weights.
- Captions are used as metadata, not as the default content size.
- Long Vietnamese/English content wraps intentionally.
- Larger text does not make primary actions unreachable.

## Color and theme

- Light mode has clear hierarchy and sufficient contrast.
- Dark mode has clear hierarchy and sufficient contrast.
- Accent color is intentional and restrained.
- Status is not communicated by color alone.
- Borders, elevation, and fills explain structure rather than add noise.

## Components

- Repeated patterns are visually and behaviorally consistent.
- iOS important targets normally provide at least a 44 x 44 pt hit region.
- Android targets normally provide at least a 48 x 48 dp hit region.
- Pressed, selected, disabled, loading, and destructive states are distinct.
- Icon-only buttons are not ambiguous.
- Sheets, menus, segmented controls, rows, and floating actions use a consistent interaction model.

## Liquid Glass

- Glass is limited to meaningful functional layers.
- The underlying content remains the visual focus.
- Glass surfaces are not stacked into visual noise.
- Scrolling content remains legible beneath high-level glass.
- Unsupported platforms have a deliberate fallback.
- Reduce Transparency is considered.
- Parent opacity animation does not break native glass rendering.

## Motion

- Motion communicates continuity, state, or feedback.
- Gesture-driven elements follow the finger continuously.
- Tab revisits do not feel like a cold remount or a dead static swap.
- Network data does not pop in with large layout jumps.
- First-load placeholders match final geometry when used.
- Reduced-motion behavior is safe.
- Haptics reinforce meaningful interaction rather than every tap.

## Data states

- First load is deliberate.
- Background refresh preserves useful content where safe.
- Empty state is useful.
- Search/filter empty state is different from true empty state.
- Error state explains what happened and provides a next action.
- Offline/degraded state is handled when relevant.
- Disabled and permission-limited states are understandable.

## Accessibility

- Accessibility labels and roles are meaningful.
- Selected/disabled states are exposed semantically.
- Reading order is logical.
- Contrast is acceptable in both themes.
- Text scaling has been considered.
- Reduce Motion and Reduce Transparency are handled where custom UI depends on them.

## Perceived performance

- Navigation responds immediately.
- Cached content is preserved instead of blanked unnecessarily.
- There is no visible remount flash.
- There are no avoidable layout shifts.
- Expensive decoration does not delay primary content.

## Sign-off report template

Use this structure after a redesign:

### Score

`XX / YY (ZZ%)`

### Blocking issues

- issue
- impact
- concrete fix

### Improvements completed

- change
- why it improves the experience

### States visually checked

- happy path
- loading/refresh
- empty/error where relevant
- light/dark
- keyboard/safe area where relevant

### Remaining design debt

- item
- priority
