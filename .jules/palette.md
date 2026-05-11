## 2025-05-15 - Accessibility for icon-only buttons
**Learning:** Screen readers often miss the intent of icon-only buttons if they lack `aria-label`, even if a `Tooltip` is present. `Tooltip` provides visual context for mouse users, but `aria-label` is essential for programmatic accessibility.
**Action:** Always pair `Tooltip` with a matching `aria-label` on `IconButton` components to satisfy both visual and screen-reader users.
