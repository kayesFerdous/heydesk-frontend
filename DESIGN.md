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

v5.2 (5 Nov 2026) is a calmer pass, nothing new in the palette or the type: each
screen has one loud thing. A customer waiting shows once per screen, not three
times. Home splits into a column to act and a column to know. On a wide screen Home fits the window: the columns share its height and a long "Needs you" list scrolls inside its island, so the page itself never scrolls. Settings lost its
identity island, so the form starts higher. What a row can do shows when you
reach for it. The idea comes from Linear's 2026 refresh: what only helps you find
your way steps back, and structure is felt rather than drawn.

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
- **Islands, not sheets.** Home lays white islands (16px corners, a hairline, no shadow)
  straight on the canvas. Every other page sits in one white island beside
  the sidebar.
- **Lime is selection only**: the open page in the sidebar and the tab bar,
  the chosen tab or filter, a selected row (pale lime), the agent's live dot
  on Home. It is a mark, never a slab, and never a button colour on white.
- **One black primary per screen.** On a black surface the primary is lime
  (`.btn-lime`).
- **Lists stay rows** with hairlines, grouped Today / Yesterday, inside an
  island. Home's "Needs you" too.
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

Concentric: **islands 16px** (`--radius-panel`), **things inside them 12px**
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
- **Island** `.island`: a white block with 16px corners and a hairline. **Panel** `.panel`:
  a ruled 12px box inside an island. **Notice** `.notice`: a ruled white box,
  the orange carried by its icon.
- **Rows** `.row`, `.row-selected` (pale lime), `.day-head`, `.ledger`: as v4.
- **Check** `.check`: a native checkbox in ink, for picking rows. The checkboxes
  show only after a Select button; picked rows turn pale lime and a lime bar
  above the list holds the one action for all of them and Done (Products:
  Delete, confirmed in the bar; Esc leaves).
- **Chip** `.chip` via `StatusChip`: a soft pill, icon plus word.
- **WeekBars** (`components/home/`): the last seven days under the figure that
  leads Home, one bar a day, today in black and the others in `line-strong`, a
  bar's figure on hover or focus. It stays away until the week has something in it.
- **EmptyState**: in the middle of whatever holds it, the icon on a grey circle,
  so an empty page reads as resting. An island that holds one becomes a column so
  it can fill it.
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
  Documents, Calls, Admin) are one island; Channels has its own layout (below).
- The sidebar: the mark on a lime tile, the business name and live status,
  an orange "Needs a person" strip while someone waits (hidden when folded,
  where the count sits on the Chats icon), the grouped nav (the open
  item a quiet fill with its filled icon in lime; counts in dark pills: the
  strip above is the one orange, and only folded does the Chats count turn orange),
  "Try your assistant" as a dark pill with a lime icon, the account row.
  The nav has three labelled groups from `navGroups`: Daily work, Your
  business (the lists, a shop's Coupons) and Setup (Assistant, Documents,
  Channels, Team, Plan and payment, each its own row, always shown). A
  moderator has no Setup.
- Under 768px: a floating black pill tab bar (the "Daily work" group, then
  More, the open one lime); More opens the sidebar as a drawer.

### Where settings live

As v4: the agent's settings under "Settings" in the sidebar, the person's
under **Your account** behind the avatar, the business's (team) on its own
page. Language stays one click away in the account menu.

## Home

On the canvas, no `PageHeader`: the greeting (40px, 600) and today's date. Then
one column to act and one to know:

- The setup guide across the top while anything is left: only the next step in
  full (a grey row, its number on lime, its button the primary), each one after
  it one quiet line.
- Left, two thirds wide: **Needs you** with how many beside the title (hand-offs
  first, with a black call button when the customer left a phone; then new
  records with code and line) as ruled rows. No status chip, everything in it is
  new: with a mouse each row's next step shows on hover or focus and the amount
  (or time) closes the row after it; a tablet sees the step always; a phone keeps
  the amount and the step is one tap away, in the record.
- Right: **Today so far** in one island: one figure leads (the money taken today,
  else the first job's count) in 32px at 500, in soft ink while it is nothing,
  `WeekBars` under it, then the rest ruled like a receipt (chats, the other jobs,
  what the assistant answered, what went to the team); one with nothing yet says
  "None yet" in soft ink. Under it **the assistant as a card of its own** (its
  initials on a black tile in lime, "Live on 2 channels", the ask box as a pill
  opening the test chat, channels as pills, copy the chat link and edit settings
  as quiet links).

## Inbox and Chats

**Chats** (v8, denser): one ruled island, three panes edge to edge.
The list (21rem, 20rem at xl, 23rem from 1536px) has search with a funnel
icon (channel, blocked visitors), Mine / Nobody yet / Everyone as a segmented
switch once there is a team (an owner alone never sees it), All / Needs a person
/ Done as small tabs, then ruled rows under
Today / Yesterday: avatar, name, channel icon, time (orange age while
waiting), preview, then a status chip, the order code and who has it. The chat
has a compact header (name, channel and time; Call, Done, Take it in black,
and a "..." menu with assign, snooze, AI off, block), chips for what is on,
the orange hand-off strip, the transcript and a compact reply box with
Summary / Ask / Draft. The side (17rem, 20rem from 1536px) shows the buyer,
orders taken here, then assigned to, channel, started, messages. The title is
for screen readers on wide screens.

The title on the canvas, the switch (jobs, or All / Needs a person) as tabs on a
white track to the right. What the page is for lives behind the "i". On a phone,
which has no sidebar strip, a waiting hand-off is one white line with an orange
icon above the Inbox. Then three islands:

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
  headings in soft ink, no fill or rule (orders show the day's total). It reads its own width: as
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

**The chat preview shows on the How it talks and bubble sections** of Agent
settings (the name, greeting and look); the other sections use the full width.

## Settings and Menu

`PageHeader` on the canvas, tabs on a white track under it.

- **Assistant settings**: beside the title, "Answering" (or "AI off", "Paused by
  HeyDesk"), the "AI answers" switch as a pill (saved at once, orange-tinted
  while off, with a line pointing to Chats) and "Copy chat link". Under it, the
  sections on one white track,
  in setup order: Business (its details and opening hours), How it talks
  (name, welcome message, tone, hand-off, what it does), Answers (common
  questions, saved replies), Delivery and payments (accounts, courier, areas,
  cash orders, paying first), Chat bubble, Calls
  (an icon and the name, the open one lime with a filled icon, gap counts in
  orange), sticky while a long form scrolls; the tabs share the width from
  1024px and scroll sideways on a phone with the open one centred. Then, while
  anything is missing, one quiet island: how many things are left and each as a
  pill link to where it is fixed. Then the form island, which opens
  with the section's name and one line on what it holds; the form is
  `SettingsGroup`s ruled apart with the floating `SaveBar`, and a section
  settles in with a short fade. From 1280px a sticky **Preview** island
  (`BubblePreview`) sits beside the How it talks and bubble sections, drawn from
  their unsaved edits (`previewFrom` in `useAgentSection`, merged over the
  saved config in `AgentPage`); narrower, the bubble section keeps it inline.
- **Menu** (Doctors, Products): one island. On top a grey search pill and the
  categories as pills with counts ("All 42", "Biryani 6"), then any import
  panel or linked-sheet bar, then the list as ruled rows (photo, name, tags,
  facts, price, the availability switch, edit; a shop's also open and copy its
  page, which show on hover or focus with a mouse and always on touch). Edit and Add open the form in a sheet from the right (`ItemEditor`), the
  row marked meanwhile: photos first, then sections, Save always at the bottom;
  closing with changes asks first. Full screen on a phone.

- **Plan and payment**: two islands. **Your plan** is one compact row: the
  plan's name with a green "until" chip (red "Ended"), then, ruled off, the
  replies used over a black meter (red from 80%), what a reply is behind the "i".
  **Choose a plan** is laid out like the website's pricing: Monthly / Yearly
  (and Card / bKash when both are set up) beside the title, then three floating
  cards stepping up to the right (stacked on a phone). Each card: the plan's
  name in soft ink, the price large, the other way of paying, the button,
  checked lines (what differs, then what every plan shares), and closing the
  card under a hairline what 100 replies cost there. On a wide screen the island
  takes the rest of the window and the cards sit in its middle, bottoms lined
  up; their padding, gaps, steps and price follow the window's height
  (`vh`, clamped), and a window 720px tall or less flattens the steps and
  tightens the islands. How upgrading is charged sits behind the "i". Growth is the dark
  card, lit by a soft lime glow from its top corner, with "Most popular" in
  pastel gradient text and a white button; the light cards fade from the wash
  to white (this page's gradients are the console's only ones). The page fits
  any landscape window from 1024x640 up without scrolling or bare canvas; the plan you are on has an ink border and a pale lime
  "Your plan" chip and a Renew button.
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
- **Landing** (`/`, restructured 4 Nov 2026): one offer told in order: the
  promise, the problem, one message followed from the customer to the owner, what
  that changes, then what it takes to start. Same customers throughout: the
  night's messages are the orders further down. Bands that do not reach the edges
  are 32px round. Every example says it is one (`ExampleTag`). No testimonials,
  logos or statistics until real ones exist. The one place lime may be a whole
  field is the close, with the black action on it.
  - **Nothing is a picture and nothing is scaled.** What looks like the console
    is plain HTML at its real size, simplified on purpose so a visitor gets the
    idea without learning the dashboard. No screenshots, no tilt and no
    `transform: scale` on anything holding words: the owner rejected those as
    blurry.
  - **Header**: a plain bar, the section you are in lime. It steps aside on the
    way down and comes back on the way up.
  - **The promise** (canvas, centred): the headline on two lines, the line, the
    black action with "no card" under it; below, `HeroConsole` running while on
    screen: a customer's message appears beside the console, is answered, flies in
    and lands as an order lit lime, the takings roll up, and the owner's phone
    hears. Then the channels it answers on.
  - **The problem** (`NightStory`, black): a tall section whose contents pin, so
    the scroll runs a clock from 9 PM to 8:05 AM. A white phone fills with
    customers' messages at their own times, none answered, and the unread count
    climbs; the last message is the customer who went elsewhere, in orange.
  - **The turn** (`ScrollWords`, white, sliding up over the black): one
    paragraph whose words light as it rises, the promises marked in lime.
  - **How it works** (`OneOrder`, `#how`): Sabbir's message from the night, followed
    through three lanes on one pinned screen: the customer's phone, HeyDesk's three
    jobs on black (checks the list, works out the total, waits for a yes), the
    owner's inbox. The scroll runs the story and rewinds it; four bars and one big
    sentence say which step it is, and something visibly travels between lanes. A
    phone shows one lane at a time.
  - **What changes** (`Perk*`, cards of different weights): the three languages
    through the night on black, the orange strip and the owner taking the chat on
    white, and "8:05 AM" on pale lime, where the list slides in, the takings roll
    up and the hours grow.
  - **Try it** (`AskTry`, `#try`): the one live thing. Pick a question in
    Banglish, Bangla or English and the answer comes back in that language, from
    the example shop's real prices. Written answers, and it says it is an
    example; a request for a person ends in the orange chip.
  - **Setup**: three outcome-worded steps beside `SetupHub`: the four channels
    wire up to the assistant one at a time, then messages run the wires.
  - **Price** (`#price`): plans as rows, the free trial in black. The figures
    are copied from the backend's `PLANS`.
  - **Questions**: native `<details>` rows, the fears an owner has first.
  - **The close** (lime): "Tonight, someone will ask your price." and the black
    action. **Footer** (black): the line, the links, and "heydesk" in lime across
    the full width, its letters rising as the page ends.

Landing motion. Each piece had to pass one test: it explains something, or it
shows where something went. The old marquee, magnetic buttons, pointer-lit dots,
leaning card, progress line and sideways rail did not, and went.

- Scroll-run pieces (the night, how it works, the paragraph, the footer) read
  `useScrollProgress`. Under reduced motion it is 1 at once, so every story shows
  its end and nothing pins.
- Timed pieces (the hero, the perks, the setup hub) run on `useSceneClock`, only
  while on screen, and under reduced motion show their last step. Digits roll
  (`RollingNumber`) on `--ease-settle`.
- Headings rise word by word (`SplitWords`), the rest of a section settles in
  once (`v-reveal`, 16px, staggered 60-70ms).
- Press feedback on the main actions and the question pills (scale 0.97).
- Long motion is kept for this page: the console stays at 150-250ms.

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
their action. The words are for a non-technical seller: "assistant" not
"agent", Documents, Chats, Upload (PRODUCT.md, Brand and tone, has the list and
the Bangla rules). Help lives behind an `InfoTip`, not in paragraphs. Errors are
the backend's own sentence. No em-dashes, no emoji, no ALL CAPS, no labels
above headings.
