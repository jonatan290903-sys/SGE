## 2025-03-05 - Dynamic Labels for State-Dependent Buttons
**Learning:** For interactive elements that toggle states (like password visibility), static ARIA labels or tooltips are insufficient. Screen readers and users benefit from labels that explicitly describe the *current* action or state change (e.g., "Mostrar" vs "Ocultar").
**Action:** Always pair state-dependent `IconButton` components with a dynamic `Tooltip` and `aria-label` that updates based on the component's internal state.
