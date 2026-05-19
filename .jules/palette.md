# Palette Journal

## 2026-05-19 - [Notification Parity & Accessibility]
**Learning:** Desktop sidebars often miss dynamic status indicators (like badges) that are present in mobile headers. Icon-only buttons must ALWAYS have a Tooltip + aria-label pair.
**Action:** When adding or updating action buttons in Layout.tsx, ensure the same features (badges, tooltips) are present across all viewport-specific versions of the UI.
