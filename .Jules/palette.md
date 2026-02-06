## 2026-02-06 - Accessible Icon Buttons
**Learning:** Icon-only buttons (like calendar/trash icons) often lack ARIA labels, making them invisible to screen readers. Adding `Tooltip` triggers is not enough for accessibility; explicit `aria-label` is required on the button itself.
**Action:** Always pair `Tooltip` with `aria-label` on the trigger button for icon-only actions.
