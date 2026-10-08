# ChatGPT image prompts for HeyDesk (v2: "Cobalt")

Eight self-contained prompts for ChatGPT's image generation. They follow
[DESIGN.md](../DESIGN.md) (the evidence is in
[research.md](research.md)). The look is an **upgrade of Gigalogy's own identity**:
the same cobalt blue and indigo navy, the dot-network logo and the workspace
switcher, but with a navy rail instead of a blue banner and a calm white work
area. Data is the real demo agent (Spice Garden, Dhaka, ৳).

## How to use them

1. Open a **new ChatGPT chat** and choose image generation.
2. Paste **Prompt 0** (design system board). Regenerate until the palette and
   feel are right. **This is your anchor.** Download it.
3. For each screen (1 to 7), send a new message in the same chat, attach the
   Prompt 0 image, and start with this line, then paste the prompt:

   > Use the attached design system board as the exact visual language (colors, type, corner radii, button and chip styles, icon style, logo). Create this new screen in it.

4. Desktop screens (0 to 6): ask for **wide 16:9**. Prompt 7 (phone): **tall 9:16**.
5. If an image is cluttered, reply: "Same screen, simpler: fewer elements, larger
   text, more whitespace." If the taka sign ৳ renders wrong, reply: "Replace the
   taka sign with 'Tk' in front of the numbers."
6. Send me the ones you like. I build from the images, not from the words.

> Generated text is never perfect. Treat each image as a **visual reference**
> (layout, spacing, hierarchy, mood), not as copy to reproduce.

## What to check in every result (the anti-"AI dashboard" test)

- The navy rail runs the full height at the left; the white area is **edge to edge**,
  not a floating rounded card on a grey background.
- Navigation is a normal vertical list, **not** pill buttons.
- One large cobalt primary action per screen; no row of tiny grey icons.
- Text is sentence case. **No ALL CAPS** buttons or labels.
- Lists are rows with hairlines, grouped by "Today" / "Yesterday", not a grid of cards.
- Blue only on actions and selection. No purple, no gradients, no glass.

---

## Prompt 0: Design system board

```
A wide 16:9 landscape design system board for a web app called HeyDesk, the AI front desk product from the company Gigalogy, shown as a clean, flat, straight-on presentation board on a very light cool grey background (#F6F8FB), laid out in a tidy grid of labeled sections with generous space.

Top left, the HeyDesk logo: a rounded-square mark in cobalt blue #004AAC containing a speech bubble outline drawn from five small white dots joined by thin white lines, like a tiny constellation or network graph, next to the wordmark "HeyDesk" in a modern humanist sans-serif, semi-bold, sentence case.

Sections on the board. Color palette as large rounded swatches with hex codes in small text: cobalt blue #004AAC (primary), deep cobalt #003A87 (hover), pale blue tint #EAF1FB, deep indigo navy #283371, rail navy #0A1B3D, white #FFFFFF, blue-tinted ink #0E1726, slate #5B6577, hairline #E3E8EF; and four small semantic swatches, green #18874E on #E6F5EC labeled "Success", amber #8A5A0B on #FFF4DB labeled "Needs a person", red #C42B2B labeled "Delete". A type specimen in the Onest typeface: the heading "Inbox" at 28px semi-bold, a body line "What your agent took, waiting for you.", a record name "Tanvir Ahmed" in indigo navy semi-bold, and a price "৳1,030" and number "#1042" in tabular figures. A buttons row, all 44px tall with 10px corners and sentence case labels: a large solid cobalt primary button "Mark as ready" with white text, a white outlined secondary button "View chat", a quiet text button "Cancel order", and a small red outlined button "Delete dish". An input with the label "Agent name" above it, filled with "Spice Garden assistant", plus a focused input with a cobalt ring, a toggle on and off, and a search field with the hint "Search orders and customers". Status chips, fully rounded with a tiny icon and text: "New" with a clock icon in pale blue, "Ready" with a check in green tint, "Collected" in grey, "Needs a person" with a person icon in amber, plus "Chat" and "Voice" channel chips. A mini navigation sample on a deep navy rail #0A1B3D: the logo, a business switcher row "Spice Garden" with a chevron, nav items Inbox, Conversations, Menu, Your agent with thin line icons in soft white, the active item "Inbox" shown with a translucent white background, white text and a bright light-blue icon, small count badges, and at the bottom a large cobalt button "Talk to your agent". A list row sample on white with a round initials avatar "TA", the name, a one-line summary, the price and a status chip, separated by a thin hairline. A chat bubble pair, customer in light grey, agent in pale blue tint.

Style: refined enterprise calm, modern, premium and trustworthy, in the spirit of Google, Apple and OpenAI product design: flat matte surfaces, hairline borders, 14px rounded panels, 10px rounded controls, fully round chips, thin 1.5px line icons, an 8px grid, one blue brand color used only for actions and selection. Crisp correctly spelled text, sharp focus, evenly lit like a flat vector export.
```

**Why:** it locks the system first so the other seven match. Blue is Gigalogy's
real `#004AAC`; the navy rail replaces the blue banner; semantic colours are
labelled so the model does not use them decoratively.

---

## Prompt 1: Sign in

```
A wide 16:9 landscape screenshot of a web app sign-in page for HeyDesk, shown straight-on as a full browser window with no device frame and no background scene.

The page is split in two. The left 45 percent is white with generous padding. Top left, the HeyDesk logo (a cobalt rounded-square mark with a speech bubble outline made of five connected white dots) and the wordmark "HeyDesk". Vertically centered: the heading "Welcome back" in large semi-bold sans-serif, a quiet slate line "Sign in to see what your agent took today.", two stacked inputs with their labels "Email" and "Password" above them, 44px tall with 10px corners, the email filled with "farhana@spicegarden.bd" and the password shown as dots, a small link "Forgot password?" aligned right under the password, a full-width 44px solid cobalt blue #004AAC button "Sign in" with white text, and beneath it the line "New to HeyDesk? Create your business account" with the last part in cobalt.

The right 55 percent is a full-height panel in deep navy #0A1B3D with a faint network of small connected dots and thin lines spreading softly across it, echoing the Gigalogy logo constellation. In the lower part of this panel, a single large readable quote-like statement in white, "Your front desk answers every customer, even when you are busy.", and below it a small line in soft blue-grey "Orders and messages arrive in one inbox." Nothing else on the panel.

Refined enterprise calm style, flat matte surfaces, blue-tinted near-black text #0E1726, slate #5B6577, brand cobalt #004AAC, sentence case, the Onest typeface, no gradients on the white side, crisp correctly spelled text, sharp focus.
```

---

## Prompt 2: Choose what your agent does (first run)

```
A wide 16:9 landscape screenshot of a first-run setup screen in a web app called HeyDesk, shown straight-on as a full browser window, no device frame.

The screen has no sidebar. A white page with a slim top row: the HeyDesk logo mark and wordmark on the left, and on the right a quiet text link "Sign out". Centered content, about 960px wide. Above the content a thin progress line with three labeled steps "Choose", "Your details", "Try it", the first filled in cobalt blue #004AAC with a number 1 and the others in soft grey. Heading "What should your agent do?" in large semi-bold, a slate line "Pick a starting point. You can change everything later."

Three equal choice cards in a row, white with a 1px hairline border and 14px corners, each with a thin line icon inside a pale blue #EAF1FB rounded square, a title and two short lines. Card one is selected: a 2px cobalt border, a small cobalt check at the top right, icon of a fork and knife, title "Restaurant host", text "Answers menu questions and takes pickup orders." Card two: phone handset icon, "Receptionist", "Answers questions and takes messages for your team." Card three: medical cross icon, "Clinic front desk", "Answers questions about your services and takes messages."

Below the cards, aligned right, a large solid cobalt 44px button "Continue" with white text and a quiet text button "Back" on its left. On the left under the cards, a slate line "You will be live in about five minutes."

Refined enterprise calm style, flat matte surfaces, blue-tinted ink #0E1726, slate #5B6577, hairlines #E3E8EF, one cobalt brand color for actions and selection only, the Onest typeface, sentence case, thin 1.5px line icons, generous whitespace, crisp correctly spelled text, sharp focus.
```

---

## Prompt 3: Inbox (home)

```
A wide 16:9 landscape screenshot of the Inbox screen of a web app called HeyDesk, shown straight-on as a full browser window, no device frame.

Left: a full-height deep navy navigation rail #0A1B3D, 248px wide, running the entire height of the window. From the top: the HeyDesk logo mark (cobalt rounded square with a speech bubble outline made of five connected white dots) and the wordmark in white; below it a business switcher row with the text "Spice Garden" and a small chevron on a slightly lighter navy rounded row; below, a vertical list of navigation items with thin line icons in soft white: "Inbox" (active: translucent white background, white text, bright light-blue icon, a small badge "3"), "Conversations" with a small amber badge "1", "Menu", "Your agent". At the bottom of the rail a large solid cobalt button "Talk to your agent" with a microphone icon, and under it the account row with a round initials avatar "FR", the name "Farhana Rahman" and a small sign-out icon. The rail is flat, with no pill shapes.

Right: the main area is pure white, edge to edge, with no outer margin, no floating card and no rounded outer container. A header row: the title "Inbox" in 28px semi-bold with the slate line "What your agent took, waiting for you." below it, and on the far right a search field with the hint "Search orders and customers". Below, a full-width slim amber notice with pale amber background #FFF4DB and dark amber text: "1 customer is waiting for a person." with a link "Open chat" on the right. Then tabs with a cobalt underline on the selected one: "Pickup orders  2" (selected) and "Messages  1".

Below the tabs, two columns separated by a hairline. Left column (about 60 percent), a list grouped by day with small semi-bold slate group headings "Today" and "Yesterday". Rows are 60px tall with hairline dividers, no cards: a round initials avatar in a soft tint, the number "#1042" in slate, the customer name in deep indigo navy #283371 semi-bold, a slate one-line summary, and right-aligned the price in tabular figures with a status chip below it. Rows under Today: "#1042  Tanvir Ahmed  2 Chicken Biryani, Borhani  ৳1,030  New" (selected, pale blue tint background), "#1041  Nusrat Jahan  Mutton Kacchi, 2 Butter Naan  ৳670  New", "#1040  Mahin Chowdhury  Beef Rezala, Firni  ৳570  Ready". Under Yesterday: "#1039  Sadia Islam  Vegetable Khichuri  ৳220  Collected". Status chips are fully rounded with a tiny icon and text: New with a clock in pale blue, Ready with a check in green tint, Collected in grey.

Right column (about 40 percent): a full-height detail pane with a very pale cool grey #F6F8FB background and a hairline on its left edge, not a floating card. Title "Order #1042", status chip "New", the name "Tanvir Ahmed" and "+880 1712 345 678", the itemized lines "2 x Chicken Biryani  ৳900" and "1 x Borhani  ৳130", a hairline, "Total  ৳1,030" large in tabular figures, "Pickup today at 7:30 PM", a small slate line "Confirmed by the customer in chat", then a full-width 44px solid cobalt button "Mark as ready", beneath it a full-width white outlined button "View chat", and a small quiet text link "More options".

Refined enterprise calm style in the spirit of Google, Apple and OpenAI product design: flat matte surfaces, hairline borders, blue-tinted ink #0E1726, slate #5B6577, brand cobalt #004AAC only for actions and selection, the Onest typeface in sentence case, tabular figures for numbers, 14px panels, 10px controls, thin 1.5px line icons, crisp correctly spelled text, sharp focus.
```

---

## Prompt 4: Your agent (settings + live test)

```
A wide 16:9 landscape screenshot of the "Your agent" screen of a web app called HeyDesk, shown straight-on as a full browser window, no device frame.

Left: the same full-height deep navy rail #0A1B3D, 248px wide, with the HeyDesk logo and wordmark, the business switcher row "Spice Garden", nav items Inbox, Conversations, Menu and "Your agent" (active: translucent white background, bright light-blue icon), the large cobalt button "Talk to your agent" and the account row "Farhana Rahman" at the bottom.

Right: a pure white main area edge to edge. Header: the title "Your agent" in 28px semi-bold with the slate line "Changes go live on the next message." On the right a green-tint chip with a small green dot "Live" and a quiet slate "Saved just now", and a solid cobalt 44px button "Save changes".

Below the header, two columns. Left column, about 62 percent and no wider than 680px, a form in clearly separated sections with semi-bold section headings and thin hairlines between them; labels sit above the fields; fields are 44px with 10px corners. At the very top a pale blue #EAF1FB notice with a small progress bar: "2 things left to fill in: Opening hours and Address." Section "Basics": inputs "Agent name" (Spice Garden assistant), "Business name" (Spice Garden), and a multi-line "Greeting" containing "Hi, welcome to Spice Garden. What can I get you today?". Section "Opening hours": seven compact rows Monday to Sunday, each with the day name and two small time fields such as "11:00 AM" and "10:00 PM" in tabular figures, Friday "2:00 PM" to "11:00 PM". Section "How your agent should sound": a multi-line input with "Be warm and brief. Mention that we are pickup only." and a quiet text link "Show advanced options".

Right column, about 38 percent: a full-height pane with a pale cool grey #F6F8FB background and a hairline on its left edge. Title "Try your agent" with a small segmented switch "Chat" (selected, white with a cobalt label) and "Call" with a microphone icon. A chat: a pale blue tint agent bubble "Hi, welcome to Spice Garden. What can I get you today?", a light grey customer bubble "Do you have anything vegetarian?", and a pale blue agent bubble "Yes. Vegetable Khichuri for ৳220 and Vegetable Korma for ৳320. Would you like one?". At the bottom a rounded message field "Type a message" with a round cobalt send button. Under the chat, a labeled "Chat link" field showing "heydesk.app/chat/spice-garden" with a white outlined button "Copy link".

Refined enterprise calm style, flat matte surfaces, hairline borders #E3E8EF, ink #0E1726, slate #5B6577, brand cobalt #004AAC only for actions and selection, the Onest typeface in sentence case, tabular figures, 14px panels, 10px controls, thin 1.5px line icons, generous whitespace, crisp correctly spelled text, sharp focus.
```

---

## Prompt 5: Conversation with a hand-off

```
A wide 16:9 landscape screenshot of the Conversations screen of a web app called HeyDesk, shown straight-on as a full browser window, no device frame.

Left: the same full-height deep navy rail #0A1B3D, 248px wide, logo, business switcher "Spice Garden", nav items Inbox, "Conversations" (active: translucent white background, bright light-blue icon, amber badge "1"), Menu, Your agent, the large cobalt button "Talk to your agent" and the account row "Farhana Rahman".

Right: a pure white main area edge to edge, split into a conversation list and a transcript separated by a hairline. The list column (about 340px) has the title "Conversations", a search field "Search conversations", small filter chips "All" (selected, pale blue tint with cobalt text) and "Needs a person" with a small amber count, then rows grouped under the semi-bold slate headings "Today" and "Yesterday". Each row is 64px with a hairline: a round initials avatar, the name in deep indigo navy semi-bold, a slate preview line, the time at the right and a small channel chip "Chat" or "Voice" with a microphone icon. First row selected with a pale blue tint: "Rafiq Hasan", "Can I talk to someone?", "6:12 PM", an amber chip with a person icon "Needs a person". Next rows: "Nusrat Jahan", "Yes, please place it.", "5:48 PM", Voice; "Tanvir Ahmed", "Thank you!", "5:20 PM", Chat.

The transcript column fills the rest. Header: "Rafiq Hasan", slate "Chat, today 6:05 PM", and on the right a white outlined button "Mark as handled". Under it a full-width pale amber #FFF4DB notice with dark amber text and a person icon: "Rafiq asked for a person. His number is +880 1819 220 431." with a solid cobalt 44px button "Call back" at its right. Then the conversation in a column no wider than 65 characters: a light grey customer bubble on the left "Hi, I ordered yesterday and there was a problem with my biryani.", a pale blue tint agent bubble on the right "I am sorry to hear that. Could you tell me what went wrong, so I can pass it on to the team?", the customer "Honestly I would rather talk to a person. Can I talk to someone?", and the agent "Of course. I have asked our team to call you. Is +880 1819 220 431 the best number?". At the bottom a hairline-bordered summary row "Made from this chat: Message for the team #18" with a "New" chip.

Refined enterprise calm style, flat matte surfaces, ink #0E1726, slate #5B6577, hairlines #E3E8EF, brand cobalt #004AAC only for actions and selection, amber only for the person-needed state, the Onest typeface in sentence case, tabular figures, 14px panels, 10px controls, bubbles with 14px corners, thin 1.5px line icons, crisp correctly spelled text, sharp focus.
```

---

## Prompt 6: Menu

```
A wide 16:9 landscape screenshot of the Menu screen of a web app called HeyDesk, shown straight-on as a full browser window, no device frame.

Left: the same full-height deep navy rail #0A1B3D, 248px wide, logo, business switcher "Spice Garden", nav items Inbox, Conversations, "Menu" (active: translucent white background, bright light-blue icon), Your agent, the large cobalt button "Talk to your agent" and the account row "Farhana Rahman".

Right: a pure white main area edge to edge. Header: the title "Menu" in 28px semi-bold, the slate line "Your agent reads this when customers ask or order. Changes are live right away." On the right a white outlined 44px button "Import CSV" with an upload icon and a solid cobalt 44px button "Add dish" with a plus icon. Below, a search field "Search dishes" and category tabs with a cobalt underline on the selected one: "All", "Rice" (selected), "Curry", "Breads", "Drinks", "Desserts".

A clean full-width table with no boxes and no zebra stripes: a header row on a very pale cool grey #F6F8FB background with column names "Dish", "Price", "Available" in small semi-bold slate sentence case; rows 64px tall separated by thin hairlines. Row one: "Chicken Biryani" in deep indigo navy semi-bold with a slate description "Basmati rice slow-cooked with chicken, potato and egg." and two small rounded chips "popular" and "spicy", price "৳450" right aligned in tabular figures, a cobalt toggle switched on. Row two: "Mutton Kacchi", "Old Dhaka style, mutton layered with rice and cooked sealed.", chip "popular", "৳550", toggle on. Row three: "Vegetable Khichuri", chip "vegetarian", "৳220", toggle on. Row four: "Beef Rezala", chip "spicy", "৳480", toggle on. Row five, faded: "Mango Lassi" with a grey chip "Sold out", "৳150", toggle off. Row one is hovered and shows a small "Edit" text button and a three-dot more menu at the far right. At the bottom, a slate line "5 dishes".

Refined enterprise calm style, flat matte surfaces, ink #0E1726, slate #5B6577, hairlines #E3E8EF, brand cobalt #004AAC only for actions, selection and toggles, the Onest typeface in sentence case with tabular figures, 14px panels, 10px controls, fully round chips, thin 1.5px line icons, crisp correctly spelled text, sharp focus.
```

---

## Prompt 7: Phone inbox

```
A tall 9:16 portrait image of the Inbox screen of the HeyDesk web app on a modern phone, shown as a flat straight-on screenshot of the phone screen with a very subtle thin bezel, centered on a very light cool grey background (#F6F8FB).

The screen is white. At the top, a status bar; below it a compact header row with the small HeyDesk logo mark (cobalt rounded square with a speech bubble outline made of five connected white dots), the title "Inbox" in large semi-bold, and on the right a round search icon button. A slim pale amber #FFF4DB notice "1 customer is waiting for a person" with a small chevron. Tabs with a cobalt underline on the selected one: "Pickup orders  2" and "Messages  1". A list grouped under the semi-bold slate heading "Today", rows 64px with hairline dividers and no cards: a round initials avatar, the name in deep indigo navy #283371 semi-bold, a slate one-line summary, the price in tabular figures at the right and a status chip beneath it. Rows: "Tanvir Ahmed, 2 Chicken Biryani, Borhani, ৳1,030, New", "Nusrat Jahan, Mutton Kacchi, 2 Butter Naan, ৳670, New", "Mahin Chowdhury, Beef Rezala, Firni, ৳570, Ready". At the bottom, a solid cobalt 52px full-width button "Talk to your agent" with a microphone icon floating above a tab bar of four icon-and-label tabs "Inbox" (active, cobalt), "Chats" with a small amber badge, "Menu", "Agent".

Refined enterprise calm app style, flat matte surfaces, ink #0E1726, slate #5B6577, hairlines #E3E8EF, brand cobalt #004AAC only for actions and selection, the Onest typeface in sentence case, comfortable 44px touch targets, 10px controls, fully round chips, thin 1.5px line icons, crisp correctly spelled text, sharp focus.
```

---

### More prompts on request

Admin console (businesses, suspend, audit), an empty Inbox before the first
order, session-expired page, a collapsed 72px icon rail, dark mode of the Inbox.
