# Backend API and frontend map

Read this instead of crawling `../heydesk`. Source of truth if it drifts:
`../heydesk/src/heydesk/api/*.py` (routes, schemas), `runtime/config.py`
(agent config), `errors.py` (error codes), `presets/jobs.yaml` (jobs).
Last synced 4 Oct 2026 (after agent jobs + document ingest); paging added 9 Oct 2026 (backend D46).

## Conventions

- **Paging (D46).** Lists that grow (`/orders`, `/appointments`, `/shop/orders`,
  `/messages`, `/conversations`, `/admin/audit`) take `?limit=` (1 to 100,
  default 100) and `?before=<time>`: the last row's `created_at` (`updated_at`
  for conversations, `at` for the audit log). Newest first, a plain list; fewer
  rows than `limit` means the last page. `limit` out of range is 422
  `invalid_request`. The frontend asks for `PAGE_SIZE` (30, `lib/group.js`).

- Base `/api`, JSON, `Authorization: Bearer <token>`. The token carries the
  workspace, so there are no ids for the business in URLs.
- Errors: `{ error: { code, message, fields? } }`. `client.js` turns it into
  `Error` with `.status`, `.code`, `.fields`. Show `message` as-is.
- Codes: `bad_request` 400, `unauthorized` 401, `forbidden` 403, `not_found`
  404, `unavailable` 404 (suspended business chat), `conflict` 409,
  `invalid_transition` 409, `conversation_full` 409, `visitor_limited` 429, `rate_limited` 429, `invalid_config` 422
  (`fields`: path to problem), `invalid_request` 422 (`fields`),
  `unreadable_document` 422, `unreadable_photo` 422, `knowledge_unavailable` 503 (nothing saved, retry),
  `internal` 500.
- Money is minor units, times are UTC (see CLAUDE.md for the helpers).
- Roles: `owner` (own business) and `admin` (all, no business). An admin uses the
  owner routes for one business by sending its id as `X-Business` (an owner's is
  ignored); without it they answer 400 `business_required`. The admin's writes, and
  opening one conversation, go to the audit log. `api/client.js` sends the header
  while an admin has a business open (`auth.view()`).

## Endpoints

Frontend file: `src/api/<file>.js`. "-" means the frontend does not call it.

### Auth (`auth.js`)
| Call | What it does |
|---|---|
| `POST /auth/signup` `{email, password>=8, workspace_name}` | New business + owner. 204 and an email with a 6-digit code: no token until it is typed (D94) |
| `POST /auth/login` `{email, password}` | Returns `{token}`; 401 for a wrong email or password; 403 `email_not_verified` for the right one before the code (`SignIn.vue` then sends a fresh code and shows the code step) |
| `POST /auth/verify` `{email, code}` | The signup code. Returns `{token}`; 403 if wrong or expired; 429 after 5 tries in 15 minutes |
| `POST /auth/verify/resend` `{email}` | Always 204; emails the code again if the account exists and is not verified. 3 an hour per email |
| `POST /auth/forgot` `{email}` | Always 204; emails a reset code if the account exists. 3 an hour per email |
| `POST /auth/reset` `{email, code, new_password>=8}` | Returns `{token}`; 403 if the code is wrong, expired or already used. An invited moderator joins here, with the code in their invite (D97) |
| `PUT /auth/password` `{current_password, new_password}` | Your own password (owner or admin); the new one at least 8 characters. 204, or 403 `forbidden` if the current one is wrong; 429 counts with the login limit |
| `GET /auth/me` | `{email, role: owner/moderator/admin, business: {id, name, status: active/suspended} \| null}` |

### Team (`team.js`, owner only, D97)

A moderator runs the inbox (conversations, messages, orders, bookings, appointments, calls, the
lists) and can read the settings, but gets 403 `forbidden` on any change under `/api/agent`, on
`/api/agent/telegram` and on `/api/team`. A removed moderator's next request is a 401.

| Call | What it does |
|---|---|
| `GET /team/members` | `[{id, email, role: owner/moderator, status: active/invited, invited_at, joined_at, open_chats}]`, owners first. `open_chats`: chats waiting for them or with them now, the count a hand-off goes by (D129); shown on Team and in the *Assign* list |
| `POST /team/members` `{email}` | 201 with the member (`invited`); an email with a code goes to them. 409 `conflict` if the email has an account or the team has 10 moderators; 429 counts with the code emails |
| `POST /team/members/{id}/invite` | Sends the invite again with a new code. 204; 409 once they've joined |
| `DELETE /team/members/{id}` | Removes a moderator (invited or joined). 204; 404 for an owner |
| `GET /team/activity?limit=&before=` | `[{actor_email, action, target, at}]`, newest first: each owner's and moderator's write that succeeded. `action` is `"PATCH /api/orders/{order_id}"`, `target` the ids (`order_id=…`) |

### Agent (`agent.js`)
| Call | What it does |
|---|---|
| `GET /presets` (public) | `[{id, label, description, greeting, instructions, jobs[{id,label,description}], tools[], items_label, knowledge_schema}]`. `knowledge_schema` is JSON schema; the Agent page builds the "About your business" fields from it |
| `POST /agent` `{preset, config?, items?}` | Create the agent from a preset. 201. One per business |
| `GET /agent` | `{public_key, config, jobs[{id,label,description}], missing[]}`. 404 `not_found` until created |
| `PATCH /agent` `{...config fields}` | Top-level fields replace: send the whole `knowledge`, the whole `handoff`. Live on next message. 422 `invalid_config` |
| `GET /agent/items` | The menu/services list |
| `PUT /agent/items` `[Item]` | Replace the whole list, in order |
| `POST /menu/import`, `/doctors/import`, `/products/import` `{csv, mapping?, dry_run?}` | `{saved, count, preview[5], added}`. Replaces the list unless `dry_run`; a shop's `/products/import` adds instead (D120): a row with the code, or else the name, of a product it has updates it, the rest are added (`added`: how many; null on a dry run), none is deleted. `mapping` is `{ourField: theirColumn}` from `/suggest`, as the owner checked it; without it columns are matched by name. 422 `invalid_config` with `fields` per row ("row 3") or `mapping` (D53) |
| `POST /menu/import/suggest`, `/doctors/import/suggest`, `/products/import/suggest` `{csv}` | `{columns[{name, about, required}], headers[], samples[3]{header: text}, mapping{field: header}, by_ai}`. The AI's guess at the match; `by_ai: false` means it matched by name only. One model call per request (D53) |
| `POST /agent/sheet/suggest` `{url}` | A Google Sheet's link (shared "Anyone with the link: Viewer"): the same answer as the import's `/suggest`, for that tab. 422 `invalid_config` `fields.url` for a link that isn't a sheet or a sheet that isn't shared (D58) |
| `PUT /agent/sheet` `{url, mapping, dry_run?}` | Answers like the import: `{saved, count, preview[5]}`, 422 per row. Unless `dry_run`, links the sheet and takes the list from it; from then on the server reads it every 5 minutes (D58) |
| `GET /agent/sheet` | `{url, synced_at, problem}`: `synced_at` is the last clean read; `problem` (empty: fine) says why the list didn't change. 404 while none is linked |
| `POST /agent/sheet/sync` | Reads it now; the same answer as `GET` |
| `DELETE /agent/sheet` | 204. Stops syncing; the list stays and can be edited again |
| `PUT /agent/woo` `{url, key, secret}` | A shop's WooCommerce store (D75): `url` its `https://` address, a REST key made Read/Write. Checks the key can read and write (nothing is written), links it and takes its products as the list. `{url, products, synced_at, problem}`. 422 `invalid_config` with `fields.url` (not `https://`) or `fields.key` (refused, or Read only); 409 while a sheet is linked; 404 for a desk that isn't a shop |
| `GET /agent/woo` | `{url, products, synced_at, problem}` (never the key or secret). 404 while none is linked |
| `POST /agent/woo/sync` | Writes the orders that changed into the store, then reads its products; the same answer as `GET`. The server does this every 2 minutes by itself |
| `DELETE /agent/woo` | 204. Stops syncing; the list stays and can be edited again, and orders already in the store stay there |

`Item`: `{code, name, description, price (minor units), category, tags[], available, attributes{}}`.

While a sheet is linked, a menu or doctors list is the sheet's: `PUT /menu`,
`PUT /doctors` and their CSV imports are 409 `sheet_linked`, and the page locks
the rows (`ItemRow` `locked`). A shop's sheet only adds and updates its own
products (D120): `PUT /products` and `/products/import` still work, a product
the sheet has changes back when its row changes there, and one deleted in the
sheet leaves the list; the rest stay. A shop's stock in the sheet is what's on
the shelf: the server takes off orders not shipped yet, and only when a
product's stock cell changed (D58). The page shows `SheetBar`.

A shop can link its WooCommerce store instead of a sheet (D75), never both
(409 `sheet_linked`). Like a sheet it adds and updates its own products, and a
product deleted in the store leaves the list (D120). Its stock is the
store's, and the orders placed here are written into the store, so the owner sees
them in WooCommerce too. The Products page has "From WooCommerce" in the Import
menu (`WooPanel`) and shows `WooBar` while one is linked.

`config` (AgentConfig): `preset, name, business_name, timezone ("Asia/Dhaka"),
country, currency, greeting, instructions (admin), notes (owner, 4000),
knowledge{} (per preset), faq (20000), handoff{message, phone, email}`.

### A shop (`agent.js`, D45, D54)
| Call | What it does |
|---|---|
| `GET /products` | `[Product]`, in the shop's order |
| `PUT /products` `[Product]` | Replace the whole list. **Send every field back**, or it's lost: the Products page edits one row and PUTs them all |
| `POST /products/photos` (multipart `file`) | A product photo (JPEG, PNG or WebP, up to 10 MB) → `{url}`, saved as a JPEG and indexed for photo search. The product keeps it once it's saved with that URL in `photos`. 422 `unreadable_photo`; 503 `knowledge_unavailable` when Gemini or Qdrant is down (nothing kept). Client: `uploadProductPhoto` in `api/agent.js` (backend D57) |
| `GET /shop/orders`, `PATCH /shop/orders/{id}` `{status}` | The shop's orders, paged (D46); move one along. Each has `parcel_id` and `courier_status` (empty until the agent books it with the courier, D113); `records.js` shows them as the Parcel and Courier says details |

`Product`: `{code, name, description, price, was_price (before a sale; null: not on sale), category,
sizes[], colours[], stock (null: not counted; 0: sold out), variants[], photos[]}`. Money in minor units. The
Products page shows `was_price` crossed out when it's above `price`. `photos` (D57): up to 3 URLs
from `POST /products/photos` (`/media/...`, served by the backend; the dev server forwards
`/media`); the first is the one the agent shows. A URL that isn't one of the business's product
photos is a 422; only photos new to the list are checked, so one saved before never blocks a save (D122). A CSV import keeps each product's photos when its row has none.

A product's public page is `<backend>/p/<public_key>/<code>?from=web|messenger|telegram|whatsapp`
(D121): server-rendered HTML with its photos, name, price, the sizes and colours in stock and
the description, and on Messenger and Telegram a button back to the chat. Anything else is a
404 page. The chat's product cards (`AgentChat`) open it in a new tab; the dev server and
Vercel forward `/p/` to the backend.

`Variant` (D56): `{size, colour, stock}`, stock per size and colour. An empty size or colour means
any of them (`{size: "L", colour: "", stock: 4}` counts L in every colour). When there are variants
they hold the stock and `stock` is null; a size and colour no variant matches isn't counted. A
variant's size or colour that isn't the product's is a 422. The CSV `stock` cell takes a number or
`"M: 5; L White: 0"`. The Products page edits them as a list of counts and hides the on/off switch
for such a product.

A shop's config adds `delivery[{name, charge, days, districts[], pay_first}]`
(`districts`: of Bangladesh's 64, sent in English or Bangla and saved in English, a 422 for a name
that isn't one; an area with none is everywhere else, and only one can be; the agent gives the
address's district and the backend picks the area, backend D98, D100; `pay_first`: per area since
backend D92, and a shop has no `pay_first` of its own), `free_delivery_over`, `policies`,
`size_guide` (free text; the agent suggests a size only from it) and `calls` (below). The Delivery
and payments section sends the whole `delivery` with its districts (picked from a searchable
list), with its one
"pay first" switch on every area; the
profile section shows `policies` and `size_guide` as long fields, and leaves `calls` to its own section.

Jobs (`presets/jobs.yaml`): `order` (pickup order, makes an `order` record),
`appointment` and `message` (both make a `request` record). The owner cannot toggle
them. Since D37 a preset fixes its jobs and tools, owners cannot switch them,
`GET /jobs` and `config.jobs` are gone, and `GET /agent` returns the read-only
`jobs` list. The Agent page shows it as plain rows.

### Calls to confirm a shop's orders (`calls.js`, page `pages/calls`, D88, D89)
Off for now (D108): the shop takes no voice, so no order is queued and `POST /calls` is a 409
`conflict`. The routes stay; the Calls page has nothing to show.

| Call | What it does |
|---|---|
| `GET /calls?view=waiting` | The calls ringing or talking, then the queue in the order it's called; each queued call has `place` (1 is next) |
| `GET /calls?view=done` | The last 100 finished calls, newest first |
| `GET /calls?order_id=` | One order's calls, newest first (the order's call line in the Inbox) |
| `POST /calls` `{order_id}` | Call a new order now, first in the queue → 201 `Call`. 409 `conflict` while calls are off (always, for now: D108), or when the order isn't new or already has a call waiting |
| `POST /calls/{id}/now` | A queued call moves to the front and is due now. 409 unless it's queued |
| `DELETE /calls/{id}` | Cancels a queued call: done, outcome `stopped`; the order stays as it is. 409 unless it's queued |

`Call`: `{id, order_id, code ("O-104"), name, phone, status (queued, ringing, talking, done),
outcome ("" until done; then confirmed, cancelled, no_answer, no_decision, skipped: the order moved
on first, or stopped: the owner cancelled it), tries (rings so far), next_try_at, conversation_id
(the call's transcript, once answered), created_at, updated_at, place (queued only)}`.

A shop's config has `calls: {enabled (false), wait_minutes (1), start ("10:00:00"), end
("20:00:00"), tries (2), retry_minutes (30), opening}`, edited whole by the Calls section of Agent
settings. `opening` is the call's first line; the backend fills in `{business_name}`, `{code}` and
`{total}`. `end` must be after `start` (422 on `calls`). The phone is the backend's `/phone` page,
reached through the dev server at `/demo/phone` (`phoneLink()` in `lib/calls.js`): there is no
phone carrier.

### Documents / knowledge base (`agent.js`, page `pages/knowledge`)
Searched by the agent when a question is not answered elsewhere. Needs an
agent (404 before). Indexed before the call returns (a few seconds).
| Call | What it does |
|---|---|
| `POST /agent/logo` (multipart `file`) | The website chat's logo (D82): saved as a 256 px JPEG and set as `config.widget.logo` → `{url}`. `PATCH /agent {widget}` sets the rest; a `logo` that isn't one of ours is a 422 |
| `GET /agent/documents` | `[{id, title, filename, kind: text/markdown/pdf, chunk_count, created_at}]`, newest first |
| `POST /agent/documents` `{title<=200, text<=400k}` | Add pasted text. 201. `kind` is markdown if text starts with `#` |
| `POST /agent/documents/file` multipart `file`, `title?` | `.txt .md .markdown .pdf`, 10 MB, UTF-8, PDF needs a text layer, no passwords. Empty title uses the file name. 201 |
| `GET /agent/documents/{id}` | Same plus `text` |
| `DELETE /agent/documents/{id}` | 204 |

Limits: 30 documents per business, 300,000 chars, 400 chunks. Breaking one is
`422 unreadable_document` with a plain sentence.

### Telegram (`telegram.js`, card `components/agent/TelegramConnect.vue`)
The business's own bot from @BotFather (backend D42). The token is sent once
and never returned.
| Call | What it does |
|---|---|
| `GET /agent/telegram` | `{username, link}` (`https://t.me/<username>`). 404 while no bot is connected |
| `PUT /agent/telegram` `{token}` | Checks it with Telegram and connects the bot; connecting again replaces it. 422 `invalid_config` with `fields.token` for a token Telegram doesn't know; 400 if the server has no `PUBLIC_URL` |
| `DELETE /agent/telegram` | 204. Telegram stops sending |

The card finds the token inside BotFather's whole pasted reply (`findBotToken`)
and connects as soon as one is there. Conversations from Telegram have
`channel: "telegram"` (`lib/channels.js` labels web, voice, Telegram, Messenger and WhatsApp).

### Messenger (`messenger.js`, card `components/agent/MessengerConnect.vue`)
The business's Facebook Page (backend D60). The Page id and access token are sent together; the token is sent once
and never returned. Alerts for the owner stay on Telegram.
| Call | What it does |
|---|---|
| `GET /agent/messenger` | `{page_id, link}` (`https://m.me/<page_id>`). 404 while no Page is connected |
| `PUT /agent/messenger` `{token, page_id}` | Subscribes the Page's `messages` (Facebook accepts that only for the right token and Page, backend D61); connecting again replaces it. 422 `invalid_config` with `fields.token` for a token Facebook refuses for that Page, or `fields.page_id` for a Page another business has; 400 if the server has no `META_APP_SECRET` |
| `DELETE /agent/messenger` | 204. The Page stops being answered |
| `GET /agent/messenger/login` | `{app_id, config_id}` for Facebook's JS SDK login, Connect with Facebook (backend D118): `FB.login` takes the Facebook Login for Business configuration, not a scope (D119). 400 if the server has no `META_APP_ID` or `META_LOGIN_CONFIG_ID` |
| `POST /agent/messenger/pages` `{user_token}` | `[{id, name}]`: the Pages that Facebook login manages, never their tokens. 422 `fields.user_token` if Facebook refuses the login. Owner only |
| `POST /agent/messenger/facebook` `{user_token, page_id}` | Connects that Page with its token from the login, like `PUT`; answers `{page_id, link}`. 422 `fields.page_id` if the login doesn't manage it. Owner only |

Conversations from Messenger have `channel: "messenger"`.

### WhatsApp (`whatsapp.js`, card `components/agent/WhatsAppConnect.vue`)
The business's WhatsApp Business number (backend D103), the same shape as
Messenger. The token is sent once and never returned. No `wa.me` link (the
owner knows their number). Alerts for the owner stay on Telegram.
| Call | What it does |
|---|---|
| `GET /agent/whatsapp` | `{phone_id}`. 404 while no number is connected |
| `PUT /agent/whatsapp` `{token, account_id, phone_id}` | `token` 20 to 500 chars (a system user's), both ids digits only. Subscribes our Meta app to the account; connecting again replaces the number. 422 `invalid_config` with `fields.token` when Meta refuses the token for that account and number, or `fields.phone_id` for a number another business has; 400 if the server has no `META_APP_SECRET`; 404 if the business has no agent yet |
| `DELETE /agent/whatsapp` | 204. The number stops being answered |

Conversations from WhatsApp have `channel: "whatsapp"`.

### Payments (`payments.js`, card `components/agent/SslcommerzConnect.vue`, D49, D109)
The business's own accounts for paying first. It can connect SSLCommerz, bKash, or both; the
agent asks for payment only when `pay_first` is on and at least one is connected.

| Call | What it does |
|---|---|
| `GET /agent/sslcommerz` | `{store_id, sandbox, connected_at}`. 404 while none is connected. The password never comes back |
| `PUT /agent/sslcommerz` `{store_id, password, sandbox}` | Checks the store with SSLCommerz, then keeps it → the same as `GET`. 400 with SSLCommerz's reason when it refuses |
| `DELETE /agent/sslcommerz` | 204. 404 while none is connected |
| `GET /agent/bkash` | `{username, sandbox, connected_at}` (D109). 404 while none is connected. The app secret and password never come back |
| `PUT /agent/bkash` `{app_key, app_secret, username, password, sandbox}` | Checks the keys by asking bKash for a token, then keeps them → the same as `GET`. 400 `bKash didn't accept these: …` when it refuses |
| `DELETE /agent/bkash` | 204. 404 while none is connected |

The visitor's payment link (`<backend>/pay/<id>`, sent by the agent) is a backend page: with
one gateway it goes straight there; with both it shows a button for each (D109).

### Courier (`courier.js`, card `components/agent/CourierConnect.vue` on `PaymentsSection`, shops only, D90, D113)
The shop links its own Steadfast or Pathao account. Then every confirmed order is booked there
(it moves to shipped), and the order moves to delivered or returned when the courier says so,
about once a minute. Without one, the owner books by hand (in development a fake courier books).

| Call | What it does |
|---|---|
| `GET /agent/courier` | `{kind: steadfast/pathao, store_id, sandbox, problem}`. 404 while none is linked. `problem` is empty when fine, else the courier's last refusal, for the owner. The secret and password never come back |
| `PUT /agent/courier` `{kind, key, secret, username?, password?, sandbox?}` | Checks the keys with the courier, then keeps them → the same as `GET`. Steadfast: `key` and `secret` are its API and secret keys. Pathao: its client id and secret, with the merchant `username` (email) and `password`; `sandbox` only for Pathao. 422 `invalid_config` with `fields.key` = the courier's words when it refuses |
| `POST /agent/courier/sync` | Books and checks now → the same as `GET` |
| `DELETE /agent/courier` | 204. Parcels already booked stay with the courier |

### Billing (`billing.js`, page `pages/billing`, owners only, D106, D109)
| Call | What it does |
|---|---|
| `GET /billing` | `{plan, paid_until, active, replies_used, replies, moderators, plans[{key, name, price, year_price, replies, moderators}], gateways[], payments[{id, plan, months, kind: months/upgrade, amount, status: paid/review, paid_at}]}`. `payments` are the receipts, newest first; `review` means paid but not applied yet (the plan changed while paying), HeyDesk sorts it out (D116). `gateways`: `sslcommerz` and/or `bkash`, the ones HeyDesk has set up (D109): show a Pay button for each; empty means paying online isn't set up |
| `GET /billing/quote?plan=&months=` | `{kind: months/upgrade, amount, paid_until}`: what Pay will charge, before paying (D116). `upgrade`: a bigger plan while one runs costs only the difference for the days left and ends the same day (show "Upgrade now: ৳X"). 409 with the reason when it can't be bought yet: a smaller plan while this one runs ("once it ends"), or more moderators than the plan has |
| `POST /billing/checkout` `{plan: starter/growth/pro, months: 1 or 12, gateway?: sslcommerz/bkash}` | `{url}`: send the owner there, for the quote's amount. `gateway` defaults to `sslcommerz`. 409 as the quote's; 400 when that gateway isn't set up or doesn't answer. The gateway brings the owner back, through the backend, to `/billing?payment=paid|review|failed` in the same tab: show how it went, then drop the query |

### Inbox and records (`records.js`)
| Call | What it does |
|---|---|
| `GET /inbox` | `[{job, title, kind, waiting, total}]` for the sidebar badges |
| `GET /records?job=&status=&q=` | Newest first. `q` matches code ("a104", "A-104", "a 104", "104"), name or phone |
| `GET /records/{id}` | One record; really `/orders/{id}`, `/appointments/{id}`, `/messages/{id}`. `fetchRecord`, for an Inbox link older than the first page |
| `PATCH /records/{id}` `{status}` | 409 `invalid_transition` if not legal. Legal moves mirrored in `lib/flows.js` |

`Record`: `{id, conversation_id, job, kind: order/request, number, code ("A-104": job's first letter + number, not stored), status,
customer_name, customer_phone, details{label: value}, note, lines[{code,name,quantity,price}]|null, total|null, currency|null, due_at|null, created_at, updated_at}`.
Order statuses: new, ready, collected, cancelled. Request: new, handled, archived.

### Conversations (`conversations.js`)
| Call | What it does |
|---|---|
| `GET /conversations?status=active\|needs_human&channel=&assigned=me\|none&done=&q=` | `[{id, channel, name, status, assigned_to, assigned_email, done_at, snoozed_until, created_at, updated_at}]`. `name`: the visitor's name from Telegram or WhatsApp, else null (backend D104). `channel`: web, voice, telegram, messenger or whatsapp (422 for another); the Conversations page's channel filter (`?channel=` in its URL). `assigned`: the caller's chats or no one's (D126; the page's *Mine* and *Unassigned* tabs, `?who=` in its URL). Done and snoozed chats are left out; `done=true` lists only the done ones; `q` searches names and what was said (D128) |
| `GET /conversations/counts` | `{needs_human, mine, unassigned}`: how many shown chats wait for a person, and of those the caller's and no one's (D129). The `inbox` store asks with its other counts; the tabs and the *Needs a person* chip show them |
| `PUT /conversations/{id}/assignee` `{user_id \| null}` | Who has it (D126). The owner gives any chat to anyone on the team or no one; a moderator takes an unassigned one (their own id) and gives back their own (`null`); anything else 403. Client: `assignConversation`, the *Assign* button (`AssignControl.vue`) |
| `PUT /conversations/{id}/done` `{done}`, `PUT /conversations/{id}/snooze` `{until \| null}` | Done until the visitor writes again; snoozed until a time in the next 30 days, 422 beyond (D128). Client: `markDone`, `snoozeConversation`, in `ConversationActions.vue` |
| `PATCH /visitors/{id}` `{blocked}` or `{ai_off}`, `GET /visitors/blocked` | Block or unblock a chat's visitor, or turn the AI off for them; who is blocked now (D127). A conversation's `visitor` says which is on |
| `PATCH /conversations/{id}` `{status: "active"}` | Marks a hand-off handled: the agent answers again, as after `/done` on Telegram (D83). `status` is `active`, `needs_human` or `human` (the team is answering, D43); only `active` is accepted (422), and a conversation already `active` is 409 `invalid_transition`. Client: `markHandled` in `api/conversations.js` |
| `GET /conversations/{id}` | Plus `messages[{role: user/assistant, text, photo, photos}]` and `records[]`. `photo`: the URL of the photo the visitor sent (their `text` starts with the backend's `[Photo. ...]` line); `photos`: `[{code, name, price, url}]` the agent showed, on a line with empty `text` (D57) |

### Visitor chat (`chat.js`, public, the public key is the credential)
| Call | What it does |
|---|---|
| `GET /chat/{public_key}` | `{name, greeting, photos, voice, widget}`. `photos`: true when the visitor can send a photo (a shop, D57). `voice`: true when the visitor can call it (a receptionist or a clinic, D108): show the Call button only then. `widget`: the website chat's look (D82), `{colour: '#rrggbb', side: 'right'/'left', nudge, starters: [up to 4], logo: '' or '/media/…'}`, with `{business_name}` filled in. 404 unknown, 404 `unavailable` if suspended |
| `POST /chat/{public_key}` `{message, conversation_id?, visitor_id, photo?}` | SSE stream: `open{conversation_id}`, `token{text}`, `status{label}`, `handoff{message,phone,email}`, `photos{items:[{name, price, url}]}` (products the agent shows, D57), `card{kind, data}` (a tool's card, backend D110: below), `choices{items:[text]}` (buttons under the reply, sent just before `done`; a tap sends its text as the next `message`, backend D99), `done{interrupted}`, `error{message}`. `photo`: a JPEG or PNG as base64 or a data URL, at most 2 MB (`lib/photo.js` makes it a 1024 px JPEG first); `message` may then be empty. A photo to an agent without `photos`, or one that isn't a picture, is a 422 `unreadable_photo`. 409 `conversation_full`. `visitor_id` (8 to 64 characters) is the browser's token from `lib/visitor.js`; 422 without it. 429 `visitor_limited` when the visitor is blocked (five off-topic turns in a row block them for a day) or over today's turns (30 a visitor, 500 a business); its message says how to reach the business (backend D51). 429 `rate_limited` past 6 messages a minute from one visitor_id or 60 from one IP (backend D52) |
| `GET /voice/ice` | ICE servers for a call: STUN, plus a Cloudflare TURN relay when the backend has keys |
| `POST /voice/offer?key=<public_key>&visitor=<token>` `{sdp, type}` | WebRTC voice. `visitor` is the same token as the chat's; a limited visitor gets the chat's 429 before the call connects. Send one offer with every ICE candidate (wait for gathering to complete, so no PATCH is needed); the answer is `{sdp, type}`. The microphone must be the first transceiver; open a data channel and ping it each second so the server notices a closed tab. Audio only, no transcript comes back; the call is saved as a `voice` conversation. 404 unknown key. 403 `no_voice` when the agent takes no calls (a shop or a restaurant, D108). Client: `api/voice.js`, `components/chat/VoiceCall.vue` |
| `PATCH /voice/offer` | Trickle ICE candidates (the frontend does not use it) |
| `GET /` (backend) | Plain dev chat page at `/?key=<public_key>`; the dev server still forwards `/demo/` to it. The shared link is now the frontend's own page: `lib/presets.js chatLink` builds `<this origin>/chat/<public_key>` (`pages/chat/ChatPage.vue`) |

**Cards (backend D110).** A `card` event's `data` is built by the backend; the page only lays it
out. An amount is `{minor, currency, text}` (show `text`; it may be "free"); a row with a time
also has `at`, ISO 8601 in UTC. Optional fields are left out, not null. Four kinds:

- `summary`, the read-back before the yes (Yes/Change come as `choices`):
  `{title, lines: [{label, qty?, amount?}], rows: [{label, value, at?}], total?}`
- `receipt`, what was just saved: `{title, number, status, rows: [{label, value, at?}], total?, pay_url?}`;
  `pay_url` (the `/pay/<id>` link) when it waits for a payment
- `tracking`, where an order is: `{number, steps: [{label, done, current}], note}`; a cancelled
  or unpaid order is one step on its own
- `doctors`, who fits: `{doctors: [{name, speciality, days, hours, fee, book}]}`; a Book button
  sends `book` ("Book with Dr. Imran Hasan") as the visitor's message

### Admin (`admin.js`, role admin only, under `/api/admin`)
| Call | What it does |
|---|---|
| `GET /overview?days=7` | What every agent did, from the saved turns (D72): `{days, today: Totals, period: Totals, per_day: [{day, turns, conversations, cost_micros, failed, handed_off}], busiest: [{id, name, turns, cost_micros}]}`. `Totals`: `{turns, conversations, input_tokens, output_tokens, cost_micros, failed, handed_off, first_reply_ms, slow_first_reply_ms}` (the median and 95th percentile; null with no turns). `days` 1 to 30; a day is Dhaka's; `cost_micros` counts Groq only |
| `GET /failed-turns?workspace_id=&limit=&before=` | Replies that ended with the polite line (D73), newest first: `[{id, at, workspace_id, business_name, business_status, conversation_id, channel, llm, error}]`. Next page: `before` = the last `at`. Open one as the business at `/conversations?open=<conversation_id>` |
| `GET /businesses` | `[{id, name, status, suspended_reason, kind, owner_email, conversations, last_activity_at, created_at}]`, newest first, at most 200 |
| `PATCH /businesses/{workspace_id}` `{status, reason}` | Suspend or reactivate. 204. Suspending needs a `reason` (422 without one, D70); it's kept as `suspended_reason`, for admins only, and reactivating clears it |
| `GET /users` | `[{id, email, role: admin/owner/moderator, workspace_id, business_name, created_at}]` |
| `GET /businesses/{id}` | One business at a glance (D69; `usage`: its last 7 days as `Totals`, D73): `{id, name, status, suspended_reason, kind, agent_name, public_key, created_at, owners: [{email, created_at}], channels: [{kind: telegram/messenger/whatsapp, address, created_at}], payments: sandbox/live/null, documents, sheet: {synced_at, problem} \| null, conversations, conversations_7_days, waiting, last_activity_at}`. 404 for an unknown id. Not audited |
| `POST /users/{id}/password` | `{password}` temporary, shown once. An owner's only: 403 `forbidden` for an admin (theirs is reset on the backend's command line) |
| `GET /audit?workspace_id=` | `[{id, actor_email, workspace_id, action, target, at}]` |

`GET /health` exists too (not used).

## Product rules that affect UI

- A suspended business: agent does not answer, say so at the top.
- An order in the inbox is already confirmed by the customer (the AI never
  invents one), so offer "Mark as ready", not "Approve".
- Edits to the agent are live on the next message, no publish step.

## Frontend map

- `src/api/client.js`: the only `fetch` wrapper (JSON or FormData, error shape,
  401 handler, the session token, `Accept-Language`). `chat.js` streams with
  its own fetch because of SSE.
- `src/stores/` (Pinia): `auth` (token, me), `agent` (info, presets; `config`,
  `jobs`, `missing`, `preset`, `kind`), `inbox` (badge counts), `ui` (test chat
  sheet, phone drawer). Pages fetch lists (items, documents, records)
  themselves, they are not in a store.
- Request budget (see [performance.md](performance.md)): `agent/load` fetches
  once per session (`{ force: true }` after a menu change); `agentKind` is
  remembered per token; sidebar counts ask only `?status=new`; a conversation's
  records come from one records list (`byConversation`), never one fetch per
  conversation. Inbox, Conversations and the admin Activity log fetch one page
  (`PAGE_SIZE`) and `ShowMore` fetches the next. A link to a record older than
  the first page (`/inbox?job=&open=`) fetches that one record (`fetchRecord`).
- `src/router.js`: `/` (landing page when signed out, else Home or Admin), `/chat/:key` (public, the customer's chat page), `/home /inbox /conversations /calls /agent/{profile,hours,answers,payments,bubble,calls}
  /menu /knowledge /channels /team` (owner; `/calls` and its section for a shop; `/agent`, `/knowledge`, `/channels`, `/team` and `/setup` are `requiresManager`: a moderator is sent Home, D97), `/admin` (admin), `/setup`, `/sign-in`.
  Guards use route `meta`. `/inbox?job=&open=` and `/conversations?open=`
  open one item.
- Pages: `pages/{landing,home,inbox,conversations,calls,agent,menu,knowledge,channels,team,setup,admin,auth,chat,account}`.
  Shared pieces in `components/{ui,layout,records,conversations,calls,menu,knowledge,agent,chat}`.
  Agent settings sections share `composables/useAgentSection.js`; each PATCHes
  only its own fields (the API leaves the rest).
- `src/lib/`: `flows.js` (status buttons), `format.js` (money, time, day,
  greeting, ago), `group.js` (Today/Yesterday, avatars), `records.js`
  (one-line summaries), `navigation.js` (the sidebar and tab bar), `setup.js`
  (Home checklist, where each `missing` item is fixed), `hours.js`,
  `presets.js` (icons, nouns, chat link), `channels.js`, `slug.js`, `calls.js` (the demo
  phone link, a call's chip, Call again).
- `src/i18n/`: `index.js` (vue-i18n setup, `setLocale`, `localeTag`, `t` for
  plain JS), `en.js` and `bn.js` (every word on screen, same keys).
- Full guide: [architecture.md](architecture.md).

## Not built yet (backend supports it)

Admin view of an owner's documents or jobs, voice
channel UI.

## Rate limits (backend D52)

A burst gets a 429 `rate_limited`: "Too many requests. Please wait a minute and try again."
Show the message as sent. Chat: 6 messages a minute per `visitor_id`, 60 per IP. Login: 10 tries
in 15 minutes per IP and email. Nothing else is rate limited.
