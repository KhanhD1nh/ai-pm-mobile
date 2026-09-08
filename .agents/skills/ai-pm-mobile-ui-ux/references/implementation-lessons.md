# AI-PM Mobile UI implementation lessons

Use this reference only when the current task touches one of these previously fragile areas.

## Product palette synchronization

- Treat `../ai-pm-frontend-v2/src/styles/global.css` as the semantic product palette reference.
- Map product semantics, not web CSS implementation. Mobile may keep native spacing, shape, blur, and elevation while sharing the same meaning for background, foreground, card, primary, borders, status, and priority colors.
- Re-check both light and dark themes after changing tokens because shared mobile primitives consume the centralized theme broadly.

## Navigation background continuity

- A `SafeAreaView` or screen background does not control every native transition layer.
- Keep Expo Router / React Navigation `ThemeProvider` colors synchronized with the active mobile theme so interactive back gestures and overscroll never reveal the default white navigation background.
- Test the actual iOS interactive gesture, not only static screenshots.

## Tab indicators

- Keep the tappable tab area comfortably wide, but place the visual indicator relative to the label/content wrapper.
- Avoid centering an underline by assigning `left: 50%` without a matching transform based on the same measured coordinate system.
- Prefer a label-width or deliberately constrained indicator that remains centered when labels have very different widths.

## BottomSheet lifecycle

- Separate `visible/closing` animation state from the parent selection state when necessary.
- A selection may request close immediately, but the native/modal container should unmount only after the exit animation finishes.
- Animate material height/layout changes with Reanimated layout or a controlled shared value; fading only the inserted calendar/content still produces a visible jump.
- Keep scrim fade and sheet translation/resize on a compatible cadence.

## Motion debugging from recordings

Classify the defect before tuning animation values:

1. **Unmount cut-off** — the component disappears before exit motion ends.
2. **Layout jump** — height or position changes instantly while opacity animates.
3. **Double animation** — parent and child animate the same property independently.
4. **Gesture mismatch** — motion continues on a preset curve instead of tracking the finger.
5. **Rerender flash** — data/state changes replace the moving subtree.

Fix the structural cause first. Only then tune duration, damping, stiffness, or easing.
