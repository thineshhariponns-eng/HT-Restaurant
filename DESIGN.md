# Design System

HT Omnifield ships two front-ends that share one design language ("Daily Card"):
ink ground, parchment type, turmeric as the single signal colour, hairline rules,
square corners, tabular figures.

- **Angular app** (`src/`, customer + admin + developer portals) — tokens in `src/styles.css` via Tailwind 4 `@theme`.
- **MVC app** (`src/TeamOmnifield.Web`, legacy storefront + areas) — the same tokens as CSS custom properties in `wwwroot/css/site.css`, re-pointed per surface by `customer.css`, `admin.css`, `portal.css`.

Both files define the **same hex values**; treat them as one token set with two
definitions. When changing a token, change both.

## Palette

| Token | Value | Use |
|---|---|---|
| `--color-primary-600` | `#e8b33c` | Turmeric — the only signal colour: primary actions, focus rings, key accents |
| `--color-primary-700` | `#f2c568` | Primary hover |
| `--color-primary-100` | `#2a2113` | Turmeric wash for selected/active backgrounds |
| `--color-bg-base` | `#14110d` | Ink page ground |
| `--color-bg-surface` | `#1f1b15` | Cards, raised panels |
| `--color-bg-sunken` | `#0f0d0a` | Wells, photo placeholders |
| `--color-text-primary` | `#f0eadc` | Headings, key values |
| `--color-text-body` | `#c9bea8` | Body copy |
| `--color-text-muted` | `#9a8f7e` | Meta, captions (AA on both grounds) |
| `--color-text-inverse` | `#14110d` | Text on turmeric |
| `--color-border-subtle` | `#2a251c` | Hairline rules |
| `--color-border-strong` | `#3a342a` | Secondary button/input-group borders |
| `--color-border-input` | `#756b5c` | Form-control stroke (≥3:1 on ink) |
| `--color-error` / `--color-error-100` / `--color-error-text` | `#c4552f` / `#2a1912` / `#e0764f` | Errors (text lifted to 5.5:1) |
| `--color-status-*` | pending `#e8b33c`, confirmed `#3e6fa6`, delivery `#8a5cb0`, delivered `#4e9a5f`, cancelled `#c4552f` | Order/pipeline status only — never decoration |

`--color-accent-*` mirrors `--color-primary-*` (legacy name). spartan-ng/shadcn
semantic tokens (`--color-background`, `--color-card`, `--color-ring`, …) map onto
the palette in the `@theme inline` block of `src/styles.css`.

**Rule:** no raw hex in templates or components. If a colour is not a token, add
the token to both token files first.

## Typography

- Fonts: `--font-display: 'Archivo Expanded'` (headings), `--font-sans: 'Archivo'` (everything else).
- Angular type scale (Tailwind steps): `text-xs` meta/labels → `text-sm` UI/body-dense → `text-base` body → `text-lg`/`text-xl` section heads → `text-2xl`–`text-4xl` page/display heads.
- MVC rem scale mirrors it: `.6875–.75rem` caps labels, `.8125–.875rem` UI, `.9375–1rem` body, `1.125–1.5rem` heads, `clamp()` displays.
- Uppercase meta labels: `label-caps` utility (Angular) / letter-spaced `.75rem` caps (MVC).
- Numbers that compare (prices, counts, times): `tabular-nums`.
- The portal landing (`portal.css`, "Jharokha") adds Fraunces for display; the MVC admin (`admin.css`, "Mist Glass") uses Manrope. Do not leak these into other surfaces.

## Spacing

- Angular: Tailwind 4px scale (`p-1` = 4px … `p-24` = 96px). Page gutters `px-4 sm:px-6 lg:px-8`; section rhythm `py-10`–`py-24`.
- MVC: the same 4/8px grid in px (8, 12, 16, 20, 24, 32, 40, 48, 96).

## Corner radii

The base system is square: `--radius-sm: 2px`, `--radius-lg: 4px`; most controls
are `border-radius: 0`. Circles/pills (`50%`, `999px`) are reserved for status
dots and count badges.

Deliberate themed exceptions — do not "fix" these into the base scale:

| Surface | File | Radii |
|---|---|---|
| Auth card (login) | `site.css` `.auth-*` | card 20px, inputs/submit 10px |
| MVC admin "Mist Glass" | `admin.css` | `--mg-radius: 24px`, thumbs/alerts 14–16px |
| Portal landing "Jharokha" | `portal.css` | 16–36px arched panels |

## Theming (dark ↔ light)

- The Angular app and the MVC base theme are always-on-ink (dark).
- `customer.css` ("Open Kitchen") flips the same tokens to paper under `body.customer`, and flips them back to ink inside `.band-strong`, `.summary-panel`, `.site-header`, `.site-footer`. New components must read tokens, never hard-coded colours, so both flips keep working.
- Verified AA contrast (measured): muted on ink 5.9:1, muted on paper 5.7:1, body 10–11:1, primary text on ink 9.8:1, ink on turmeric 10.1:1, error text 5.5:1.

## Components

- **Buttons.** MVC: `.btn` + variant (`btn-primary` solid turmeric, `btn-secondary` hairline outline, `btn-ghost` borderless, `btn-danger` rust outline, `btn-cancel` customer-theme rust) + size (`btn-sm`, `btn-block`). Angular: `hlmBtn` (`primary`/`outline`/`ghost`/`destructive`, sizes `xs`–`lg`, `icon*`) for portals; customer marketing pages use the hand-rolled primary-link pattern `bg-primary-600 px-6 py-3 text-sm font-semibold text-text-inverse transition-colors duration-150 hover:bg-primary-700 active:translate-y-px` — copy it verbatim for new primary CTAs there.
- **Inputs.** MVC: `.field` wrapper, 1px `--color-border-input` stroke, square, focus = 1px turmeric ring. Angular: `hlmInput` (h-8, matching `hlmBtn` sizes).
- **Cards.** MVC: `.card` (surface + subtle hairline, turmeric border on hover when linkable). Angular: surface + `border-border-subtle` hairlines; drag previews outlined in turmeric.
- **Emphasis.** Restraint is the system: one signal colour, hairlines over shadows, emphasis via `text-primary` + weight, never via new colours or extra borders.
