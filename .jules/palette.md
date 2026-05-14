## 2025-05-14 - [Aria labels for icon-only buttons]
**Learning:** Icon-only buttons in this app (like the mobile menu, notifications, and logout) often lacked descriptive `aria-label` attributes and tooltips, making them inaccessible to screen readers and less intuitive for some users.
**Action:** Always pair `IconButton` components with a `Tooltip` and a matching `aria-label` attribute. For dynamic buttons (like show/hide password), ensure the `aria-label` updates with the state.
