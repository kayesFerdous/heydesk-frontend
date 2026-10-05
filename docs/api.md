# Backend API and frontend map

Read this instead of crawling `../heydesk`. Source of truth if it drifts:
`../heydesk/src/heydesk/api/*.py` (routes, schemas), `runtime/config.py`
(agent config), `errors.py` (error codes), `presets/jobs.yaml` (jobs).
Last synced 4 Oct 2026 (after agent jobs + document ingest).

## Conventions

- Base `/api`, JSON, `Authorization: Bearer <token>`. The token carries the
  workspace, so there are no ids for the business in URLs.
- Errors: `{ error: { code, message, fields? } }`. `client.js` turns it into
  `Error` with `.status`, `.code`, `.fields`. Show `message` as-is.
- Codes: `bad_request` 400, `unauthorized` 401, `forbidden` 403, `not_found`
  404, `unavailable` 404 (suspended business chat), `conflict` 409,
  `invalid_transition` 409, `conversation_full` 409, `invalid_config` 422
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
| `GET /presets` (public) | `[{id, label, description, greeting, instructions, jobs[], items_label, knowledge_schema}]`. `knowledge_schema` is JSON schema; the Agent page builds the "About your business" fields from it |
| `GET /jobs` | - (the same list arrives as `abilities` on `GET /agent`) |
| `POST /agent` `{preset, config?, items?}` | Create the agent from a preset. 201. One per business |
| `GET /agent` | `{public_key, config, abilities[{id,label,description,enabled}], missing[]}`. 404 `not_found` until created |
| `PATCH /agent` `{...config fields}` | Top-level fields replace: send the whole `knowledge`, the whole `handoff`, the whole `jobs` list. Live on next message. 422 `invalid_config` |
| `GET /agent/items` | The menu/services list |
| `PUT /agent/items` `[Item]` | Replace the whole list, in order |
| `POST /agent/items/import` `{csv, mapping?, dry_run?}` | `{saved, count, attributes[], preview[5]}`. Replaces items unless `dry_run`. Known columns: name, price, category, tags, description, code, available; other columns become `attributes`. Frontend does not send `mapping` yet |

`Item`: `{code, name, description, price (minor units), category, tags[], available, attributes{}}`.

`config` (AgentConfig): `preset, name, business_name, timezone ("Asia/Dhaka"),
country, currency, greeting, instructions (admin), notes (owner, 4000),
knowledge{} (per preset), faq (20000), jobs[] , handoff{message, phone, email}`.

Jobs (`presets/jobs.yaml`): `order` (pickup order, makes an `order` record),
`appointment` and `message` (both make a `request` record). The owner toggles
them in `config.jobs`. The inbox only lists jobs that are on.

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

### Inbox and records (`records.js`)
| Call | What it does |
|---|---|
| `GET /inbox` | `[{job, title, kind, waiting, total}]` for the sidebar badges |
| `GET /records?job=&status=&q=` | Newest first. `q` matches number, name or phone |
| `GET /records/{id}` | - |
| `PATCH /records/{id}` `{status}` | 409 `invalid_transition` if not legal. Legal moves mirrored in `lib/flows.js` |

`Record`: `{id, conversation_id, job, kind: order/request, number, status,
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
| `POST /chat/{public_key}` `{message, conversation_id?}` | SSE stream: `open{conversation_id}`, `token{text}`, `status{label}`, `handoff{message,phone,email}`, `done{interrupted}`, `error{message}`. 409 `conversation_full` |
| `POST/PATCH /voice/offer` | WebRTC voice. - |
| `GET /` (backend) | Plain chat page at `/?key=<public_key>`; `lib/presets.js chatLink` builds it |

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
  401 handler). `chat.js` streams with its own fetch because of SSE.
- `src/store/modules/`: `auth` (token, me), `agent` (info, presets; getters
  `config`, `abilities`, `missing`, `preset`, `itemsLabel`), `inbox` (badge
  counts), `ui` (test chat sheet). Pages fetch lists (items, documents,
  records) themselves, they are not in the store.
- `src/router.js`: `/inbox /conversations /menu /knowledge /agent` (owner),
  `/admin` (admin), `/setup`, `/sign-in`. Guards use route `meta`.
- Pages: `pages/{inbox,conversations,menu,knowledge,agent,setup,admin,auth}`.
  Shared pieces in `components/{ui,layout,records,conversations,menu,knowledge,agent,chat}`.
- `src/lib/`: `flows.js` (status buttons), `format.js` (money, time, day),
  `group.js` (Today/Yesterday), `hours.js`, `presets.js` (icons, nouns, chat
  link), `slug.js`.

## Not built yet (backend supports it)

Admin view of an owner's documents or jobs, import column `mapping`, voice
channel UI, `GET /records/{id}` deep links.
