# UI/UX Research Sources

Last reviewed: 2026-09-07.

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

Relevant design baseline:

- interactive targets should generally provide at least 48 x 48 dp of focus/touch area
- labels/content descriptions matter for non-text interactive elements

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
