# Palette Journal - Critical UX/Accessibility Learnings

## 2025-05-17 - [Accessibility Standard: Icon-only buttons]
**Learning:** For full screen-reader and visual accessibility, icon-only buttons must always pair a `Tooltip` component with a matching, highly descriptive `aria-label` attribute.
**Action:** Always wrap `IconButton` in a `Tooltip` and provide a descriptive `aria-label` that matches the tooltip title.

## 2025-05-17 - [State-dependent tooltips]
**Learning:** When adding tooltips to state-dependent buttons (e.g., password visibility toggles), ensure both the `Tooltip` title and the `aria-label` update dynamically to accurately reflect the current state (e.g., switching between 'Mostrar' and 'Ocultar').
**Action:** Use ternary operators to dynamically set `title` and `aria-label` based on the component's state.
