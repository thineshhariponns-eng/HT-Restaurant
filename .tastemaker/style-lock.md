# Style lock: Admin (Razor area) "Mist Glass"

Reference: weather-app UI (storm slate-teal, frosted glass, floating rounded frame). Palette pulled by pixel extraction
(extract_palette.py): #263431 / #657c77 / #7b9592, warm horizon glow mapped to brand turmeric.

- Scope: `Areas/Admin` only, via `wwwroot/css/admin.css` + `body.admin`. Storefront uses customer.css / landing.css. Account (login), Team and Platform untouched.
- Type: Manrope 300-800 (light large numerals, 600 for controls).
- Color: bg #121b19 gradient mist; glass rgba(255,255,255,.07/.12); text #eef4f2; body #bccbc7; muted #8fa39f; accent #f0c36a; on-primary #0f1a18; danger #f5a487.
- Contrast (check_contrast.py --matrix): text/bg 14.0, body/bg 9.3, muted/bg 5.9, accent/bg 9.5, on-primary/primary 16.0, on-primary/danger 8.9. All text-safe.
- Shape: 24px panels, 999px pills, 32px frame. Motion: none beyond hover/press (admin is high-frequency).
- Rule: design only. No markup/functionality/image changes.
