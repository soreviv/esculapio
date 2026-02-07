# Palette Journal

## 2025-02-12 - CSS Layout Conflict in Buttons
**Learning:** The `hover-elevate` utility class (applied by default to Buttons in this repo) sets `position: relative`. This unexpectedly overrides `absolute` positioning because custom utilities in `@layer utilities` can take precedence over standard utilities depending on definition order.
**Action:** Use `!absolute` when positioning Buttons absolutely to force the positioning behavior.
