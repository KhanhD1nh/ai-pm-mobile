---
name: ai-pm-mobile-ui-ux
description: Project-specific mobile UI/UX design, audit, implementation, and visual-polish workflow for the AI-PM Expo React Native app. Use for any AI-PM mobile task that creates, redesigns, reviews, or changes screens, navigation, typography, spacing, colors, dark mode, Liquid Glass, loading/empty/error states, motion, gestures, haptics, accessibility, or perceived performance on iOS or Android.
---

# AI-PM Mobile UI/UX

Design AI-PM as a native mobile product, not a compressed copy of the web app. Treat interaction design, hierarchy, platform fit, accessibility, motion, and perceived performance as first-class requirements.

## Operating loop

1. Read project context before changing UI:
   - `AGENTS.md`
   - `docs/architecture/README.md` when code structure is involved
   - `docs/ui-ux/UI_UX_BASELINE.md`
   - `src/shared/components/ui/theme.ts`
   - relevant shared UI primitives and the target screen
2. Inspect the current implementation before proposing a replacement. Identify the user goal, primary action, navigation context, state model, and current failure modes.
3. For platform-sensitive behavior, verify current official documentation before coding. Prefer Apple HIG / Apple Developer, Expo SDK 57 docs, React Native docs, and Android Developers over blogs.
4. Write a compact design contract before implementation:
   - user goal
   - primary and secondary actions
   - information hierarchy
   - screen anatomy
   - navigation semantics
   - loading / refreshing / empty / error / offline / disabled states
   - gesture and haptic behavior
   - light / dark behavior
   - iOS / Android differences
5. Implement with existing project primitives and tokens. Improve shared primitives when several screens have the same flaw; do not create a parallel design system.
6. Run visual QA on a real device or simulator whenever available. Compare screenshots, inspect safe areas, keyboard behavior, scrolling, content density, contrast, clipping, touch targets, and transition continuity.
7. Iterate until the screen feels intentional at first glance and remains usable under edge states.
8. Run project verification required by `AGENTS.md`.

## Non-negotiable design doctrine

- Mobile is not small desktop. Re-compose information and actions for thumb use, short attention, variable connectivity, and narrow width.
- Preserve product meaning, not web layout. A mobile redesign may change grouping, order, disclosure, density, navigation, and interaction while keeping business behavior intact.
- One screen needs a clear focal hierarchy. Avoid making every section a same-weight rounded card.
- Prefer progressive disclosure over showing every control at once.
- Keep the primary action obvious. Secondary actions should visually recede or move into menus/sheets when appropriate.
- Use semantic project tokens. Do not scatter one-off colors, radii, shadows, font sizes, or spacing values without a concrete reason.
- Prefer platform-native conventions when they improve predictability. Do not force iOS visuals onto Android or vice versa.

## Liquid Glass rules

On iOS 26+, treat Liquid Glass as a functional top layer for navigation and important controls, not as a decorative card style.

- Prefer native system / Expo glass behavior over fake blur stacks.
- Use glass sparingly for floating navigation, compact controls, toolbars, sheets, and other high-level interactive surfaces.
- Keep content surfaces mostly content-first and opaque enough for legibility.
- Avoid stacking multiple glass surfaces where they visually compete or overlap.
- Do not animate parent opacity around native glass. Use supported glass animation behavior or animate content separately.
- Keep a deliberate non-glass fallback for unsupported platforms and accessibility settings.
- Respect Reduce Transparency and Reduce Motion where custom behavior is used.

## Navigation and interaction

- Use bottom navigation only for top-level destinations. Do not use it as an action toolbar.
- Keep the global destination count small and stable. Never move destinations unpredictably based on transient state.
- Icon-only buttons require an accessibility label and a universally understandable symbol.
- iOS interactive hit regions should normally be at least 44 x 44 pt. Android targets should normally be at least 48 x 48 dp.
- Every custom button needs visible pressed feedback. Add haptics only when they reinforce selection, confirmation, mode changes, or direct manipulation.
- Back, close, dismiss, sheet, push, replace, and tab navigation must preserve user expectations and history.
- Long-press and drag interactions must follow the finger continuously, provide immediate feedback, and have a clear release/cancel behavior.

## Typography and density

- Optimize for scanning first. Use short titles, clear section labels, and restrained metadata.
- Default body copy should be comfortably readable on a phone; do not use tiny text to fit more web content.
- Avoid excessive weight changes. Hierarchy should come from size, spacing, color, and grouping as well as weight.
- Keep truncation intentional. Critical state, assignee, due date, priority, or destructive consequences must not disappear silently.
- Support text scaling where practical and verify that enlarged text does not make core actions unreachable.

## Color, elevation, and shape

- Use accent color to express selection, emphasis, or a primary action, not to decorate every control.
- Maintain sufficient contrast in both themes. Never use color alone to communicate status.
- Use elevation only to explain layering. Floating controls can float; ordinary content should not all look detached from the canvas.
- Keep corner radii consistent with component role and nesting. Avoid arbitrary pill shapes everywhere.
- Dark mode is a separate visual composition, not a mechanically inverted palette.
- Treat the web app semantic palette as the product color source of truth. Before changing AI-PM Mobile colors, inspect `../ai-pm-frontend-v2/src/styles/global.css` and map web tokens such as background, foreground, card, primary, border, priority, and workflow status into mobile semantic tokens. Keep mobile layout, radii, elevation, and native interaction treatment platform-appropriate instead of copying web component styling.
- Do not introduce a second brand palette for mobile unless the product explicitly calls for one. Shared product meaning should use the same semantic colors across web and mobile.

## Native chrome and container continuity

- When changing app background, theme, or navigation chrome, keep the Expo Router / React Navigation theme synchronized with the mobile theme. Root navigation `background`, `card`, `border`, `text`, `primary`, and notification colors must not fall back to the default navigation palette.
- Verify iOS interactive back gestures, overscroll, modal dismissal, and tab transitions after theme changes. A screen-level background is not sufficient if the native navigation container can still reveal white or another default color behind it.
- Anchor tab selection indicators to the label/content wrapper or another deterministic measured element. Do not center a fixed-width underline with fragile absolute-position hacks such as `left: 50%` when the containing width differs from the visible label.

## Motion and perceived performance

- Motion must explain continuity, hierarchy, direct manipulation, or feedback. Remove decorative motion that delays work.
- Prefer short, interruption-safe transitions. Gesture-driven motion should track the gesture.
- Avoid full-screen re-entry animations when revisiting cached tabs. Preserve continuity and animate only the changing layer.
- First-load data should not pop from a blank shell into a fully rendered screen. Use stable layout, skeletons/placeholders, or staged content when useful.
- Avoid layout jumps when network data resolves.
- Refreshing existing data should generally preserve useful stale content rather than blank the screen.
- Respect Reduce Motion by replacing large translation/scale effects with simpler fades or immediate state changes.
- Keep dismissing surfaces mounted until their exit transition completes. Selecting an item in a BottomSheet or Modal must not immediately unmount the container and cut off the closing animation.
- Animate layout changes that materially change a sheet's height or content position. Calendar expansion, optional sections, and dynamic sheet content should not snap between heights while only fading child content.
- Synchronize scrim, sheet, content, and chevron/icon state changes so a single interaction does not feel like several unrelated animations.
- When a screen recording is available, use it as primary evidence for motion bugs. Inspect the transition frame-by-frame and distinguish mount/unmount discontinuity, layout jumps, opacity/transform timing, gesture tracking, and data-driven rerenders before changing duration or spring constants.

## State completeness

For any changed screen, explicitly review:

- first load
- background refresh
- empty
- search/filter empty
- partial data
- error and retry
- offline/degraded connectivity when relevant
- disabled / permission-limited state
- destructive confirmation
- keyboard open / close
- long text / localization
- light / dark theme

A polished happy path with broken edge states is not finished.

## Visual QA gate

Do not declare a meaningful UI redesign complete from code inspection alone when visual tooling is available.

Check at minimum:

1. First impression: hierarchy and focal point are obvious within a few seconds.
2. Safe areas: no collision with Dynamic Island, status bar, home indicator, keyboard, or bottom navigation.
3. Tapability: important controls are comfortably reachable and have adequate hit regions.
4. Typography: no accidental tiny text, clipping, awkward wrapping, or inconsistent baselines.
5. Spacing: repeated structures use a consistent rhythm; unrelated content is not visually glued together.
6. States: loading, empty, error, active, pressed, disabled, selected, and modal states look deliberate.
7. Motion: no flicker, remount flash, jarring data pop, double animation, or animation that fights a gesture.
8. Themes: both light and dark have deliberate contrast and elevation.
9. Platform fit: iOS and Android do not look like skins of each other when platform conventions differ.

## Output expectations

For an audit, report:

- highest-impact UX problems first
- evidence from the current implementation / screenshot
- why each issue harms usability or polish
- the concrete fix
- whether the fix belongs in a shared primitive or one screen

For implementation, finish with:

- files changed
- UX behavior changed
- states verified
- visual verification performed
- engineering verification result
- any remaining design debt

## References

- Read `docs/ui-ux/UI_UX_BASELINE.md` for project-wide design constraints.
- Read `docs/ui-ux/UI_UX_AUDIT_CHECKLIST.md` when auditing or signing off a screen.
- Read `docs/ui-ux/RESEARCH_SOURCES.md` when current platform guidance needs verification.
- Use `docs/ui-ux/UI_UX_AGENT_PROMPT.md` as the reusable master prompt for larger redesigns.
- Read `references/implementation-lessons.md` when working on theme synchronization, navigation background, tabs, BottomSheets, or motion regressions that resemble previously fixed AI-PM Mobile bugs.
