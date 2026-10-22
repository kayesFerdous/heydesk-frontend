# Image prompts for the HeyDesk redesign (round 2: pick a direction)

Round 1 (soft grey, cobalt, a design board) came out like a UI kit and was
dropped. Round 2 skips the board: three **Home screens in three different
directions**, each prompt self-contained. Pick one, then the other screens
get written in that direction, using the chosen image as the anchor.

All three use the same demo data (Spice Garden, a restaurant in Dhaka, ৳) and
only show things the API already has: counts per job from `GET /inbox`,
records, conversations with hand-offs, the agent's channels and chat link.

## How to use them

1. New ChatGPT chat per direction, image generation on, **wide 16:9**.
2. Paste the prompt. Regenerate once or twice; keep the best.
3. Too busy? Reply: "Same screen, simpler: fewer elements, larger text, more
   space." If ৳ renders wrong: "Use 'Tk' in front of the numbers instead."
4. Send back the one you like (or "A's colours with B's layout").

## What every result must still respect

- Words on navigation, not icons alone (the owner is not technical).
- One filled primary action per screen.
- A customer waiting for a person always stands out in a warm orange.
- Sentence case, no emoji, no invented "+12%" figures, no stock-photo faces
  (customers are initials; we have no photos of them).

---

## A. Ink and lime

The closest to the CRM reference: a black panel on the left that holds the
navigation and the counts, a light warm work area, lime as the signature.

```
A wide 16:9 flat UI screenshot of a web app dashboard called HeyDesk, an AI front desk for a restaurant, at 1440x900, straight-on, no device frame, no perspective.

Background: a light warm grey #ECECE8 filling the window.

Left: a tall black panel #111111, 300px wide, floating with a 12px margin and 28px rounded corners. At its top the logo: a bold lime #D4F36B rounded square with a black lowercase "h" whose foot curls into a speech-bubble tail, beside "HeyDesk" in white. Under it a 2x2 grid of dark charcoal tiles #1E1E1E with 20px corners, each with a small outlined icon top left and a big white number bottom right: "New orders 4", "Bookings 1", "Messages 2", and "Needs a person 2" whose number is orange #FF8A3D. Then a navigation list in white text with thin line icons: Home (active: a lime pill with black text), Inbox, Conversations, Menu, Settings, Knowledge, Channels, Team. At the bottom, a round initials avatar "R" and "Rahim, owner".

Work area, top: "Good evening, Rahim" in a geometric rounded sans-serif (like Gilroy or Outfit), 40px, semibold, black; below it "Wednesday, 22 October" in grey. Top right: a white pill search field "Search orders and customers", a round white bell button, a white pill with avatar and "Spice Garden".

Content, white cards with 28px corners and no shadows, 14px gaps:
- Left, large card "Needs you": a list of rounded rows, each a light grey inner card #F5F5F2 with a round pastel initials avatar, a name, a short grey line and a small chip. First row "Nusrat Jahan, asked for a person about catering for 60" with an orange chip "Needs a person" and a small black round phone button. Then "Tanvir Hossain, order A-118, 3 items, ৳930" with a chip "New"; "Sadia Karim, table for 4 at 8:00 pm" with "New"; "Imran Ali, A-117, ৳640" with a mint chip "Ready". A small round arrow button top right of the card.
- Right column, stacked:
  - A lime #D4F36B card "Your agent" with a black dot and "Live", three small white pills "Web chat", "Messenger", "Telegram", and a white pill input "Ask your agent something" with a black round send button.
  - Two cards side by side: a lilac #CDB8FF card "Taken today" with a large "৳18,450" and slim black bars by hour; a white card "Conversations" with a large "46".
- Bottom, full width under "Needs you": a white card "Today by hour", a simple column chart from 10:00 to 23:00 with rounded light grey bars and the busiest hour in black, a thin vertical line marked "Now".

One solid black pill button "Open inbox" is the only filled button. Thin 1.5px line icons, generous whitespace, sentence case, no gradients, no glass, no emoji, crisp correctly spelled text.
```

---

## B. Pastel desk

The closest to the learning-plan reference: a black top bar with a notch
into a light sheet, cards tinted by kind of entry, playful but ordered.

```
A wide 16:9 flat UI screenshot of a web app dashboard called HeyDesk, an AI front desk for a restaurant, at 1440x900, straight-on, no device frame, no perspective.

The window has a black top bar #0E0E0E with 32px rounded outer corners. In it: left, "HeyDesk" in white bold geometric type with a small rounded logo mark; centre, the navigation: a white-on-black active item "Home" with an icon, then items with icons and small labels: Inbox (a tiny count "4"), Conversations (a tiny orange count "2"), Menu, Agent, Team; right, a round initials avatar "R" with "Rahim" and "Spice Garden" in two lines and a chevron. Under the active "Home", the light sheet below rises into the bar with a smooth rounded notch.

The sheet below is a very light warm grey #F4F4F1 with 32px corners. Left part, about 68% wide:
- Title "Today at Spice Garden" 40px semibold geometric sans, black. To its right a soft grey pill search "Search orders and customers".
- A row of three rounded tiles, 24px corners: a pale sky blue #D6F0FA tile "46" with "Conversations"; a pale mint #CFF5D6 tile "12" with "Orders"; a white tile with a dashed grey outline "৳18,450" with "Taken today".
- Below, a two-column grid of white cards with 28px corners, each an entry waiting for the owner: a small kind label with icon at top ("Order A-118", "Booking", "Message"), a bold title ("Tanvir Hossain", "Sadia Karim", "Nusrat Jahan"), one grey line ("3 items, pickup 8:15 pm, ৳930", "Table for 4, 8:00 pm", "Catering for 60 on Friday"), a rounded chip at bottom left ("New", "New", orange "Needs a person"), and at bottom right a small group of round buttons: a grey "more" button and a black round check button (the next step). A small round pastel icon badge on each card's top right corner.

Right part, about 32%, a slightly darker grey panel #ECECE8 titled "Coming up" 32px semibold, with stacked pastel cards, 24px corners, each with a small icon, kind and time on top and a white inner box with one line: lilac #E8D5FF "Booking, 8:00 pm" "Sadia Karim, table for 4"; butter #FCEBB0 "Pickup, 8:15 pm" "A-118, Tanvir Hossain"; peach #FFD9C2 "Call back" "Nusrat Jahan, 01811-223344"; and a dashed empty slot at the bottom.

Floating at the bottom centre over the sheet, a black pill dock with 12px padding holding a white pill input "Ask your agent something" and a lime #D4F36B round send button, and a small green dot with "Agent live".

Thin 1.5px line icons, generous whitespace, soft and friendly, sentence case, no gradients, no glass, no emoji, crisp correctly spelled text.
```

---

## C. Night shift

A dark console with bright tiles, for owners who keep it open all evening.
Different from LazyChat's dark purple: near-black with butter, lilac and
lime tiles instead.

```
A wide 16:9 flat UI screenshot of a web app dashboard called HeyDesk, an AI front desk for a restaurant, at 1440x900, straight-on, no device frame, no perspective, dark theme.

Background near-black #0D0D0F. Left sidebar #141417, 240px, ruled off by a thin line: at the top a butter yellow #F6C760 rounded logo mark and "HeyDesk" in white; nav items with thin line icons in soft grey: Home (active: butter yellow icon and text), Inbox with a small count "4", Conversations with an orange count "2", Menu, Settings, Knowledge, Channels, Team. At the bottom a lilac card with 20px corners: "Try your agent" and a small black pill button "Open chat".

Top bar: "Hello, Rahim" in white 22px and "Spice Garden is answering customers" in grey; right, round dark buttons for search and bell, a round initials avatar.

Content, cards with 24px corners:
- A row of three bright tiles: butter #F6C760 "New orders (4)" with "৳3,420 waiting" big and a small black round arrow; lilac #A98BF5 "Bookings (1)" with "8:00 pm, table for 4"; lime #D4F36B "Messages (2)" with "1 needs a person". Black text on the tiles.
- Below left, a dark card #18181C "Today by hour": a smooth line chart with two lines, lilac "Conversations" and butter "Orders", from 10:00 to 23:00, a highlighted marker with a small pill label "19:00, 11".
- Below right, a dark column of stacked entry cards #18181C, each with a title in white, a small coloured kind chip, a grey line and a small action pill on the right: "Nusrat Jahan" orange chip "Needs a person", "Catering for 60 on Friday", pill "Call back"; "Tanvir Hossain" chip "Order A-118", "3 items, ৳930", pill "Mark as ready" in butter (the only filled button); "Sadia Karim" chip "Booking", "Table for 4, 8:00 pm", outlined pill "Mark handled"; "Imran Ali" chip "Order A-117", "Ready, ৳640", grey pill "Collected".

Thin line icons, clean geometric sans-serif, sentence case, no gradients, no glow, no glass, no emoji, crisp correctly spelled text.
```
