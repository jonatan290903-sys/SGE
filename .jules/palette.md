## 2025-03-03 - [Accessibility of Password Toggles]
**Learning:** Icon-only buttons for password visibility lack descriptive context for screen readers. Using dynamic `aria-label` attributes like "Mostrar contraseña" and "Ocultar contraseña" ensures that visually impaired users understand the button's purpose and state.
**Action:** Always include state-aware `aria-label` on password visibility toggles and ensure all password fields (including confirmations) have them for consistency.
