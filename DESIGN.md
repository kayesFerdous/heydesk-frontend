# HeyDesk design system (v3: "Cobalt on paper")

Product truth is in [PRODUCT.md](PRODUCT.md). Where code goes is in
[docs/architecture.md](docs/architecture.md). This file says how it looks and
why. The tokens live in `src/assets/main.css` (`@theme`); this file and that
block must agree.

v3 (8 Oct 2026) replaces v2, which had a full-height navy rail. The navy rail
read as an admin template; v3 keeps Gigalogy's cobalt and node logo and moves
to the light, quiet shell that Stripe, Linear and Notion use.

**Design read:** a product console for non-technical small-business owners,
used on a shop laptop or a phone between customers. Calm, exact, trustworthy,
because it handles money and customers. The brand is Gigalogy's cobalt
`#004AAC`, used sparingly so that it always means something.

**Dials:** variance 4 (regular grid, the personality is in detail), motion 3
(state changes and one authored moment), density 5 (efficient, never cramped).

## The idea in one line

> Paper and ink, with one cobalt pen: a quiet sidebar, a white desk, and blue
> only where the owner can act.

## Colour

Strategy: **restrained**. Neutrals plus one accent. Light only (owners work in
lit shops and offices; one theme done well beats two done halfway).

| Token | Value | Use |
|---|---|---|
| `--color-brand` | `#004AAC` | Primary buttons, links, selected tab underline, active nav icon, focus ring, setup progress |
| `--color-brand-hover` | `#003D8F` | Hover and pressed on brand |
| `--color-brand-tint` | `#EEF3FB` | Selected row, icon tiles, agent bubbles in transcripts |
| `--color-brand-tint-strong` | `#DFE9F8` | Text selection, one avatar tint |
| `--color-surface` | `#FFFFFF` | The work area, edge to edge |
| `--color-sidebar` | `#F5F6F9` | The sidebar (paper) |
| `--color-wash` | `#F7F8FA` | Detail panes, sticky day headers, quiet fills |
| `--color-hover` | `#EEF0F4` | Hover on quiet things, segmented control track, counts |
| `--color-hairline` | `#E6E9EF` | Every divider and panel border |
| `--color-line-strong` | `#D4D9E2` | Input and secondary button borders |
| `--color-ink` | `#0C1424` | Text |
| `--color-ink-soft` | `#566176` | Secondary text (about 6:1 on white) |
| `--color-ink-faint` | `#8B94A6` | Icons only, never text |
| `--color-success` / `-tint` | `#157F4C` / `#E7F5ED` | Live, confirmed, ready |
| `--color-attention` / `-tint` | `#B54708` / `#F1F3F6` | "Needs a person", things left to fill in. The colour goes on the icon, the dot and solid counts; the tint is the neutral grey behind the chip and icon circles |
| `--color-danger` / `-tint` | `#C42B2B` / `#FDEEEE` | Destructive actions and failed saves |

Why orange for attention: orange sits opposite cobalt on the colour wheel, so a
waiting customer is the second thing the eye finds after the action. The v2
value (`#8A5A0B`) was a darkened yellow, which reads as brown and muddy next to
cool blue-greys. The hue is kept near 22 degrees so it never passes for the red
of `--color-danger`.

Why a notice is a white panel, not a tinted box: a peach box with orange text
is the stock "warning" of every UI kit and reads as generated, and a grey box
looks like one more chat bubble. Google, Stripe and Apple put a notice on the
page's own white, with a firmer border and a slight lift, so it reads as the
product talking. HeyDesk does the same with `.notice`: white, `line-strong`
border, `shadow-lift`, a title in `text-ink` semibold, one line of detail in
`text-ink-soft`, and the orange carried by the icon alone. `bg-attention-tint`
stays for the chip and small icon circles only.

Rules: cobalt means "act here" or "selected", nothing else. Green, amber and red
are states, never decoration (so avatars use only brand-family tints). No
gradients, no glass, no pure black or pure white text on colour.

## Type

**Onest** 400/500/600/700, one family. Sentence case everywhere. Tabular
figures on the whole app (`font-variant-numeric: tabular-nums`), so prices,
codes and times line up without monospace.

| Role | Size / weight | Tracking |
|---|---|---|
| Page title | 24px / 600 | -0.02em |
| Section title (`.section-title`) | 16px / 600 | -0.01em |
| Body and controls | 14px / 400-600 | 0 |
| Hints, meta (`.hint`) | 13px / 400 | 0 |
| Chips, counts, day headers | 11-12px / 600 | 0 |

## Shape and elevation

Concentric: **panels 12px**, **controls 8px**, **chips and counts fully round**.

Two elevations only. `--shadow-lift` (1px, for inputs, secondary buttons and the
active nav item) and `--shadow-float` (menus, the drawer, the test chat sheet,
the document reader). Panels use a border, never also a shadow.

## Components (classes in `main.css`, components in `src/components/ui/`)

- **Buttons** `.btn` + `.btn-primary | -secondary | -quiet | -danger`, `.btn-sm`,
  `.btn-icon`. 40px high (44px on touch screens). The primary has a faint top
  highlight. One primary per screen.
- **Fields** `.field`, `.label` above, `.hint` and `.error-text` below. Focus is
  a cobalt border plus a soft 3px ring.
- **Tabs** `.tabs` / `.tab` / `.tab-active`: underlined, inside a page.
  **Segmented** `.segmented` / `.segment`: a two or three way filter.
- **Rows** `.row` (hairline, wash on hover), `.row-selected` (cobalt tint).
  Day groups have a sticky 12px header on wash.
- **Panel** `.panel`: a bordered 12px box for a group (setup guide, channel card).
- **Status** `StatusChip` (icon plus word) and `LiveStatus` (a dot that breathes
  once every 2.4s, plus a word; one breathing dot per screen).
- **PageHeader**: title, one sentence, actions on the right, tabs below.
- **EmptyState**: icon tile, what this is, how to fill it.
- **LoadError**: the backend's sentence and Try again.
- **SaveBar**: sticky at the bottom of a settings form once something changed:
  "Unsaved changes", Discard, Save changes; then "Saved. Your agent uses this
  from the next message."

## The shell

```
┌──────────────┬──────────────────────────────────────────────┐
│ ▣ Lakeview   │ Good morning                                 │
│   ● Agent live│ Today your agent had 3 conversations and ... │
│              │ ┌ Finish setting up ──────── ▬▬▬▬▭ ┐ │ Your agent
│              │ │ 1 step left, 4 of 5 done         │ │ ● Live
│ ⌂ Home       │ │ 5 Share it with customers [Open] │ │ Web chat On
│ ▤ Inbox    2 │ └──────────────────────────────────┘ │ Telegram ...
│ ◌ Conv.    1 │ Needs you                            │ Chat link
│              │ ⚑ Nusrat asked for a person      >   │
│ Your agent   │ NJ Nusrat Jahan A-101  New       >   │
│ ⚙ Settings   │                                      │
│ ⚕ Doctors    │                                      │
│ ▥ Knowledge  │                                      │
│ ⇄ Channels   │                                      │
│[Try your agent]                                     │
│ D demo@...  ⏏│                                      │
└──────────────┴──────────────────────────────────────────────┘
```

- Sidebar 240px on paper. One header, one logo: the HeyDesk mark, then the
  business name and its live status (the way Stripe and Linear show whose
  workspace it is). No second "initial" tile, no separate wordmark row.
  Two groups: daily work (Home, Inbox, Conversations), then "Your agent"
  (Settings, Menu or Doctors, Knowledge, Channels). The active item is lifted
  onto white with a cobalt icon. Counts are small round badges; the
  Conversations count is amber because it means someone is waiting.
- "Try your agent" is always one click away at the bottom of the sidebar.
- Under 768px: a bottom tab bar (Home, Inbox, Chats, Agent, More), and More
  opens the same sidebar as a drawer.
- Each list page fills the height; the list and the detail pane scroll on
  their own.

## Signature details

1. **The node mark**: Gigalogy's constellation of dots, drawn as a speech bubble.
2. **The sign-in panel shows the mechanism**: a cobalt field where an example
   conversation plays once (the order is read back, the customer says yes) and
   the order lands as an inbox row. Labelled as an example.
3. **The "Today" sentence** on Home instead of a row of big numbers: "Today your
   agent had 3 conversations and took 2 orders worth ৳1,840."
4. **Setup guide** of five outcome-worded steps. It lists only the steps left
   (the bar in its header counts the done ones); the next step is the screen's
   primary button; the guide disappears when everything is done.
5. **Status is always an icon plus a word.**
6. **Proof line on every record**: "Read back to the customer and confirmed in
   chat", because the AI never invents an order.

## The landing page (`/`, signed out)

Same world as the app, not a separate marketing look: white desk, paper
(`bg-sidebar`) bands between sections, Onest, cobalt only on the two
"Create your business account" buttons and links. The headline is the one
place type goes large (52-56px, -0.035em).

- **Proof is the product.** `LandingDemo` plays the mechanism once: the
  customer asks, the agent reads it back with the total (and a caption saying
  where the number came from), the customer says yes, and only then does the
  row land in the inbox, lit in cobalt tint for a beat. A segmented control
  switches restaurant, clinic and front office. Labelled "An example, not real
  customers". Under reduced motion it shows the finished story.
- Sections are rows with hairlines, never feature cards. A number marks a step
  only where the order means something (how it decides, setup).
- No testimonials, logos or statistics until real ones exist.

Landing motion (every piece explains something, all of it off under
`prefers-reduced-motion`):

- **Demo, the main moment.** The read-back streams in word by word with a
  cobalt caret, like the real agent; the "new" count bumps when the order
  lands. The demo cycles restaurant, clinic, front office on its own, with a
  2px cobalt line filling under the active tab to show when it moves on. It
  plays only while on screen, and stops cycling for good once the visitor
  picks a tab or presses Play again.
- **Opening** settles in once (headline, line, action, demo, 0.1s apart, 14px
  up with a 4px blur clearing).
- **Scroll moments** use `v-reveal` (`src/directives/reveal.js`): lists arrive
  row by row. In "How it decides" each number fills cobalt in turn while a
  line draws to the next; in setup each number turns into a green check in
  turn. Content below the fold is the only thing ever hidden first.
- The header's hairline appears only once the page scrolls.

## Motion

150-250ms, exponential ease-out (`--ease-settle`). Pages settle 4px upward on
entry; sheets and the drawer slide 24px; the save bar rises in; the sign-in
example plays once. Everything is off under `prefers-reduced-motion`.

## Copy

Friendly, direct, short sentences. Outcome words ("Add your doctors", "Share it
with customers"), never system words ("Configure workspace"). Controls name
their action. Errors are the backend's own sentence. No em-dashes, no emoji, no
ALL CAPS, no labels above headings.
