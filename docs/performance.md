# Performance: what was optimized and why

The console asked the server for far more than each screen shows. Most of
it came from three places in `src/api/` that every page goes through, so
fixing those three fixed every page at once. This file lists each change,
the problem it solves and what it saves, in plain words you can explain.

`J` below is how many kinds of record the agent takes: 2 for a restaurant
(orders, messages) or a clinic (appointments, messages), 1 for a receptionist.

## The numbers

Measured on the dev server with the seed clinic (few records, no conversations):

| What | Before | After |
|---|---|---|
| Open the app on Home (cold load) | 18 requests | 15 |
| Click Inbox in the sidebar | 6 requests (2 of them `GET /agent`) | 4 (none) |
| Type "a104" in the Inbox search | 1 request | 1 (it was already debounced) |

Worked out from the code for a business with real traffic (the seed has no
conversations, so these did not show in the measurement above):

| What | Before | After |
|---|---|---|
| Open Conversations (30+ conversations) | 121 requests, list hidden until all finish | 33, list shows after the first 3 |
| Open one older conversation | 4 requests | 1 |
| Home with 6 customers waiting for a person | +24 requests | +0 |
| Sidebar badge counts | every record ever taken, downloaded | only the waiting ones |
| Open Inbox on a busy business | up to 100 records per kind, older ones unreachable | 30, and "Show more" reaches all of them |

## 1. Remember the agent's kind (`api/agent.js` `agentKind`)

**Problem.** The backend keeps orders, appointments and the menu in
different tables, so before every list call the frontend asked
`GET /agent` "are you a restaurant or a clinic?". The answer never changes,
yet it was asked again for every list, every count and every conversation.

**Fix.** The answer is kept in a variable, keyed by the sign-in token. The
first call asks; every later call reuses it. We keep the *promise*, not
the value, so two calls made at the same moment share one request.
`fetchAgent` and `createAgent` also fill it in, since they already have
the answer. A 404 (no agent yet) is not kept, so the next call asks again.
A new sign-in has a new token, so it never sees the previous business's kind.

**Benefit.** One `GET /agent` per session instead of one per list call.

## 2. Load the agent once, share requests in flight (`stores/agent.js`, `stores/inbox.js`)

**Problem.** Opening a page fired the same request twice: the sidebar asks
for the agent, the presets and the badge counts when it appears, and the
page asks for them too, at the same moment. Every visit to Home,
Settings, Doctors, Knowledge or Channels fetched the agent again.

**Fix.**
- `agent/load` does nothing if the agent is already in the store. Pages
  read it from there. When something the server works out from *other*
  data changes (adding the first doctor removes "Add your doctors" from
  `missing`), the Menu page asks again with `{ force: true }`. Saving
  settings needs no force: the PATCH answers with the new agent.
- `agent/load`, `agent/loadPresets` and `inbox/load` keep the request
  that is on its way in a variable. A second caller waits for that one
  instead of starting its own.

**Benefit.** Moving between pages costs only what the new page shows.

## 3. Badge counts ask only for what they count (`api/records.js` `fetchInbox`)

**Problem.** To show "3 waiting" next to Inbox, the app downloaded every
order and message the business ever received and counted the `new` ones in
the browser. That grows forever, and it ran on every page change that
refreshes the counts.

**Fix.** Ask the server `?status=new` and count what comes back. The
`total` field it also returned was not used anywhere, so it is gone.

**Benefit.** The download is the size of the waiting pile, not the history.

## 4. No fetch per conversation (`api/records.js` `byConversation`, `api/conversations.js`)

**Problem.** The conversation list has no customer names, so the page
opened each conversation to find its records. Opening one conversation
fetched *all* records again and filtered them in the browser
(`fetchRecordsOf`). For 30 previews that is 30 x (1 + 1 + J) = 120 requests,
the same records downloaded 30 times. Home did the same for the customers
waiting for a person.

**Fix.** The page fetches the records **once** and `byConversation(records)`
turns them into a lookup `{ conversationId: [records] }`. A row's name is
then a lookup, not a request. `fetchConversation` now returns the
transcript only. Home already had the records loaded, so it needs no extra
request at all.

**Benefit.** 120 requests become 30 (the previews), and Home's handoff list
is free.

## 5. Show the list first, fill previews in later (`pages/conversations/ConversationsPage.vue`)

**Problem.** The page waited for all 30 transcripts before showing a
single row, so one slow transcript held up the whole page.

**Fix.** Rows appear as soon as the list and the records arrive. The
previews (last message) load in the background, only for the rows on
screen, and appear as each one arrives. `rows` is now a computed property,
so Vue redraws a row the moment its preview lands. A preview that fails is
just an empty line, not an error over the transcript pane.

**Benefit.** The page is usable after 3 requests instead of 121.

## 6. Real pagination, on both sides (backend D46, `components/ui/ShowMore.vue`)

**Problem.** Every list endpoint sent the whole list (records were cut off
at the newest 100, so older orders could not be reached at all;
conversations had no limit). Inbox, Conversations and the admin Activity log
then drew every row at once. A busy restaurant has thousands of orders after
a few months.

**Fix, backend** (`../heydesk`). Each growing list (`/orders`,
`/appointments`, `/shop/orders`, `/messages`, `/conversations`,
`/admin/audit`) takes two query parameters, read in one place (the `Page`
dependency in `api/deps.py`):

- `limit`: how many rows, 1 to 100 (default 100, the old cap, so nothing
  that calls it today changes).
- `before`: a time. Only rows older than it come back.

The query is `WHERE created_at < :before ORDER BY created_at DESC LIMIT :limit`.
This is called **cursor** (or keyset) paging. The usual alternative,
`?page=3` (an `OFFSET`), has two problems: a new order arriving between two
clicks shifts every row down one, so a row shows twice; and the database
still reads and skips all the earlier rows to reach page 300. A cursor has
neither problem. The response stays a plain list; one test
(`test_the_owner_pages_through_messages`) checks the pages and the 422.

**Fix, frontend.** The page asks for `PAGE_SIZE` (30) rows. If 30 came
back, there may be more, so `ShowMore` appears; clicking it asks for
`before=<time of the oldest row on screen>` and adds the answer to the end.
Fewer than 30 back means that was the last page and the button goes. If a
search or tab changed while a page was on its way, that page is dropped (it
belongs to the old list). In Conversations each new page also loads the
previews for its own rows only.

**One thing paging broke, and its fix.** Home links to waiting records
(`/inbox?job=order&open=<id>`). With 30 rows per page, a waiting order older
than the newest 30 would not be in the list. Now the Inbox fetches just that
one record for the detail pane (`fetchRecord`). Messages had no
get-one route, so the backend gained `GET /api/messages/{id}`.

**Benefit.** Opening Inbox downloads 30 records instead of up to 100 per kind,
the browser draws 30 rows, and older records are reachable for the first time.

## 7. Search: debounce plus "newest answer wins" (`pages/inbox/InboxPage.vue`)

The Inbox search already waited 300 ms after the last key before asking
(debounce). Two problems remained:

- **Out-of-order answers.** Typing "a1", pausing, then "a10" sends two
  searches. If the first answers last, it replaced the newer results.
  Now each request gets a number (`lastAsk`); an answer that is not the
  newest is dropped.
- **Flashing.** Every pause in typing swapped the list for a skeleton.
  Now the old results stay until the new ones arrive.

The Menu search filters in the browser (no request), so it needs neither.

## 8. Stop polling when nobody is looking (`components/chat/AgentChat.vue`)

The customer's chat checks for team replies from Telegram every 4 seconds.
It kept doing that in background tabs, for every visitor who left the
chat open. Now a check is skipped while the tab is hidden
(`document.hidden`); the next check after they come back catches up.

**Benefit.** Fewer requests to the server from idle visitors, less battery
on their phones.

## 9. Icons are not reactive (`markRaw` in four pages)

Inbox, Conversations, Menu and Knowledge kept icon components in `data()`.
Vue makes everything in `data()` reactive (it wraps it so it can notice
changes), and warned in the console that this is wasted work for a
component that never changes. `markRaw(...)` tells Vue to leave them alone.
The warning is gone.

## 10. The live inbox is pushed, with a slow poll behind it (`useLiveInbox.js`, `App.vue`, `stores/inbox.js`)

New orders and hand-offs show without a reload: the console holds one
stream to `GET /conversations/live` (backend D158), and the server sends an
event for each conversation that changed. Each event asks `inbox/load` again
(the badge requests only, J + 1 of them, never one per row) and makes an
open Conversations page fetch its first page. Nothing is requested while
nothing happens. The shell also asks `inbox/load` every two minutes while the
tab is visible, and at once when it comes back, for what changes no
conversation (an order paid by a webhook). It waits until the business has an
agent. When a count goes up, an open Inbox fetches its first page again.

**Cost.** One open connection per console, and about 0.5 requests a minute
when nothing happens.

## What was checked and left alone

- **Bundle size.** Every page except Home is already lazy-loaded in
  `router.js`, and icons are imported one by one, so the main bundle is
  small (78 KB gzipped vendor, 19 KB app). Nothing to gain.
- **Menu and Knowledge lists.** The backend stores the menu as one list and
  saves it whole (`PUT /agent/items`, at most 2000 rows from a CSV), so the
  page fetches it once and searches in the browser, with no request per
  keystroke. Only drawing is capped: 50 rows, then "Show more". The backend
  allows 30 documents, so Knowledge needs nothing. Admin businesses and owners
  are small lists for now; they can take the same `Page` when they grow.
- **Home's numbers.** "Today your agent had 14 conversations" still needs
  the conversation and record lists, because the backend has no count
  endpoint. It is one fetch of each list.

## Next, on the backend

Paging is done (section 6). Two more small additions would cut requests
further. Each one is a frontend change of
a few lines after it lands:

1. **Name and last message in `GET /conversations`.** Then the
   Conversations list needs 1 request instead of 33.
2. **Counts endpoint** (`GET /inbox` with waiting per job, today's totals).
   Then the badges are 1 small request and Home's "Today" line needs no lists.
