# HeyDesk design system (v5: "Ink and lime")

Product truth is in [PRODUCT.md](PRODUCT.md). Where code goes is in
[docs/architecture.md](docs/architecture.md). This file says how it looks and
why. The tokens live in `src/assets/main.css` (`@theme`); this file and that
block must agree.

v5.1 (24 Oct 2026) keeps ink and lime but finishes it: a lighter paper canvas,
a hairline round every island, soft 10px controls instead of pills, and
headings at 600 instead of 800 (studied against Revora, Fin and Zendesk, which
all keep one loud colour small, set headings light and round controls a
little). Its second step took lime off the slabs: the sidebar's count tiles
went (the nav counts say the same), the open page became a quiet fill with a
lime icon, and Home puts "Needs you" first and widest, with today's figures
ruled under it and a white agent island beside it.

v5 (22 Oct 2026) replaced v4 ("Passbook", cobalt rules on white paper). The
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
  with round corners. Its counts sit beside their pages; a customer waiting
  for a person also gets an orange strip at the top, only while they wait.
- **Islands, not sheets.** Home lays white islands (20px corners, a hairline, no shadow)
  straight on the canvas. Every other page sits in one white island beside
  the sidebar.
- **Lime is selection only**: the open page in the sidebar and the tab bar,
  the chosen tab or filter, a selected row (pale lime), the agent's live dot
  on Home. It is a mark, never a slab, and never a button colour on white.
- **One black primary per screen.** On a black surface the primary is lime
  (`.btn-lime`).
- **Lists stay rows** with hairlines, grouped Today / Yesterday, inside an
  island. Home's "Needs you" uses rounded grey rows instead, because it is a
  short list of things to act on, not a ledger.
- **Codes are serials** (A-104, M-42) in a mono face. Nothing else is.

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#F4F3EF` | Behind everything: the app's background, Home's canvas |
| `--color-surface` | `#FFFFFF` | Islands, fields, popovers |
| `--color-wash` / `--color-sidebar` | `#F5F5F2` | Rows inside an island (Home's "Needs you", setup steps), detail panes, paper bands |
| `--color-hover` | `#EBEBE6` | Hover, counts, skeletons, the segmented track, quiet bars |
| `--color-hairline` | `#E7E7E2` | Rules between rows and around panels |
| `--color-line-strong` | `#D4D4CC` | Input and secondary button borders, day headings |
| `--color-ink` | `#111111` | Text |
| `--color-ink-soft` | `#5C5C56` | Secondary text |
| `--color-ink-faint` | `#9B9B93` | Icons only, never text |
| `--color-brand` | `#111111` | The primary button and links (the token keeps its old name) |
| `--color-brand-tint` | `#F0F8D2` | Pale lime: a selected row, the "New" chip |
| `--color-lime` (`--color-brand-tint-strong`) | `#D4F36B` | You are here: the open page's icon, chosen tab, the live dot, focus ring |
| `--color-tint-lilac / -sky / -sand` | pastels | Avatar tints, decoration only |
| `--color-night` / `-night-tile` / `-night-soft` | `#141413` / `#1E1E1C` / `#A3A39B` | The sidebar, its tiles, its quiet text |
| `--color-success` / `-tint` | `#17804C` / `#DCF5E6` | Live, confirmed, ready |
| `--color-attention` / `-tint` / `-bright` | `#B54708` / `#FFE6D1` / `#FF8A3D` | "Needs a person"; bright is for counts on black |
| `--color-danger` / `-tint` | `#C22B2B` / `#FDE8E8` | Destructive actions and failed saves |

Green, orange and red stay states, never decoration, so avatars use the
pastel tints only. Orange is the one warm colour, so a waiting customer is
what the eye finds first. No gradients, no glass.

## Type

**Gabarito** 400 to 600 for everything (headings stop at 600: at 800 it reads as a toy) (geometric, chunky and friendly, with
tabular figures; the detector flags Plus Jakarta Sans and Geist as overused), **IBM Plex Mono** 500 for serials only. Bangla falls back to
**Noto Sans Bengali** with normal tracking and taller lines (`:lang(bn)`).

| Role | Size / weight |
|---|---|
| Home greeting | 32-40px / 600, -0.025em |
| Page title (`PageHeader`) | 28px / 600, -0.025em |
| Island title | 20px / 700 |
| Big figures | 28-36px / 600 |
| Body and controls | 14-15px / 400-700 |
| Hints, meta, chips | 12-13px / 500-600 |

## Shape and elevation

Concentric: **islands 20px** (`--radius-panel`), **things inside them 12px**
(`--radius-card`: rows, panels, popovers, textareas), **small boxes inside
those 8px** (`--radius-thumb`: photos, tooltips, a ruled list in a panel),
**controls 10px** (`--radius-control`: buttons, fields, tabs, nav items; a
track round tabs 14px), **chips, counts and avatars a full pill**
(`--radius-stamp`). Islands carry a hairline and no shadow; only
things over the page (menus, the drawer, sheets, the phone tab bar, tooltips)
get `--shadow-float`.

## Components (classes in `main.css`, components in `src/components/ui/`)

- **Buttons** `.btn` (44px, 10px corners) + `.btn-primary` (black) `| -secondary`
  (white, ruled) `| -quiet | -danger | -lime` (the primary on black),
  `.btn-sm`, `.btn-icon` (round).
- **Fields** `.field`: 10px corners, a textarea 12px. Focus is an ink border
  and a lime ring.
- **Tabs** `.tabs` / `.tab` / `.tab-active`: 10px corners, the open one lime.
  **Segmented** `.segmented` / `.segment`: a grey 10px track, the chosen
  segment white.
- **Island** `.island`: a white block with 20px corners and a hairline. **Panel** `.panel`:
  a ruled 12px box inside an island. **Notice** `.notice`: a ruled white box,
  the orange carried by its icon.
- **Rows** `.row`, `.row-selected` (pale lime), `.day-head`, `.ledger`: as v4.
- **Chip** `.chip` via `StatusChip`: a soft pill, icon plus word.
- **HourBars** (`components/home/`): today hour by hour, the busiest hour in
  black, under a figure on Home once that figure is above zero.
- `PageHeader`, `EmptyState`, `LoadError`, `SaveBar`, `InfoTip`,
  `SettingsGroup`, `.popover`: as v4, in the new shapes.

## The shell

```
 canvas #F4F3EF
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
  to 76px icons) is black with 20px corners. Each page lays out its own
  white islands on the canvas under `PageHeader` (title on the canvas, tabs
  on a white track). Settings-like pages (Team, Account,
  Knowledge, Calls, Admin) are one island; Channels has its own layout (below).
- The sidebar: the mark on a lime tile, the business name and live status,
  an orange "Needs a person" strip while someone waits (hidden when folded,
  where the count sits on the Conversations icon), the grouped nav (the open
  item a quiet fill with its filled icon in lime; counts in dark pills,
  orange when someone waits),
  "Try your agent" as a dark pill with a lime icon, the account row.
  The nav has three labelled groups from `navGroups`: Your desk, Your
  business (the lists, a shop's Coupons) and Setup, one Settings row that
  folds open to Agent, Knowledge, Channels, Team and Billing on a guide line
  (words only; the open page white with a 2px lime mark on the line). It
  opens by itself on one of its pages and stays as the owner leaves it
  (`aria-expanded`). Folded to icons, Settings opens Agent. A moderator has
  no Setup.
- Under 768px: a floating black pill tab bar (the "Your desk" group, then
  More, the open one lime); More opens the sidebar as a drawer.

### Where settings live

As v4: the agent's settings under "Settings" in the sidebar, the person's
under **Your account** behind the avatar, the business's (team) on its own
page. Language stays one click away in the account menu.

## Home

On the canvas, no `PageHeader`: the greeting (40px, 600) and today's date.
Then a bento:

- The setup guide across the top while anything is left (rounded grey steps,
  the next one's number on lime, its button the primary).
- Left, two thirds wide: **Needs you** (hand-offs first, with a black call
  button when the customer left a phone; then new records with code and
  line). No status chip, everything in it is new: with a mouse each row's
  next step shows on hover or focus and the amount (or time) closes the row
  after it; a finger sees the step always. Under it **today** in one island:
  one figure leads (the money taken today, else the first job's count) in
  40px at 500 with its hours (`HourBars`) under it, beside the small figures
  two to a row (conversations, the other jobs); one with nothing yet says
  "None yet" in soft ink instead of a bold 0.
- Right: **the agent as a card of its own** (its initials on a black tile in
  lime, "Live on 2 channels", the ask box as a pill opening the test chat,
  channels as pills, copy the chat link and edit settings as quiet links),
  and under it **Today so far** ruling what the agent answered and what went
  to the team.

## Inbox and Conversations

**Conversations** (v8, denser): one ruled island, three panes edge to edge.
The list (21rem, 20rem at xl, 23rem from 1536px) has search with a funnel
icon (channel, blocked visitors), Mine / Unassigned / All as a segmented
switch, All / Needs a person / Done as small tabs, then ruled rows under
Today / Yesterday: avatar, name, channel icon, time (orange age while
waiting), preview, then a status chip, the order code and who has it. The chat
has a compact header (name, channel and time; Call, Done, Take it in black,
and a "..." menu with assign, snooze, AI off, block), chips for what is on,
the orange hand-off strip, the transcript and a compact reply box with
Summary / Ask / Draft. The side (17rem, 20rem from 1536px) shows the buyer,
orders taken here, then assigned to, channel, started, messages. The title is
for screen readers on wide screens.

The title and line on the canvas, the switch (jobs, or All / Needs a person) as tabs on a white track to the right.
A waiting hand-off shows as a white strip with an orange icon above the
Inbox. Then three islands:

- **The Inbox** is one island from 1024px: the list on the left, the open
  record ruled off on the right (20rem, 24rem from 1280px, 27rem from
  1536px). Search sits in the page header. At the top of the list, the status
  tabs on one line: the road a record usually takes (`pathOf` in
  `lib/flows.js`: New, then each primary step in turn) with a small caret
  between steps; then All; then **More** for the side roads (`sideStatusesOf`),
  a menu whose button turns lime and takes the status's name while one is
  picked. Only New has a count. The Inbox opens on New while something waits,
  else on All.
- **The Inbox table** (`RecordTable`): one 44px line per record, same columns
  down the page (code, customer, items, status, time, total), under sticky day
  headings on grey (orders show the day's total). It reads its own width: as
  the record takes room the items go first, then the time; code, customer and
  total stay. The status column exists only under All. The selected line is
  pale lime with an ink edge. A phone keeps the rounded rows, then one record
  with a way back.
- **The Inbox record** (v7, calmer): who and when at the top, then one row of
  actions (the next step in black, call, the conversation, the rarer moves
  under a "..." menu), the proof in one green line, then sections of one
  shape (`RecordSection`: a small label, the content, a hairline above):
  order, delivery or pickup, courier, confirmation call, details. Facts sit
  on one line with the value at the right.
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

## Channels

**Channels is one calm list.** The `PageHeader` status says how many are
connected ("2 of 4 connected"). One island holds a 3xl column of four ruled
rows (`ConnectionRow`, `components/ui/`), no box round any of them: a 40px
logo tile in the channel's colour (the website chat black), the name over one
quiet line (what it is, or once connected its link, bot or number), then
"Connected" in green with a filled check, or a secondary "Set up" while it
isn't, and a caret. The whole row opens what connects or shares it, indented
under the name; one row is open at a time (the website chat when the page
opens), so the black primary inside it is the screen's only one. Telegram's
steps show as soon as its row opens; "Not now" closes the row.

**Delivery and payments uses the same rows.** SSLCommerz and bKash under
Online payments, and a shop's courier, are `ConnectionRow`s on grey tiles with
the brand's name, one line (what it is, or the store, the account or the
courier once connected, "test mode" after it), Connected, Needs a look (a
courier that refused a booking) or Set up. A row opens straight to its form;
Cancel closes it. A shop's delivery areas are ruled rows with no box: name,
charge and days, the districts as chips under them (their label for screen
readers only), and the "paid online first" switch only once a payment account
is connected, with one line saying so until then.

**The chat preview shows on the profile and bubble sections** of Agent
settings (the name, greeting and look); the other sections use the full width.

## Settings and Menu

`PageHeader` on the canvas, tabs on a white track under it.

- **Agent settings**: under the title, the sections on one white track
  (an icon and the name, the open one lime with a filled icon, gap counts in
  orange), sticky while a long form scrolls; the tabs share the width from
  1024px and scroll sideways on a phone with the open one centred. Then the
  agent's own island: its logo or initials on a black tile, its name with
  "Answering" (or "AI off", "Paused by HeyDesk"), its kind and business; on
  the right the "AI answers" switch as a pill (saved at once, orange-tinted
  while off, with a line pointing to Conversations) and "Copy chat link".
  Under them, on a grey band, what is still missing as pill links to where
  each is fixed, or one green "Ready" line. Then the form island, which opens
  with the section's name and one line on what it holds; the form is
  `SettingsGroup`s ruled apart with the floating `SaveBar`, and a section
  settles in with a short fade. From 1280px a sticky **Preview** island
  (`BubblePreview`) sits beside the profile and bubble sections, drawn from
  their unsaved edits (`previewFrom` in `useAgentSection`, merged over the
  saved config in `AgentPage`); narrower, the bubble section keeps it inline.
- **Menu** (Doctors, Products): one island. On top a grey search pill and the
  categories as pills with counts ("All 42", "Biryani 6"), then any import
  panel or linked-sheet bar, then the list as ruled rows (photo, name, tags,
  facts, price, the availability switch, edit; a shop's also open and copy its
  page). Edit and Add open the form in a sheet from the right (`ItemEditor`), the
  row marked meanwhile: photos first, then sections, Save always at the bottom;
  closing with changes asks first. Full screen on a phone.

- **Coupons**: the codes are the page. The `PageHeader` says how many are live, with "Send an offer" (secondary) and "New coupon" (the black primary) on the right; they hide while a form is open, so the form's own button is the one black one. A form opens as one island under the header (Cancel closes it): the kind of discount as a segmented switch with the amount beside it, the optional fields marked so, and the coupon read back in one plain sentence before saving. The list is one island of ruled rows under "Live" and "Stopped working": the code as a serial chip, what it takes off over its uses and last day, a status chip (Live, Ended, Used up) and a quiet Stop or Remove that asks once in the row.

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
2. **The orange strip** at the top of the sidebar while a customer waits
   for a person.
3. **The agent island** on Home, with the test chat one tap away.
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
