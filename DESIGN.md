# HeyDesk design system (v5: "Ink and lime")

Product truth is in [PRODUCT.md](PRODUCT.md). Where code goes is in
[docs/architecture.md](docs/architecture.md). This file says how it looks and
why. The tokens live in `src/assets/main.css` (`@theme`); this file and that
block must agree.

v5 (22 Oct 2026) replaces v4 ("Passbook", cobalt rules on white paper). The
owner judged v4 too plain and picked this direction from three generated
Home screens (the prompts are in [docs/image-prompts.md](docs/image-prompts.md)).
Gigalogy's cobalt is gone with it; the owner chose that.

**Design read:** a product console for non-technical small-business owners
in Dhaka, used on a counter laptop or a phone between customers. Friendly and
confident, with a strong frame: a black panel says where you are and what
waits, white islands hold the work.

**Dials:** variance 5 (a bento on Home, plain columns elsewhere), motion 3,
density 4 (roomy, big numbers, big tap targets).

## The idea in one line

> Black means "do this", lime means "you are here", and everything else is
> white islands on a warm grey canvas.

- **A black panel for where you can go**: the sidebar floats on the canvas
  with round corners. At its top, one count tile per job and one for
  customers waiting for a person, each a link to its list.
- **Islands, not sheets.** Home lays white islands (28px corners, no shadow)
  straight on the canvas. Every other page sits in one white island beside
  the sidebar.
- **Lime is selection only**: the open page in the sidebar and the tab bar,
  the chosen tab or filter, a selected row (pale lime), the agent's tile on
  Home. It is never a button colour on white.
- **One black primary per screen.** On a black surface the primary is lime
  (`.btn-lime`).
- **Lists stay rows** with hairlines, grouped Today / Yesterday, inside an
  island. Home's "Needs you" uses rounded grey rows instead, because it is a
  short list of things to act on, not a ledger.
- **Codes are serials** (A-104, M-42) in a mono face. Nothing else is.

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#ECECE8` | Behind everything: the app's background, Home's canvas |
| `--color-surface` | `#FFFFFF` | Islands, fields, popovers |
| `--color-wash` / `--color-sidebar` | `#F5F5F2` | Rows inside an island (Home's "Needs you", setup steps), detail panes, paper bands |
| `--color-hover` | `#EBEBE6` | Hover, counts, skeletons, the segmented track, quiet bars |
| `--color-hairline` | `#E7E7E2` | Rules between rows and around panels |
| `--color-line-strong` | `#D4D4CC` | Input and secondary button borders, day headings |
| `--color-ink` | `#111111` | Text |
| `--color-ink-soft` | `#5C5C56` | Secondary text |
| `--color-ink-faint` | `#9B9B93` | Icons only, never text |
| `--color-brand` | `#111111` | The primary button and links (the token keeps its old name) |
| `--color-brand-tint` | `#F0F8D2` | Pale lime: a selected row, icon tiles, the "New" chip |
| `--color-lime` (`--color-brand-tint-strong`) | `#D4F36B` | You are here: active nav, chosen tab, the agent tile, focus ring |
| `--color-lilac` | `#CDB8FF` | Decoration only: Home's lead figure tile |
| `--color-tint-lilac / -sky / -sand` | pastels | Avatar tints, decoration only |
| `--color-night` / `-night-tile` / `-night-soft` | `#111111` / `#1F1F1F` / `#A3A39B` | The sidebar, its tiles, its quiet text |
| `--color-success` / `-tint` | `#17804C` / `#DCF5E6` | Live, confirmed, ready |
| `--color-attention` / `-tint` / `-bright` | `#B54708` / `#FFE6D1` / `#FF8A3D` | "Needs a person"; bright is for counts on black |
| `--color-danger` / `-tint` | `#C22B2B` / `#FDE8E8` | Destructive actions and failed saves |

Green, orange and red stay states, never decoration, so avatars use the
pastel tints only. Orange is the one warm colour, so a waiting customer is
what the eye finds first. No gradients, no glass.

## Type

**Gabarito** 400 to 800 for everything (geometric, chunky and friendly, with
tabular figures; the detector flags Plus Jakarta Sans and Geist as overused), **IBM Plex Mono** 500 for serials only. Bangla falls back to
**Noto Sans Bengali** with normal tracking and taller lines (`:lang(bn)`).

| Role | Size / weight |
|---|---|
| Home greeting | 32-40px / 800, -0.03em |
| Page title (`PageHeader`) | 28px / 800, -0.03em |
| Island title | 20px / 700 |
| Big figures | 28-36px / 800 |
| Body and controls | 14-15px / 400-700 |
| Hints, meta, chips | 12-13px / 500-600 |

## Shape and elevation

Concentric: **islands 28px** (`--radius-panel`), **things inside them 20px**
(`--radius-card`: rows, panels, popovers, textareas), **small boxes inside
those 14px** (`--radius-thumb`: photos, tooltips, a ruled list in a panel),
**controls and chips a full pill** (`--radius-control`, `--radius-stamp`). Islands sit flat; only
things over the page (menus, the drawer, sheets, the phone tab bar, tooltips)
get `--shadow-float`.

## Components (classes in `main.css`, components in `src/components/ui/`)

- **Buttons** `.btn` (44px pill) + `.btn-primary` (black) `| -secondary`
  (white, ruled) `| -quiet | -danger | -lime` (the primary on black),
  `.btn-sm`, `.btn-icon` (round).
- **Fields** `.field`: pills, a textarea 20px corners. Focus is an ink border
  and a lime ring.
- **Tabs** `.tabs` / `.tab` / `.tab-active`: pills, the open one lime.
  **Segmented** `.segmented` / `.segment`: a grey pill track, the chosen
  segment white.
- **Island** `.island`: a white block with 28px corners. **Panel** `.panel`:
  a ruled 20px box inside an island. **Notice** `.notice`: a ruled white box,
  the orange carried by its icon.
- **Rows** `.row`, `.row-selected` (pale lime), `.day-head`, `.ledger`: as v4.
- **Chip** `.chip` via `StatusChip`: a soft pill, icon plus word.
- **HourBars** (`components/home/`): today hour by hour, the busiest hour in
  black; small on a figure tile, large with labels and a "Now" line.
- `PageHeader`, `EmptyState`, `LoadError`, `SaveBar`, `InfoTip`,
  `SettingsGroup`, `.popover`: as v4, in the new shapes.

## The shell

```
 canvas #ECECE8
┌──────────────┐  ┌──────────────────────────────────────────────────┐
│ [h] Lakeview │  │ Inbox                                            │
│  ● Agent live│  │ (Orders 2) (Messages)          [search........]  │
│ ┌────┐┌────┐ │  │                                                  │
│ │▤ 4 ││✉ 2 │ │  │ Today ─────────────────────────────────────────  │
│ └────┘└────┘ │  │  rows with hairlines                             │
│ ┌──────────┐ │  │                                                  │
│ │◌       2 │ │  │              one white island                    │
│ └──────────┘ │  │                                                  │
│ (⌂ Home    ) │  │                                                  │
│  ▤ Inbox   1 │  │                                                  │
│  ...         │  │                                                  │
│ [Try agent]  │  │                                                  │
│ (D) demo@  ⇕ │  │                                                  │
└──────────────┘  └──────────────────────────────────────────────────┘
```

- `App.vue`: the canvas, 12px around and between. The sidebar (288px, folds
  to 76px icons) is black with 28px corners. Each page lays out its own
  white islands on the canvas under `PageHeader` (title on the canvas, tabs
  on a white pill track). Settings-like pages (Channels, Team, Account,
  Knowledge, Calls, Admin) are one island.
- The sidebar: the mark on a lime tile, the business name and live status,
  the count tiles (hidden when folded), the grouped nav (active item a lime
  pill with a filled icon; counts in dark pills, orange when someone waits),
  "Try your agent" as a dark pill with a lime icon, the account row.
- Under 768px: a floating black pill tab bar (Home, Inbox, Chats, Agent,
  More, the open one lime); More opens the sidebar as a drawer.

### Where settings live

As v4: the agent's settings under "Settings" in the sidebar, the person's
under **Your account** behind the avatar, the business's (team) on its own
page. Language stays one click away in the account menu.

## Home

On the canvas, no `PageHeader`: the greeting (40px, 800) and today's date.
Then a bento:

- The setup guide across the top while anything is left (rounded grey steps,
  the next one's number on lime, its button the primary).
- Left: **Needs you** (hand-offs first, with a black call button when the
  customer left a phone; then new records with code, line, chip, time and
  amount), and **Today by hour** under it (conversations per hour, the
  busiest black, a dashed "Now").
- Right: **Your agent** on lime (live state, channels as white pills, "Ask
  your agent something" opening the test chat, copy the chat link, edit
  settings), then two figure tiles: lilac leads with the money taken today
  (or the first job's count), white with today's conversations, each with
  its hours underneath. The other jobs' counts follow in one line.

## Inbox and Conversations

The title and line on the canvas, the switch (jobs, or All / Needs a person) as pills on a white track to the right.
A waiting hand-off shows as a white strip with an orange icon above the
Inbox. Then three islands:

- **The list** (20rem, 24rem from 1536px): search in a grey pill at the top,
  rows as rounded cards grouped under Today / Yesterday (no hairlines between
  them), the selected one pale lime.
- **The detail**: an Inbox record as a receipt (kind and serial, name, the
  green proof box, the lines with dotted leaders, a big total); a
  conversation as its transcript (customer bubbles grey on the left, the
  agent's pale lime on the right, a hand-off as an orange strip under the
  header with "Mark as handled").
- **The side** (17rem, 20rem from 1536px): who it is and a call button; for a
  record, "Next step" (the one black primary from `lib/flows.js`, the other
  legal moves quiet) and "Read the conversation"; for a conversation, what it
  produced and when.

Under 1280px the side drops under the detail; under 1024px a phone shows the
list, then one item with a way back.

## Settings and Menu

`PageHeader` on the canvas, tabs on a white pill track under it.

- **Agent settings**: the form in one island (`SettingsGroup`s ruled apart,
  the floating `SaveBar`), and from 1280px a sticky **Preview** island beside
  it: the website chat (`BubblePreview`) drawn from the open section's unsaved
  edits. A section shares them with `previewFrom` in `useAgentSection`;
  `AgentPage` merges them over the saved config. Narrower screens keep the
  preview inside the Chat bubble section only.
- **Menu** (Doctors, Products): one island. On top a grey search pill and the
  categories as pills with counts ("All 42", "Biryani 6"), then any import
  panel or linked-sheet bar, then the list as ruled rows (photo, name, tags,
  facts, price, the availability switch, edit).

## The front door (signed out)

The same world as the console: the warm grey canvas, white islands, black
for the action, lime for the signature.

- **Sign-in**: two islands on the canvas. The form in a white one (the code
  steps start with a lime icon circle); beside it a black one where an
  example conversation plays once (the customer's lines on dark tiles, the
  agent's read-back on lime) and lands as an inbox entry with the proof
  line. Labelled as an example. The row is the landing demo's `InboxRow`.
- **Customer chat** (`/chat/:key`): one quiet column at every size. A slim
  header lined up with the conversation (avatar, name, Start over icon,
  Call), then one centred line above the first message: an AI assistant
  answers any time, in Bangla, Banglish or English. No "Online" and no side
  column of facts: a chat that opens is already answering, and anything more
  stands between the customer and their question. The conversation
  (`AgentChat`, shared with the test chat sheet): a date line, then the agent's replies as plain printed text under a run
  line (avatar, name, time); "From the team" when a person answered from
  Telegram; the customer's own words in a black bubble. Typing dots
  carry the agent's status ("Checking the menu"). Products swipe in a row.
  The composer is one ruled box that grows with the text; Send turns black
  only when there is something to send; Enter sends, Shift+Enter breaks a
  line, an IME's Enter is left alone. Start over appears once there is
  something to clear. No language switch: the agent follows the customer.
- **The code steps** (verify the email, forgot password, set a new one) live
  on the sign-in page beside the same black panel. A step starts with a quiet
  Back, a lime icon circle (an envelope for the code, a lock for forgot),
  the title, and the address the code went to in ink. `CodeInput` shows the
  code as six ruled cells set as serials: one real input underneath, so paste,
  one-time-code autofill and Bangla digits all work; the sixth digit submits.
  A wrong code turns the cells red, shakes once and empties them. "Send it
  again" waits a minute, counting down. Password fields can be shown.
- **Setup** (first run): a white island on the canvas. Three numbered steps
  (done black, current lime). The kinds of agent are rounded grey rows, the
  chosen one pale lime. The last step puts the live chat beside the chat
  link and a notice listing what is still to fill in.
- **Landing** (`/`): every band an island on the canvas: white for reading,
  lime behind the demo, black for "When it needs a person" and the close
  (whose button is lime). The headline is the one place type goes large.
  - **Proof is the product.** `LandingDemo` plays the mechanism: the customer
    asks, the agent reads it back with the total (and a caption saying where
    the number came from), the customer says yes, a green "Confirmed by the
    customer" seal thuds down beside the yes, and only then does the order
    leave the chat as a white ticket (initials, name, amount) that arcs over
    to the inbox and lands there, lit in pale lime for a beat. A segmented
    control switches restaurant, clinic, online shop (the customer sends a
    photo first) and front office; on a phone the track scrolls sideways.
    Labelled with `ExampleTag`, as every example on the page is (one info
    icon and "An example, not real customers", the same everywhere). Under
    reduced motion it shows the finished story.
  - **The opening picture** (`ChannelFlow`, in the hero island under the
    action): five channel buttons wired into a black agent tile, wired on to
    four tiles (Orders, Messages, Answered, Needs a person). A message rides
    its channel's wire as a black chip, inking the wire behind it; the agent
    ticks off what it checks ("Checking your menu", "৳900, added up from your
    prices") with a lime ring breathing while it works; the result rides out
    as a lime chip and the tile's count rolls up like an odometer (orange for
    a person). A lock sits where the wire meets Orders: grey and shut, it
    turns lime and opens only after "The customer said yes", lets the order
    through, and shuts again. It plays
    one channel after another while on screen; a tap sends that channel's
    message now. Across from 768px, top to bottom on a phone. Under reduced
    motion a tap shows the result at once.
  - **How it decides** (`PriceStamp`, beside "The AI talks. Your prices
    decide."): the split, played once when it comes into view. The customer
    asks; "HeyDesk is adding it up" while each line of a sum from the menu
    (two dishes, food, delivery, total) lights pale lime in turn; the agent's
    reply arrives with dashed blanks where the numbers go. Then each number
    lifts off the sum, rises to just above its blank, scaled up, and presses
    into it as a lime pill (a squash and a lime ring). A key says who did
    what: the model writes the words, HeyDesk works out every number. The
    sums are added up in the component from the prices, never typed in.
    Under reduced motion it shows the finished state.
  - **What it can do** (`CapabilityTour`, after "How it decides"): five rows
    (a product found from a photo, delivery and payment, a call to confirm a
    cash order, an answer from the owner's documents, a reply in Bangla,
    Banglish or English), each with a small example (`CapabilityScene`). On a
    wide screen the example sits sticky beside the list and changes as a row
    crosses the middle of the screen; the open row's marker is lime and a
    black rail fills to it. On a phone each row carries its own example,
    full width. In the language example the two bubbles stay put and their
    words scramble into the next language, settling left to right out of
    letters from both scripts (split into graphemes, so a Bangla letter keeps
    its vowel sign).
  - **When it needs a person** (black): the heading and text, then the
    owner's phone (a plain black frame round a light screen) beside the
    customer's chat, both on one clock. The customer asks, the agent
    promises a call, then at the same beat the chat's notice pulses orange
    and a Telegram alert drops into the phone as it buzzes; the owner's reply
    goes out in Telegram blue ("Sent to their chat") and arrives in the
    customer's chat from the phone's side under "From the team".
  - **Setup** (`SetupLive`): the five steps as rows (the open one on a grey
    row with its number on lime and a line filling until it moves on, done
    ones black with a check) beside the agent they build: a card that
    collects what the agent knows as pills (kind, hours, dishes, tried,
    shared) and turns from "Setting up" to "Live", over what the open step
    is doing (the restaurant kind picked, the details typed in, the dishes
    arriving, a test question answered, the link copied and WhatsApp
    connected). A step can be picked to play it alone. Above the card a
    small ring fills towards five minutes as a clock counts up what each
    step takes a real owner (4:22 at the end), and each fact pill flies from
    its step's number into the card.
  - **The close** (black): the promise and the lime action beside
    `NightShift`, a dark tile run by the scroll. As it comes up the screen
    its clock turns from 9 PM to 3 AM, a lime line fills, and what the agent
    handled appears at its time (two confirmed orders on lime, an answer and
    a message on dark): you are asleep, your agent is not. Under reduced
    motion the whole night shows.
  - Sections are rows with rules, never feature cards. A number marks a step
    only where the order means something (setup).
  - No testimonials, logos or statistics until real ones exist.

Landing motion (every piece explains something, all of it off under
`prefers-reduced-motion`):

- **Demo, the main moment.** The read-back streams in word by word with a
  black caret, like the real agent; the "new" count bumps when the order
  lands. The demo cycles restaurant, clinic, front office on its own, with a
  2px black line filling under the active tab to show when it moves on. It
  plays only while on screen, and stops cycling once the visitor picks a tab
  or presses Play again.
- **Opening** settles in once (headline, line, action, demo, 0.1s apart, 14px
  up with a 4px blur clearing).
- **Scroll moments** use `v-reveal` (`src/directives/reveal.js`): lists arrive
  row by row. The hand-off plays in the order it happens (the ask, the agent's
  promise, the owner's alert with one orange pulse as the phone buzzes, the
  owner's reply from Telegram arriving from the phone's side). Content below the fold is the only thing ever hidden first.
- **The capability examples** each act out their one idea: a line passes
  over the photo before the match appears; the address's delivery area turns
  pale lime and the total adds up; the call goes queued, ringing (rings
  going out), on the call (moving bars), confirmed; the policy lines the
  answer came from fill pale lime; the language switch cycles on its own
  until clicked. One example gives way to the next with a short blur.
- Every loop (the opening picture, the demo, the setup walk-through, the language switch) runs only
  while it is on screen.
- The header's rule appears only once the page scrolls.

## Signature details

1. **The logo, an h that speaks**: a heavy lowercase h whose foot is a speech
   bubble's tail and whose counter is the open front of a desk. Black h on a
   lime tile for the app icon and favicon; black mark and wordmark on white.
   The files are in `public/brand/`. The customer chat carries the business's
   name, not ours.
2. **The count tiles** at the top of the sidebar: what waits, per list.
3. **The lime agent tile** on Home, with the test chat one tap away.
4. **Setup guide** of five outcome-worded steps, only the ones left.
5. **Status is always an icon plus a word.**
6. **Proof line on every record**: "Read back to the customer and confirmed in
   chat", because the AI never invents an order.

## Motion

150-250ms, exponential ease-out (`--ease-settle`). The sidebar folds in 200ms;
sheets and the drawer slide 24px; the save bar rises in; the sign-in example
plays once; a chat message settles 6px up as it arrives. Everything is off
under `prefers-reduced-motion`.

## Copy

Friendly, direct, short sentences. Outcome words ("Add your doctors", "Share it
with customers"), never system words ("Configure workspace"). Controls name
their action. Help lives behind an `InfoTip`, not in paragraphs. Errors are
the backend's own sentence. No em-dashes, no emoji, no ALL CAPS, no labels
above headings.
