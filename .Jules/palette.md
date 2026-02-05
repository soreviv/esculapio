## 2026-02-05 - Icon-only buttons pattern
**Learning:** Icon-only buttons (like delete/schedule actions) are consistently missing `aria-label` and tooltips, making them inaccessible to screen readers and potentially confusing for all users.
**Action:** When creating or modifying components with icon-only buttons, always enforce: 1) `aria-label` for screen readers, 2) `Tooltip` for visual clarity.
