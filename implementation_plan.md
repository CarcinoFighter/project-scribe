# Visual Redesign — "Fresh Coat of Paint"

Modernize the visual layer of Carcino Vantage while preserving all existing functionality, component structure, and data flows.

## Design Direction

The current look is an editorial/newspaper aesthetic — zero border-radius everywhere, tiny monospace labels, marching-ants borders, and cut-corner buttons. The goal is to evolve this into a **refined, modern editorial** style that feels warmer, more spacious, and premium without rewriting any logic.

### Key Visual Changes

| Aspect | Current | Proposed |
|---|---|---|
| **Border radius** | `0px` everywhere (`!important` global reset) | Subtle radius: `6px` cards, `8px` modals, `20px` pills/badges |
| **Accent color** | `#9875c1` (muted purple) | `#7c5cfc` (vivid indigo-violet) — more energetic, better contrast |
| **Typography** | Tiny `7–9px` labels, tight spacing | Bump minimum to `10px`, improve readability |
| **Spacing** | Dense, newspaper columns | Slightly more breathing room, softer density |
| **Shadows** | Sharp dark shadows or none | Layered, colored ambient shadows |
| **Dividers** | Triple-rule `box-shadow` hack | Clean single-line dividers with accent gradient |
| **Buttons** | `clip-path` cut-corner, slide-fill hover | Rounded with smooth gradient hover + glow |
| **Cards** | Flat ruled rows, no background | Subtle elevated cards with soft hover lift |
| **Sidebar** | Flat, dense, line-based | Pill-shaped active indicators, softer spacing |
| **Header** | Bare, minimal 42px bar | Slightly taller (48px), glassmorphic backdrop blur |
| **Status chips** | Bordered uppercase micro-text | Rounded pill chips with soft colored fills |
| **Scrollbars** | 6px bare | Rounded, translucent |
| **Animations** | Stiff `translateY(8px)` | Smoother spring curves, scale + opacity |

## Scope — CSS Only (Mostly)

The redesign is **95% in `globals.css`**. Only 3 minor TSX changes:

### CSS Changes

#### [MODIFY] [globals.css](file:///c:/Users/AgnihotraNath/project-scribe/src/app/globals.css)
- Update `:root` CSS custom properties (new accent, updated shadows, radius tokens)
- Remove the `border-radius: 0 !important` global reset
- Restyle all `db-*` utility classes (buttons, cards, sidebar, header, filter bar, etc.)
- New ambient shadow and glow variables
- New gradient divider instead of triple-rule
- Softer animation keyframes
- Updated scrollbar styling
- Updated status chips to pill shape
- Updated modal styling with radius + better backdrop
- Updated toast, command palette, context menu

### Minor TSX Tweaks

#### [MODIFY] [layout.tsx](file:///c:/Users/AgnihotraNath/project-scribe/src/app/layout.tsx)
- Add Google Fonts link for **Inter** as a secondary font option (the existing `Google Sans Flex` stays primary)

#### [MODIFY] [page.tsx](file:///c:/Users/AgnihotraNath/project-scribe/src/app/page.tsx)  
- No structural changes — the page uses CSS classes that will be restyled automatically

## What Does NOT Change

- **No component structure changes** — all props, state, hooks, API calls stay identical  
- **No routing changes** — all navigation flows are preserved  
- **No theme system changes** — the theme engine in `theme.ts` + `SettingsModal` is untouched  
- **No new dependencies** — pure CSS refinement  
- **No Tailwind config changes** — only vanilla CSS in globals  

> [!IMPORTANT]
> The theme system (`applySettings()`) injects CSS vars as inline styles on `<html>` at runtime. The redesign only changes the *default* values in `:root` and the *class selectors* that consume them — so all 20+ themes continue to work exactly as before.

## Open Questions

> [!NOTE]
> None — the scope is narrow enough (visual polish only) that no architectural decisions are needed. If you'd prefer a different accent color or want to keep the zero-radius editorial look for certain elements, let me know before I start.

## Verification Plan

### Manual Verification
- Run `npm run dev` and visually inspect:
  - Dashboard (overview, articles, blogs tabs)
  - Sidebar (navigation, starred docs, word goal)
  - Header (logo, search, notifications, account menu)
  - Command palette (Ctrl+K)
  - Filter/sort bar
  - Toast notifications
  - Settings modal
  - Login page
  - Mobile responsive breakpoints
