# HeyDesk design system (v4: "Passbook")

Product truth is in [PRODUCT.md](PRODUCT.md). Where code goes is in
[docs/architecture.md](docs/architecture.md). This file says how it looks and
why. The tokens live in `src/assets/main.css` (`@theme`); this file and that
block must agree.

v4 (14 Oct 2026) replaces v3 ("Cobalt on paper"). v3 was calm but generic: a
soft dashboard of cards and round pills that could belong to any SaaS. v4
gives the console one idea of its own, the bank passbook, and keeps
Gigalogy's cobalt and the node mark.

**Design read:** a product console for non-technical small-business owners
in Dhaka, used on a counter laptop or a phone between customers, in daylight.
Calm, exact, trustworthy, because it handles money and customers. The job on
every screen: see what needs you, take the next legal step.

**Dials:** variance 4 (regular grid, the personality is in detail), motion 3
(state changes and one authored moment), density 5 (efficient, never cramped).

## The idea in one line

> The console is a passbook: every order, booking and message is an entry,
> dated, coded, totalled and stamped, in cobalt ink on white paper.

What that means in practice:

- **Rules, not cards.** Things on the page are separated by one-pixel lines.
  Shadows are only for things that float over the page.
- **Columns never move.** A list is a ledger: when, who, what, code, amount,
  stamp, always in the same place, so the eye runs down a column.
- **Status is a stamp.** A small square-cornered box, an icon and a word, its
  border inked in its own colour.
- **Codes are serials.** Order and booking codes (A-104, M-42) are set in a
  mono face, like a cheque number. Nothing else is.
- **Money sits tight to the right margin** in tabular figures.
- **Only the next legal step is filled cobalt.** Everything else is a
  secondary or quiet button.

The guilloche and double rule from the first sketch were left out: the rules
and stamps carry the idea on their own, and the extra ornament read as decor.

## Colour

Strategy: **restrained**. Neutrals plus one accent. Light only (owners work in
lit shops and offices; one theme done well beats two done halfway).

| Token | Value | Use |
|---|---|---|
| `--color-brand` | `#004AAC` | Primary buttons, links, selected tab underline, active nav icon, focus ring, setup progress |
| `--color-brand-hover` | `#003B8A` | Hover and pressed on brand |
| `--color-brand-tint` | `#EDF3FC` | Selected row, icon tiles, the active nav item, agent bubbles in transcripts, the "New" stamp |
| `--color-brand-tint-strong` | `#D9E6F8` | Text selection, one avatar tint |
| `--color-surface` | `#FFFFFF` | The whole sheet: sidebar and work area alike |
| `--color-sidebar` | `#F3F5F9` | Paper bands on the landing page, quiet fills (the name is historical) |
| `--color-wash` | `#F7F9FC` | Row hover, detail panes, the segmented track |
| `--color-hover` | `#EBEFF6` | Counts, skeletons, neutral stamps |
| `--color-hairline` | `#E2E7EF` | Every rule between rows and around panels |
| `--color-line-strong` | `#C9D2DF` | Input and secondary button borders, the rule under a day or column heading, notices |
| `--color-ink` | `#0B1A33` | Text (Gigalogy's indigo navy, never `#000`) |
| `--color-ink-soft` | `#4D5A70` | Secondary text |
| `--color-ink-faint` | `#8591A5` | Icons only, never text |
| `--color-success` / `-tint` | `#127A48` / `#E7F4ED` | Live, confirmed, ready |
| `--color-attention` / `-tint` | `#B54708` / `#FDF1E7` | "Needs a person", things left to fill in |
| `--color-danger` / `-tint` | `#C22B2B` / `#FDEEEE` | Destructive actions and failed saves |

Why orange for attention: it sits opposite cobalt on the colour wheel, so a
waiting customer is the second thing the eye finds after the action. The hue
stays near 22 degrees so it never passes for the red of `--color-danger`.

Why a notice is a white panel, not a tinted box: a peach box with orange text
is the stock "warning" of every UI kit. `.notice` is white with a
`line-strong` rule, a title in ink, one line in ink-soft, and the orange
carried by the icon alone. `bg-attention-tint` is for the stamp and small icon
circles only.

Rules: cobalt means "act here" or "selected", nothing else. Green, orange and
red are states, never decoration (so avatars use only brand-family tints). No
gradients, no glass, no pure black or pure white text on colour.

## Type

**Geist** 400/500/600/700 for everything, **Geist Mono** 500 for serials only
(`.serial`, `--font-serial`). Bangla falls back to **Noto Sans Bengali**, with
normal tracking and taller lines (`:lang(bn)` in `main.css`), because tight
tracking clips Bengali vowel signs.

Sentence case everywhere. Tabular figures on the whole app
(`font-variant-numeric: tabular-nums`), so prices, times and counts line up
without monospace.

| Role | Size / weight | Tracking |
|---|---|---|
| Page title (`PageHeader`, Setup, Sign-in) | 26px / 600 | -0.025em |
| Statement figures (Home) | 28px / 600 | -0.02em |
| Section title (`.section-title`) | 16px / 600 | -0.01em |
| Body and controls | 14px / 400-600 | 0 |
| Hints, meta, times, day headings | 13px / 400-600 | 0 |
| Stamps, counts, column names | 11-12px / 500-600 | 0 |
| Landing headline | 52-56px / 600 | -0.035em |

## Shape and elevation

Small, printed corners: **panels 10px**, **controls 8px**, **stamps 4px**.
Counts and avatars stay round.

Two elevations. `--shadow-lift` (1px) is for small things that sit on an edge
or another surface: the active segment, the sidebar's fold handle, a photo's
remove button, the agent's chat bubble.
`--shadow-float` is for things over the page: menus (`.popover`), the drawer,
the test chat sheet, the document reader, the floating `SaveBar`, tooltips.
Panels, inputs and secondary buttons have a rule and no shadow.

## Components (classes in `main.css`, components in `src/components/ui/`)

- **Buttons** `.btn` + `.btn-primary | -secondary | -quiet | -danger`, `.btn-sm`,
  `.btn-icon`. 40px high (44px on touch screens). The primary has a faint top
  highlight. One primary per screen.
- **Fields** `.field`, `.label` above, `.hint` and `.error-text` below. Focus is
  a cobalt border plus a soft 3px ring. `FieldLabel` puts a field's help behind
  an `InfoTip` instead of a hint line.
- **InfoTip**: a small "i" that shows one line of help on hover, focus or tap.
  `PageHeader`, `SettingsGroup` and `FieldLabel` take a `tip` prop, so pages
  explain themselves without paragraphs.
- **Tabs** `.tabs` / `.tab` / `.tab-active`: underlined, 44px, running edge to
  edge under the page header. **Segmented** `.segmented` / `.segment`: a ruled
  track for a two or three way filter.
- **Ledger** `.ledger` (+ `.ledger-money` for agents that take orders) and
  `.ledger-head`: fixed grid columns, when / avatar / entry / code / amount /
  stamp / caret. On phones only the avatar, the entry and one end cell remain.
- **Rows** `.row` (rule below, wash on hover), `.row-selected` (cobalt tint).
  **Day heading** `.day-head`: "Today", "Yesterday", "12 October", printed
  over a `line-strong` rule and sticky while its rows scroll (add `static`
  where it should not stick, as in the landing demo).
- **Stamp** `.chip` via `StatusChip`: icon plus word, 4px corners, a border in
  its own colour at 24%. `LiveStatus`: a dot that breathes once every 2.4s,
  plus a word; one breathing dot per screen.
- **Serial** `.serial`: order and booking codes.
- **Panel** `.panel`: a ruled 10px box for a group (setup guide, the agent
  panel on Home). **Notice** `.notice`: see Colour.
- **SettingsGroup**: one group of settings, its name on the left (12rem) and
  its fields on the right, groups ruled apart. Phones stack them.
- **Popover** `.popover` / `.menu-item` with `usePopover()`: a small menu that
  closes on an outside click or Escape (account menu, Import).
- **PageHeader**: title (with optional tip), one line, actions on the right,
  tabs below.
- **EmptyState**: icon tile, what this is, how to fill it.
- **LoadError**: the backend's sentence and Try again.
- **SaveBar**: a floating ruled bar at the bottom of a settings form once
  something changed: "Unsaved changes", Discard, Save changes; after a save it
  offers the test chat, the moment to try the change.

## The shell

```
┌────────────────┬──────────────────────────────────────────────────────┐
│ ▣ Lakeview  ◧  │ Good evening                                          │
│   ● Agent live │ Wednesday, October 14                                 │
│                ├───────────┬────────────┬────────────┬─────────────────┤
│ ⌂ Home         │ Convers.  │ Bookings   │ Messages   │ ⧗ Waiting for you│
│ ▤ Inbox     2  │ 6         │ 3          │ 1          │ 4               │
│ ◌ Conversations├───────────┴────────────┴────────────┴─────────────────┤
│                │ ┌ Finish setting up ───── ▬▬▬▬▭ ┐   ┌ Your agent ──┐  │
│ Your agent     │ │ 5 Share it with customers [Open]│  │ ● Live        │  │
│ ⚙ Settings     │ └─────────────────────────────────┘  │ Website chat On│ │
│ ⚕ Doctors      │ Needs you                 Open inbox │ Telegram  ... │  │
│ ▥ Knowledge    │ When   Customer          Code Status │ Chat link     │  │
│ ⇄ Channels     │ 4 min  NJ Nusrat Jahan  A-118 [New] >│ [Edit settings]│ │
│                │ 38 min TH Tanvir H.     A-117 [New] >└───────────────┘  │
│ [Try your agent]                                                      │
│ (D) demo@...  ⇕│                                                      │
└────────────────┴──────────────────────────────────────────────────────┘
```

- One white sheet. The sidebar (240px) is ruled off from the work area, not
  tinted. It folds to 64px icons (the handle on its edge, remembered in this
  browser); folded, group labels become a rule and counts become badges on the
  icons.
- The header is the HeyDesk mark, the business name and its live status. No
  second logo, no wordmark row.
- Two groups: daily work (Home, Inbox, Conversations), then "Your agent"
  (Settings, Menu or Doctors, Knowledge, Channels). The active item sits on
  cobalt tint with a filled cobalt icon. The Conversations count is orange
  because it means someone is waiting.
- "Try your agent" is always one click away at the bottom.
- The account row (avatar, email, role) opens a menu with the language switch
  and Sign out.
- Under 768px: a bottom tab bar (Home, Inbox, Chats, Agent, More), and More
  opens the same sidebar as a drawer.
- Each list page fills the height; the list and the detail pane scroll on
  their own.

## Home

Greeting and today's date at the top. Then **today's statement**: a strip of
ruled cells, one figure each (conversations, one per job the agent takes, the
money orders brought in, and "Waiting for you", orange when above zero). Below,
the setup guide if anything is left, then **Needs you** as a ledger
(hand-offs first, then new records, six at most), and on the right the agent
panel (live status, channels, knowledge, chat link).

## The front door (signed out)

Same world as the console: white sheet, rules, stamps, serials.

- **Sign-in**: the form on the left; on the right a cobalt field where an
  example conversation plays once (the order is read back, the customer says
  yes) and then lands as a passbook entry: a "Today" heading, the row with its
  serial and amount, the "New" stamp, and the proof line "Read back to the
  customer and confirmed in chat". Labelled as an example. The row is the
  landing demo's `InboxRow`, so the two never drift apart.
- **Setup** (first run): three numbered steps (Choose, Your details, Try it).
  The kinds of agent are ruled rows with a radio at the end, not cards. The
  last step puts the live chat beside the chat link and a notice listing what
  is still to fill in.
- **Landing** (`/`): paper (`bg-sidebar`) bands between white sections, cobalt
  only on the "Create your business account" buttons and links. The headline
  is the one place type goes large.
  - **Proof is the product.** `LandingDemo` plays the mechanism: the customer
    asks, the agent reads it back with the total (and a caption saying where
    the number came from), the customer says yes, and only then does the
    entry land in the inbox, lit in cobalt tint for a beat. A segmented
    control switches restaurant, clinic and front office. Labelled "An
    example, not real customers". Under reduced motion it shows the finished
    story.
  - Sections are rows with rules, never feature cards. A number marks a step
    only where the order means something (how it decides, setup).
  - No testimonials, logos or statistics until real ones exist.

Landing motion (every piece explains something, all of it off under
`prefers-reduced-motion`):

- **Demo, the main moment.** The read-back streams in word by word with a
  cobalt caret, like the real agent; the "new" count bumps when the order
  lands. The demo cycles restaurant, clinic, front office on its own, with a
  2px cobalt line filling under the active tab to show when it moves on. It
  plays only while on screen, and stops cycling once the visitor picks a tab
  or presses Play again.
- **Opening** settles in once (headline, line, action, demo, 0.1s apart, 14px
  up with a 4px blur clearing).
- **Scroll moments** use `v-reveal` (`src/directives/reveal.js`): lists arrive
  row by row. In "How it decides" each number fills cobalt in turn while a
  line draws to the next; in setup each number turns into a green check in
  turn. Content below the fold is the only thing ever hidden first.
- The header's rule appears only once the page scrolls.

## Signature details

1. **The node mark**: Gigalogy's constellation of dots, drawn as a speech bubble.
2. **Today's statement** on Home, the passbook's balance line.
3. **The ledger**: columns that never move, codes as serials, money at the
   right margin, a stamp at the end.
4. **Setup guide** of five outcome-worded steps. It lists only the steps left
   (the bar in its header counts the done ones); the next step is the screen's
   primary button; the guide disappears when everything is done.
5. **Status is always an icon plus a word**, set as a stamp.
6. **Proof line on every record**: "Read back to the customer and confirmed in
   chat", because the AI never invents an order.

## Motion

150-250ms, exponential ease-out (`--ease-settle`). The sidebar folds in 200ms;
sheets and the drawer slide 24px; the save bar rises in; the sign-in example
plays once. Everything is off under `prefers-reduced-motion`.

## Copy

Friendly, direct, short sentences. Outcome words ("Add your doctors", "Share it
with customers"), never system words ("Configure workspace"). Controls name
their action. Help lives behind an `InfoTip`, not in paragraphs. Errors are
the backend's own sentence. No em-dashes, no emoji, no ALL CAPS, no labels
above headings.
