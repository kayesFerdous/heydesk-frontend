# HeyDesk design direction (v2: "Cobalt")

Replaces v1 (stone canvas, floating panel, green accent), rejected on 4 Oct 2026.
Evidence in [research.md](research.md); product truth in [../PRODUCT.md](../PRODUCT.md).

**Design read:** product console for non-technical small-business owners, with a
Google/Apple/OpenAI-grade restraint language that is a direct **upgrade of
Gigalogy's own identity** (cobalt `#004AAC`, indigo navy, dot-network logo,
workspace switcher), leaning toward native CSS tokens + Tailwind v4 + Phosphor
thin icons. (`design-taste-frontend` is scoped to marketing surfaces; its
anti-slop rules, token discipline and pre-flight apply here, while layout follows
the product-UI findings in the research.)

**Dials:** `DESIGN_VARIANCE 5` (regular, predictable grid; the personality is in
type, colour discipline and detail), `MOTION_INTENSITY 3` (state changes only),
`VISUAL_DENSITY 5` (efficient, never cramped).

## The idea in one line

> Gigalogy's blue band, turned 90 degrees and given a job: a deep navy rail holds
> navigation, one cobalt action leads each screen, and everything else is calm
> white work.

## What it fixes (current console vs HeyDesk)

| Current Gigalogy problem | HeyDesk answer |
| --- | --- |
| Loud 88px blue band that says nothing | No top band. Brand lives in a navy left rail that also holds navigation. |
| Giant empty canvas, fields as wide as the page | Content max-widths: forms 640px, reading 65ch, lists fill, detail pane 400px. |
| All fields look the same | Sections with headings; the 2 that matter first; "Advanced" collapsed. |
| Jargon (Index Column, Solution Type) | Outcome words: "Menu", "Pickup order", "Opening hours". |
| Row of 5 unlabeled grey icons, Delete next to Edit | One labeled primary step per row; rare/destructive actions in a "More" menu, confirmed in place. |
| ALL-CAPS tracked buttons | Sentence case, 44px, 10px corners. |
| Grey slab for the active nav item | Translucent-white item on navy with a bright cobalt icon + count badge. |
| Breadcrumb + stepper + tabs + title stacking | Title row + one set of tabs. Breadcrumbs only 3+ levels deep. |
| Chat bubble covering content | None. The agent test chat is a dedicated panel on the Agent page. |
| Helpless empty states | Every empty state teaches the next move. |

## Tokens (will live in `src/assets/main.css` `@theme`)

| Token | Light | Use |
| --- | --- | --- |
| `--color-brand` | `#004AAC` | primary buttons, links, selected tab, focus ring (Gigalogy's own blue) |
| `--color-brand-deep` | `#003A87` | hover / pressed |
| `--color-brand-tint` | `#EAF1FB` | selected row, soft fills |
| `--color-brand-glow` | `#7FB0FF` | active icon on the navy rail only |
| `--color-navy` | `#283371` | record names, key headings (Gigalogy's project-name colour) |
| `--color-rail` | `#0A1B3D` | the navigation rail |
| `--color-surface` | `#FFFFFF` | the work area, edge to edge |
| `--color-wash` | `#F6F8FB` | detail pane, table header, quiet fills |
| `--color-hairline` | `#E3E8EF` | all dividers and borders |
| `--color-ink` | `#0E1726` | text (blue-tinted near-black, never `#000`) |
| `--color-ink-soft` | `#5B6577` | secondary text (5.9:1 on white) |
| `--color-success` / `-tint` | `#18874E` / `#E6F5EC` | success and the "live" indicator only |
| `--color-attention` / `-tint` | `#8A5A0B` / `#FFF4DB` | "needs a person" only |
| `--color-danger` | `#C42B2B` | destructive only |

**One brand colour.** Blue means "you can act here / this is selected".
Everything else is neutral. Green, amber, red are states, never decoration.

**Light only:** the app ignores `prefers-color-scheme` and is always light. A dark theme
would be the palette in git history (surface `#0B1220`, brand `#4C8DF0`).

**Type:** **Onest** (400/500/600/700), one family. Sentence case everywhere.
Fixed scale 12 / 13 / 14 / 16 / 20 / 28 / 36. Prices, order numbers, times and
phone numbers use **tabular figures** (`font-variant-numeric: tabular-nums`),
not monospace: that is what Stripe, Apple and Google do, and it looks premium
instead of technical. Bengali customer text falls back to Noto Sans Bengali.
Headings in `--color-navy` only for record names; page titles in ink.

**Shape (concentric):** panels and the detail pane 14px, controls and inputs 10px,
chips and avatars fully round. Nothing else.

**Elevation:** hairlines for structure. One soft shadow, only for menus and the
test-chat sheet. No glass: the rail's navy is the control layer.

**Motion:** 150-250ms exponential ease-out. Rail collapse, row-to-detail
selection, button press (1px). The live dot breathes once per 2.4s (real state).
All off under `prefers-reduced-motion`.

## The shell

```
┌────────────┬──────────────────────────────────────────────────────────┐
│ NAVY RAIL  │  WHITE WORK AREA, edge to edge                           │
│ ▣ HeyDesk  │  Inbox                                [Search…  ⌘K]      │
│ Spice Gard ▾│  What your agent took, waiting for you.                  │
│            │  Pickup orders 2 │ Messages 1                            │
│ ▤ Inbox  3 │  ───────────────────────────────────────────────────     │
│ ◌ Chats  1 │  Today                         │ DETAIL PANE (wash)      │
│ ⌘ Menu     │  ○ #1042 Tanvir Ahmed  ৳1,030  │ Order #1042      New    │
│ ◍ Agent    │  ○ #1041 Nusrat Jahan  ৳670    │ 2 x Chicken Biryani     │
│            │  Yesterday                     │ ...                     │
│ [Talk to   │  ○ #1038 ...                   │ [ Mark as ready ]       │
│  your      │                                │                         │
│  agent]    │                                │                         │
│ F Farhana  │                                │                         │
└────────────┴──────────────────────────────────────────────────────────┘
```

- Rail 248px, collapses to a 72px icon rail (Material 3 behaviour); under 900px it
  becomes a bottom tab bar.
- Top of rail: logo mark + wordmark, then a **business switcher** row (kept from
  Gigalogy; also where an admin switches businesses).
- Active item: translucent white 10% background, white text, `--color-brand-glow`
  icon. Counts are small badges; the Chats badge is amber only when someone needs a
  person.
- Bottom of rail: a large **Talk to your agent** button (the key action, always
  one click away; opens the test chat sheet), then the account row.
- Work area header: title and subtitle left, search field right. A screen's single
  primary button sits in the header's right edge, 44px, filled cobalt.
- The page does not scroll; the list and the detail pane scroll independently.

## Signature details (what makes it feel designed, not assembled)

1. **The node motif.** Gigalogy's logo is a constellation of connected dots. The
   HeyDesk mark is a speech bubble drawn from five connected nodes; the same
   dot-and-line pattern appears faintly in the sign-in panel, the empty states
   and the rail footer. Identity, not decoration.
2. **Tabular figures everywhere money appears**, right-aligned in columns.
3. **Time-grouped lists** ("Today", "Yesterday", "Earlier this week").
4. **Status = icon + word** (clock "New", check "Ready", person "Needs a person"),
   never colour alone.
5. **Initial avatars** tinted from a fixed set of five brand-family hues, so the
   list has rhythm without photos.
6. **The agent test sheet**: slides over from the right, 420px, with a "Chat" and
   "Call" switch, streaming text.

## Screens (build order)

1. Sign in / Create account (split: form + cobalt node panel)
2. Choose a preset (first run only)
3. **Inbox** (home): time-grouped list + detail pane
4. Your agent: settings (sections) + test sheet + chat link + `missing` checklist
5. Conversations: list + transcript, hand-off banner
6. Menu: table with availability toggles, CSV import
7. Admin (later)

## Rules the UI keeps

- Hide what a role cannot do. No row of disabled buttons.
- Loading is a skeleton in the shape of the content. Errors show the backend's own
  sentence. Empty states teach the next move.
- Destructive actions confirm in place, not in a modal.
- Money `৳1,030`, times `7:30 PM`, tabular. Dates relative where possible.
- No em-dashes, no emoji, no ALL CAPS, no eyebrow labels, no version numbers, no
  decorative dots, no scroll cues.
