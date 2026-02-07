## 2026-02-06 - Accessible Icon Buttons
**Learning:** Icon-only buttons (like calendar/trash icons) often lack ARIA labels, making them invisible to screen readers. Adding `Tooltip` triggers is not enough for accessibility; explicit `aria-label` is required on the button itself.
**Action:** Always pair `Tooltip` with `aria-label` on the trigger button for icon-only actions.
## 2026-02-05 - Icon-only buttons pattern
**Learning:** Icon-only buttons (like delete/schedule actions) are consistently missing `aria-label` and tooltips, making them inaccessible to screen readers and potentially confusing for all users.
**Action:** When creating or modifying components with icon-only buttons, always enforce: 1) `aria-label` for screen readers, 2) `Tooltip` for visual clarity.
