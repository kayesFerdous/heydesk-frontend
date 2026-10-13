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
  `unreadable_document` 422, `knowledge_unavailable` 503 (nothing saved, retry),
  `internal` 500.
- Money is minor units, times are UTC (see CLAUDE.md for the helpers).
- Roles: `owner` (own business) and `admin` (all, no business). Owners cannot
  send `instructions` or `preset` in a PATCH (403).

## Endpoints

Frontend file: `src/api/<file>.js`. "-" means the frontend does not call it.

### Auth (`auth.js`)
| Call | What it does |
|---|---|
| `POST /auth/signup` `{email, password>=8, workspace_name}` | New business + owner. Returns `{token}` |
| `POST /auth/login` `{email, password}` | Returns `{token}` |
| `GET /auth/me` | `{email, role, business: {id, name, status: active/suspended} \| null}` |

### Agent (`agent.js`)
| Call | What it does |
|---|---|
| `GET /presets` (public) | `[{id, label, description, greeting, instructions, jobs[{id,label,description}], tools[], items_label, knowledge_schema}]`. `knowledge_schema` is JSON schema; the Agent page builds the "About your business" fields from it |
| `POST /agent` `{preset, config?, items?}` | Create the agent from a preset. 201. One per business |
| `GET /agent` | `{public_key, config, jobs[{id,label,description}], missing[]}`. 404 `not_found` until created |
| `PATCH /agent` `{...config fields}` | Top-level fields replace: send the whole `knowledge`, the whole `handoff`. Live on next message. 422 `invalid_config` |
| `GET /agent/items` | The menu/services list |
| `PUT /agent/items` `[Item]` | Replace the whole list, in order |
| `POST /menu/import`, `/doctors/import`, `/products/import` `{csv, mapping?, dry_run?}` | `{saved, count, preview[5]}`. Replaces the list unless `dry_run`. `mapping` is `{ourField: theirColumn}` from `/suggest`, as the owner checked it; without it columns are matched by name. 422 `invalid_config` with `fields` per row ("row 3") or `mapping` (D53) |
| `POST /menu/import/suggest`, `/doctors/import/suggest`, `/products/import/suggest` `{csv}` | `{columns[{name, about, required}], headers[], samples[3]{header: text}, mapping{field: header}, by_ai}`. The AI's guess at the match; `by_ai: false` means it matched by name only. One model call per request (D53) |

`Item`: `{code, name, description, price (minor units), category, tags[], available, attributes{}}`.

`config` (AgentConfig): `preset, name, business_name, timezone ("Asia/Dhaka"),
country, currency, greeting, instructions (admin), notes (owner, 4000),
knowledge{} (per preset), faq (20000), handoff{message, phone, email}`.

### A shop (`agent.js`, D45, D54)
| Call | What it does |
|---|---|
| `GET /products` | `[Product]`, in the shop's order |
| `PUT /products` `[Product]` | Replace the whole list. **Send every field back**, or it's lost: the Products page edits one row and PUTs them all |
| `GET /shop/orders`, `PATCH /shop/orders/{id}` `{status?, tracking?}` | The shop's orders, paged (D46); move one along, or set the courier and parcel id |

`Product`: `{code, name, description, price, was_price (before a sale; null: not on sale), category,
sizes[], colours[], stock (null: not counted; 0: sold out)}`. Money in minor units. The Products page
shows `was_price` crossed out when it's above `price`.

A shop's config adds `delivery[{name, charge, days, places[]}]` (`places`: what buyers say instead
of the area's name, "Mirpur" for Inside Dhaka; the agent works out the area from them),
`free_delivery_over`, `policies`, `size_guide` (free text; the agent suggests a size only from it)
and `pay_first`. The Delivery and payments section sends the whole `delivery`, places included; the
profile section shows `policies` and `size_guide` as long fields.

Jobs (`presets/jobs.yaml`): `order` (pickup order, makes an `order` record),
`appointment` and `message` (both make a `request` record). The owner cannot toggle
them. Since D37 a preset fixes its jobs and tools, owners cannot switch them,
`GET /jobs` and `config.jobs` are gone, and `GET /agent` returns the read-only
`jobs` list. The Agent page shows it as plain rows.

### Documents / knowledge base (`agent.js`, page `pages/knowledge`)
Searched by the agent when a question is not answered elsewhere. Needs an
agent (404 before). Indexed before the call returns (a few seconds).
| Call | What it does |
|---|---|
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
`channel: "telegram"` (`lib/channels.js` labels web, voice and Telegram).

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
| `GET /conversations?status=active\|needs_human` | `[{id, channel, status, created_at, updated_at}]` |
| `GET /conversations/{id}` | Plus `messages[{role: user/assistant, text}]` and `records[]` |

### Visitor chat (`chat.js`, public, the public key is the credential)
| Call | What it does |
|---|---|
| `GET /chat/{public_key}` | `{name, greeting}`. 404 unknown, 404 `unavailable` if suspended |
| `POST /chat/{public_key}` `{message, conversation_id?, visitor_id}` | SSE stream: `open{conversation_id}`, `token{text}`, `status{label}`, `handoff{message,phone,email}`, `done{interrupted}`, `error{message}`. 409 `conversation_full`. `visitor_id` (8 to 64 characters) is the browser's token from `lib/visitor.js`; 422 without it. 429 `visitor_limited` when the visitor is blocked (five off-topic turns in a row block them for a day) or over today's turns (30 a visitor, 500 a business); its message says how to reach the business (backend D51). 429 `rate_limited` past 6 messages a minute from one visitor_id or 60 from one IP (backend D52) |
| `GET /voice/ice` | ICE servers for a call: STUN, plus a Cloudflare TURN relay when the backend has keys |
| `POST /voice/offer?key=<public_key>&visitor=<token>` `{sdp, type}` | WebRTC voice. `visitor` is the same token as the chat's; a limited visitor gets the chat's 429 before the call connects. Send one offer with every ICE candidate (wait for gathering to complete, so no PATCH is needed); the answer is `{sdp, type}`. The microphone must be the first transceiver; open a data channel and ping it each second so the server notices a closed tab. Audio only, no transcript comes back; the call is saved as a `voice` conversation. 404 unknown key. Client: `api/voice.js`, `components/chat/VoiceCall.vue` |
| `PATCH /voice/offer` | Trickle ICE candidates (the frontend does not use it) |
| `GET /` (backend) | Plain dev chat page at `/?key=<public_key>`; the dev server still forwards `/demo/` to it. The shared link is now the frontend's own page: `lib/presets.js chatLink` builds `<this origin>/chat/<public_key>` (`pages/chat/ChatPage.vue`) |

### Admin (`admin.js`, role admin only, under `/api/admin`)
| Call | What it does |
|---|---|
| `GET /businesses` | `[{id, name, status, preset, owner_email, conversations, last_activity_at, created_at}]` |
| `PATCH /businesses/{workspace_id}` `{status}` | Suspend or reactivate. 204 |
| `GET /users` | `[{id, email, role, workspace_id, business_name, created_at}]` |
| `POST /users/{id}/password` | `{password}` temporary, shown once |
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
- `src/router.js`: `/` (landing page when signed out, else Home or Admin), `/chat/:key` (public, the customer's chat page), `/home /inbox /conversations /agent/{profile,hours,answers}
  /menu /knowledge /channels` (owner), `/admin` (admin), `/setup`, `/sign-in`.
  Guards use route `meta`. `/inbox?job=&open=` and `/conversations?open=`
  open one item.
- Pages: `pages/{landing,home,inbox,conversations,agent,menu,knowledge,channels,setup,admin,auth,chat}`.
  Shared pieces in `components/{ui,layout,records,conversations,menu,knowledge,agent,chat}`.
  Agent settings sections share `composables/useAgentSection.js`; each PATCHes
  only its own fields (the API leaves the rest).
- `src/lib/`: `flows.js` (status buttons), `format.js` (money, time, day,
  greeting, ago), `group.js` (Today/Yesterday, avatars), `records.js`
  (one-line summaries), `navigation.js` (the sidebar and tab bar), `setup.js`
  (Home checklist, where each `missing` item is fixed), `hours.js`,
  `presets.js` (icons, nouns, chat link), `channels.js`, `slug.js`.
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
