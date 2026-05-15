## 2025-05-15 - [Accessibility for Icon Buttons]
**Learning:** Icon-only buttons without labels are invisible to screen readers and can be ambiguous for users. Coupling `Tooltip` with a descriptive `aria-label` provides both visual and non-visual clarity.
**Action:** Always use the combination of `Tooltip` and `aria-label` for any `IconButton` or icon-only interactive element.

## 2025-05-15 - [Dynamic Tooltips for Toggle Buttons]
**Learning:** For buttons that toggle state (like password visibility), the `aria-label` and `Tooltip` title must be reactive to ensure they always describe the *next* or *current* action accurately.
**Action:** Use ternary operators or state-dependent strings for labels and tooltips on toggle components.
