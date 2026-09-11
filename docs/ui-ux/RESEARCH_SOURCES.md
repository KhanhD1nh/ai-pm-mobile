# UI/UX Research Sources

Last reviewed: 2026-09-11.

Use these sources to verify platform-sensitive UI/UX behavior. Prefer official documentation over community posts.

## Apple

- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Adopting Liquid Glass: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- Liquid Glass overview: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Buttons: https://developer.apple.com/design/human-interface-guidelines/buttons
- Toolbars/navigation: https://developer.apple.com/design/human-interface-guidelines/toolbars

Current guidance relevant to this project:

- Liquid Glass is intended as a distinct functional layer for navigation and controls.
- Apple recommends reducing custom backgrounds that interfere with system navigation/control materials.
- Avoid overusing custom Liquid Glass effects.
- Test custom UI with Reduce Transparency and Reduce Motion.
- Standard iOS button hit regions should generally be comfortable around 44 x 44 pt.
- Motion should support feedback and continuity rather than exist as decoration.

## Expo SDK 57

- Versioned root: https://docs.expo.dev/versions/v57.0.0/
- Glass Effect: https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/
- Expo Router Stack: https://docs.expo.dev/router/advanced/stack/

Relevant implementation notes:

- `GlassView` is a native Liquid Glass surface on supported iOS versions and falls back elsewhere.
- Check runtime API availability before assuming native glass is usable.
- Native glass has caveats around opacity animation; do not fade a parent containing a glass view as if it were a normal View.
- iOS 26 navigation headers can adopt Liquid Glass through native navigation behavior.

## React Native

- Accessibility: https://reactnative.dev/docs/accessibility
- View and `hitSlop`: https://reactnative.dev/docs/view

Relevant implementation notes:

- Touchable elements are exposed to platform accessibility systems, but custom layouts still need meaningful labels/roles/states.
- `hitSlop` can enlarge the touch region without enlarging the visible icon, subject to parent bounds and sibling precedence.

## Android

- Accessibility guidance: https://developer.android.com/guide/topics/ui/accessibility/apps
- Compose accessibility API defaults: https://developer.android.com/develop/ui/compose/accessibility/api-defaults
- Material 3 design system: https://developer.android.com/develop/ui/compose/designsystems/material3
- Navigation bar: https://developer.android.com/develop/ui/compose/components/navigation-bar
- Short navigation bar item: https://developer.android.com/reference/kotlin/androidx/compose/material3/ShortNavigationBarItem
- NavigationBarView label visibility: https://developer.android.com/reference/com/google/android/material/navigation/NavigationBarView
- Material 3 navigation bar tokens: https://android.googlesource.com/platform/frameworks/support/+/15ccca2bd51eab204fbee3c140a3076621e8ea61/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/NavigationBarTokens.kt
- Snackbar: https://developer.android.com/develop/ui/compose/components/snackbar
- Edge-to-edge views: https://developer.android.com/develop/ui/views/layout/edge-to-edge
- Window insets: https://developer.android.com/develop/ui/compose/system/insets

Relevant design baseline:

- interactive targets should generally provide at least 48 x 48 dp of focus/touch area
- labels/content descriptions matter for non-text interactive elements
- Material 3 favors tonal/surface hierarchy over decorative shadow-heavy cards
- use the platform navigation bar pattern for a small stable set of top-level destinations
- on phone portrait, Material 3 ShortNavigationBar uses top-positioned icons with text labels; selected/unselected items keep the same geometry rather than moving vertically
- current Material 3 short-navigation geometry uses a 64 dp bar, 24 dp icon, and a 56 x 32 dp pill-shaped selected indicator; keep these dimensions fixed for both states
- avoid Android `LABEL_VISIBILITY_AUTO` for AI-PM's primary bar because 4+ destinations switch to selected-only label behavior, which can visibly reposition the selected item
- brief operation feedback such as save success should prefer a snackbar instead of blocking the user with a dialog
- reserve dialogs for decisions that require explicit confirmation, especially destructive or high-impact actions
- Android 15+ enforces edge-to-edge for apps targeting API 35+, so system-bar insets must be handled deliberately
- Android navigation/actions should use native press feedback such as ripple where the control shape allows it

### AI-PM Android adaptation

- Keep the product's list-first information architecture shared with iOS.
- Keep Liquid Glass as the iOS-specific navigation/control treatment; do not imitate glass with white circular surfaces on Android.
- Use Material-style icon buttons, ripple feedback, tonal grouped surfaces, and Android back-arrow semantics on Android.
- Keep Android stack titles left-aligned beside Back; retain centered iOS stack titles where appropriate.
- On Android, use four stable destinations (Home, Projects, Inbox, Settings) plus a centered Create FAB; show labels for the four destinations and keep selected/unselected item geometry identical so selecting a tab never shifts it vertically.

## Community agent skills reviewed

Community skills are useful for workflow patterns, not for deciding platform truth.

- https://github.com/RubenGlez/mobile-design
- https://github.com/mdrmuhaimin/agentic-skills/tree/main/codex/mobile-ui-ux-designer
- https://github.com/Appllama/appllama-skills/tree/main/skills/appllama-app-design-skill
- https://github.com/ulugbekeshnazarov409/reactnative-design

Recurring patterns worth keeping:

- inspect the project before writing UI code
- design flows and states, not isolated screenshots
- include accessibility, motion, dark mode, and touch targets by default
- respect iOS and Android differences
- use project tokens and existing primitives
- visually verify before sign-off
- treat generic AI-looking UI as a failure mode
