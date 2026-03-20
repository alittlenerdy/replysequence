# ReplySequence Design System

## Brand Identity

**Positioning:** The follow-up layer for sales.
**Voice:** Direct, specific, confident. No buzzwords. Say what it does, not what it "unlocks."
**Personality:** Competent, focused, professional with warmth. Not sterile.

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / H1 | Space Grotesk | 800 (Extrabold) | 72px (desktop), 48px (mobile) |
| H2 | Space Grotesk | 700 (Bold) | 30-36px |
| H3 | Space Grotesk | 700 (Bold) | 18-20px |
| Body | Inter | 400 (Regular) | 16px minimum |
| Caption / Label | Inter | 500 (Medium) | 12-14px |
| Nav | Inter | 500 (Medium) | 14px |

**Scale ratio:** ~1.25 (Major Third)
**Line height:** 1.5x body, 1.1-1.15x headings
**Max measure:** 65-75 characters per line

## Color Palette

### Dark Theme (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#060B18` | Page backgrounds |
| `bg-surface` | `#0F172A` | Cards, panels |
| `bg-elevated` | `#0A1020` | Alternating sections |
| `border-default` | `#1E2A4A` | Card borders, dividers |
| `text-primary` | `#FFFFFF` | Headings |
| `text-body` | `#C0C8E0` | Body copy |
| `text-muted` | `#8892B0` | Secondary text |
| `text-subtle` | `#64748B` | Tertiary / footer text |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-indigo` | `#6366F1` | Primary CTA, links, active states |
| `accent-purple` | `#7A5CFF` | Gradient partner for indigo |
| `accent-amber` | `#F59E0B` | Secondary CTA, highlights, "After" labels |
| `accent-orange` | `#FF9D2D` | Warm accent, step 3 |
| `accent-cyan` | `#06B6D4` | Demo page, feature highlights |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | Connected states, positive badges |
| `error` | `#F87171` | Errors, overdue badges |
| `warning` | `#FACC15` | Attention-needed states |

### Light Theme

Light mode uses `light:` prefix on Tailwind classes. Surfaces invert to white/gray-50, text inverts to gray-900/600/500.

## Spacing

**Base unit:** 4px
**Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
**Section padding:** `py-20 md:py-28` (80-112px)
**Card padding:** `p-6` (24px)
**Container max:** `max-w-7xl` (1280px) for layout, `max-w-6xl` for content

## Border Radius

| Element | Radius |
|---------|--------|
| Cards | `rounded-2xl` (16px) |
| Buttons | `rounded-xl` (12px) |
| Inputs | `rounded-lg` (8px) |
| Badges | `rounded-full` |
| Icons in containers | `rounded-lg` to `rounded-xl` |

## Components

### Buttons
- **Primary CTA:** Amber gradient (`#F59E0B` → `#D97706`), black text, bold, rounded-xl
- **Secondary CTA:** Indigo solid (`#6366F1`), white text, rounded-xl
- **Ghost:** Border only (`border-[#1E2A4A]`), text color on hover
- **Touch target minimum:** 44px height on all interactive elements

### Cards
- Background: `bg-[#0F172A]`
- Border: `border border-[#1E2A4A]`
- No colored top/left borders (anti-pattern)
- Hover: `-translate-y-1` lift with shadow

### Navigation
- Fixed header with backdrop blur
- Bottom tab bar on dashboard (mobile)
- All nav links: minimum 44px touch target

## Anti-Patterns (Do Not Use)

These patterns make the site look AI-generated:

1. Colored left/top borders on cards (`border-left: 3px solid <accent>`)
2. Uniform icons in colored circles across feature grids
3. Bouncing/animated arrows between steps
4. `text-align: center` on everything
5. Generic hero copy ("Unlock the power of...", "Your all-in-one solution")
6. Purple-to-blue gradient backgrounds
7. Emoji as design elements
8. Decorative blobs or wavy SVG dividers

## Accessibility

- Touch targets: 44px minimum on all interactive elements
- Focus visible: `focus-visible:ring-2 focus-visible:ring-[#6366F1]/70`
- Color contrast: WCAG AA minimum (4.5:1 body text, 3:1 large text)
- `prefers-reduced-motion`: respect in all animations
- Keyboard navigation: all interactive elements reachable via Tab
- ARIA: landmarks, labels on icon-only buttons, `aria-expanded` on dropdowns
