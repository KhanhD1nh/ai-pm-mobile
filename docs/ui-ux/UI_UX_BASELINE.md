# AI-PM Mobile UI/UX Baseline

This document is the project-wide design baseline for AI-PM mobile. It is intentionally opinionated. The current UI is not a visual specification; when the existing layout is weak, preserve product behavior and redesign the mobile composition.

## 1. Product principle

AI-PM mobile must feel like a native mobile work tool, not a compressed web dashboard.

Design for:

- short sessions
- one-handed use
- narrow widths
- keyboard and safe-area constraints
- unstable network conditions
- progressive disclosure
- fast scanning
- predictable platform behavior

Do not copy desktop information architecture directly to mobile.

## 2. Current stack

- Expo SDK 57
- React Native 0.86.x
- Expo Router 57
- React Native Reanimated 4
- React Native Gesture Handler
- `expo-glass-effect`
- TanStack Query
- project light/dark themes in `src/shared/components/ui/theme.ts`

Before using version-sensitive APIs, verify `package.json` and the Expo 57 documentation.

## 3. Existing shared UI surfaces

Prefer improving existing primitives rather than creating a second design system:

- `src/shared/components/ui/theme.ts`
- `src/shared/components/ui/glass.tsx`
- `src/shared/components/ui/mobile.tsx`
- `src/shared/components/ui/motion.tsx`
- `src/shared/components/ui/screen.tsx`
- `src/app/(tabs)/_layout.tsx` for top-level native tab navigation

If the same weakness appears on multiple screens, fix the shared primitive or token when safe.

## 4. Information hierarchy

Every screen must answer these questions quickly:

1. Where am I?
2. What is the most important information here?
3. What can I do next?
4. What changed?

Use hierarchy before decoration:

- title and current context
- primary information/action
- secondary content
- metadata
- low-frequency actions

Avoid giving every section the same visual weight.

## 5. Mobile composition

Prefer:

- summary first, details on demand
- list/group structures for repeated work items
- bottom sheets for contextual choices and short tasks
- push navigation for deeper hierarchy
- segmented controls only for a small set of closely related modes
- menus for infrequent actions
- sticky/floating actions only when the action genuinely benefits from persistent access

Avoid:

- desktop sidebars converted into horizontal rows
- multiple toolbars on one phone screen
- giant dashboard grids
- excessive chips/pills
- card-inside-card layouts
- dense filter bars copied from web

## 6. Typography

Use typography for hierarchy, not for squeezing more content onto screen.

Guidance:

- primary body text should usually feel equivalent to roughly 15-17 pt on phone layouts
- important labels should not be reduced to tiny metadata sizes to fit desktop density
- captions should remain legible and should not become the default text style
- use a small number of size/weight combinations
- use spacing and color to support hierarchy instead of making everything bold
- test long Vietnamese and English labels
- keep text scaling enabled unless a specific control cannot safely support it

The project currently has some dense sizes, including 14 pt body and 11 pt segmented text. Treat these as values to review, not untouchable constants.

## 7. Spacing

Use the shared spacing scale in `theme.ts` as the default rhythm.

Principles:

- tighter spacing inside a semantic group
- larger spacing between unrelated groups
- align repeated rows and baselines consistently
- avoid arbitrary one-off margins to compensate for weak structure
- do not remove whitespace merely to fit more desktop information

## 8. Touch targets

Minimum practical targets:

- iOS: important interactive hit regions should normally be at least 44 x 44 pt
- Android: interactive targets should normally be at least 48 x 48 dp

The visible icon can be smaller than the hit region.

Icon-only controls must include meaningful accessibility labels. Custom controls must have visible pressed feedback.

Review existing compact controls carefully: a visually small control is acceptable only if its actual hit area remains comfortable and non-overlapping.

## 9. Navigation

Global bottom navigation is for stable top-level destinations, not a mixed destination/action toolbar.

Rules:

- keep destination count small
- preserve location and history
- use predictable Back / Close / Dismiss semantics
- avoid unexpected project auto-selection
- do not change tab meaning based on transient state
- icon-only navigation is acceptable only when symbols are unambiguous and accessibility labels remain present

For project-specific subareas, prefer a clear hierarchy instead of duplicating desktop nested navigation.

### Shared header controls

- Use `HeaderBackButton` from `src/shared/components/ui/mobile.tsx` for Back and `kind="close"` for modal/sheet dismissal. Pass the existing navigation or local dismiss callback; the control does not own route decisions.
- Use `GlassIconButton` for companion header actions. All use `theme.header` metrics: circular 44 pt controls on iOS (48 dp on Android), 22 pt icons and a shared horizontal inset.
- Keep the top header canvas flat. Native glass belongs to the individual control, not a full-width header background.
- Never wrap these controls in `SoftFade`, `FadeInView`, or a fading pressable. Press feedback may fade the symbol inside glass, never the material or its ancestors. A sheet's fading scrim must be a sibling of its sliding content.
- Do not add app-defined tint/opacity to header glass. Leave material appearance to native glass; synchronize the color scheme with the app's theme preference.

## 10. Liquid Glass

Liquid Glass is a functional material layer, not the product's visual identity.

On iOS 26+:

- use native/Expo glass for navigation, toolbars, compact controls, important floating controls, and selected modal surfaces where appropriate
- keep underlying content visually primary
- avoid glass on every card
- avoid overlapping/stacked translucent surfaces
- reduce custom backgrounds that fight native glass
- let content scroll under high-level glass only when legibility remains strong
- use grouped native glass containers when multiple glass elements should morph/interact together

Implementation rules:

- keep runtime availability checks
- keep non-glass fallbacks
- do not animate opacity on a parent containing native `GlassView`
- account for Reduce Transparency
- do not switch to a third-party glass library merely to make the effect stronger

## 11. Color and theme

- use semantic theme tokens
- accent color communicates selection, priority, or primary action; it is not decorative confetti
- never rely on color alone for status
- verify contrast in light and dark
- dark mode should use deliberate surfaces and elevation, not simple color inversion
- avoid too many borders, shadows, and accent-filled containers on the same screen

## 12. Shape and elevation

Rounded corners must communicate component role and hierarchy.

Avoid:

- making every surface a pill
- giving ordinary content floating shadows
- nesting multiple rounded cards with slightly different radii

Use elevation mainly for real layers: navigation, sheets, floating actions, menus, and temporary overlays.

## 13. Motion

Motion exists to explain:

- continuity
- hierarchy
- direct manipulation
- feedback
- state change

Motion rules:

- keep transitions short and interruptible
- gestures must track the finger
- avoid large decorative translation or scale on every screen entry
- revisiting a cached tab should preserve continuity instead of looking like a cold remount
- do not blank useful data while refreshing
- avoid layout jumps when async data resolves
- use stable skeleton geometry where first-load placeholders are valuable
- Reduce Motion should remove or simplify nonessential translation, zoom, spring bounce, and depth effects

## 14. Haptics

Use haptics for meaningful moments:

- selection change
- mode change
- drag threshold / destination change
- confirmation
- destructive action acknowledgement when appropriate

Do not add haptics to every ordinary tap.

## 15. Data states

Every screen change must review:

- first load
- background refresh
- empty state
- search/filter empty state
- partial data
- error and retry
- offline/degraded state when relevant
- disabled/permission-limited state
- destructive confirmation
- keyboard open/closed
- long text/localization
- light/dark theme

A finished happy path with unfinished edge states is not complete.

## 16. Perceived performance

Prefer a stable screen frame that fills progressively over a blank shell that suddenly becomes populated.

- preserve cached data during background refresh where safe
- do not replay expensive mount animations unnecessarily
- avoid layout shifts when images or API data appear
- keep navigation response immediate
- defer low-priority visual work behind the primary interaction

## 17. Accessibility

At minimum verify:

- meaningful accessibility labels and roles
- selected/disabled state semantics
- VoiceOver/TalkBack reading order for custom layouts
- usable touch targets
- contrast in both themes
- larger text behavior
- Reduce Motion
- Reduce Transparency for custom glass behavior

## 18. Anti-slop rules

Reject these defaults unless there is a concrete product reason:

- generic mobile dashboard grids
- glass everywhere
- excessive pills
- decorative gradients
- oversized empty hero headers
- tiny metadata everywhere
- equal-weight cards for all information
- ambiguous icon-only buttons
- animation on every mount with no continuity purpose
- skeletons that do not match final geometry
- loading spinners centered in otherwise empty screens when a stable layout can be shown

## 19. Visual verification

For meaningful UI changes, visual verification is part of implementation.

When device/simulator tooling is available:

1. capture the current screen
2. inspect hierarchy and interaction problems
3. implement
4. capture the same state again
5. inspect light/dark and at least one non-happy state when relevant
6. fix visible issues before declaring completion

Do not rely on source code alone to judge polish.
