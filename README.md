# HeyDesk frontend

The business owner's side of [HeyDesk](../heydesk): set up the AI front desk,
then watch what it took (orders, messages, hand-offs).

**Vue 3 runtime, Options API only**, Vuex 4, Vue Router 4, Vue CLI 5,
Tailwind CSS v4, bare `fetch`. The same stack and style as
`../../store-manager-vue`, on purpose (Gigalogy runs Vue 2).

## Running it

The API first (from `../heydesk`):

```bash
uv run uvicorn heydesk.main:app --reload   # http://localhost:8000
```

Then:

```bash
npm install
npm run serve                               # http://localhost:8080
```

`/api/*` is proxied to `:8000` by [vue.config.js](vue.config.js), so there is no
CORS setup. Create a login with `uv run heydesk create-user you@example.com "a long password"`
in the backend repo, or use "Create your business account" on the sign-in page.

## Where things are

| | |
|---|---|
| [PRODUCT.md](PRODUCT.md) | who it is for, what they do, what is true of the API |
| [docs/research.md](docs/research.md) | how Google, Apple, OpenAI, Meta and Stripe build product UI, and what we took |
| [docs/design-direction.md](docs/design-direction.md) | v2 "Cobalt": palette, type, shape, shell, screen list |
| [docs/image-prompts.md](docs/image-prompts.md) | 8 prompts to make the design references in ChatGPT |
| [docs/reference-notes.md](docs/reference-notes.md) | the Gigalogy console screenshots: what to keep (brand) and what to fix |

```
src/
  api/         one fetch helper (client.js), one module per resource
  store/       Vuex: auth, inbox; each split into state/getters/mutations/actions
  lib/         format.js (money, times), flows.js (record status steps)
  components/  layout, ui, records
  pages/       one per route
  assets/      main.css: every colour, radius and easing as @theme tokens
```

## Status

Every owner screen is built and wired to the API:

- **Sign in / create account**, then **Setup** (choose a preset, your details, try it)
- **Inbox**: orders and messages grouped by day, search, next-step button
- **Conversations**: list, transcript, the hand-off banner, the records it made
- **Your agent**: sections for basics, business details (from the preset's
  schema), opening hours, tone notes, FAQ and hand-off; live test chat
- **Menu** (or Services, Doctors): inline editing, availability, CSV import with a preview
- **Talk to your agent**: a chat sheet available from the rail on every page
- **Admin** (platform admins only): businesses (suspend), owners (reset password), activity

Not built yet: voice calls from the browser (the backend has `/api/voice/offer`,
WebRTC), an admin acting inside a business (`X-Business`), and editing item
attributes (a doctor's days) outside the CSV import.

### Things the backend could make better

- `GET /api/conversations` returns no customer name or preview, so the list opens
  the newest 30 to fill them in. A name and last line in the list row would fix it.
- Nothing clears a conversation's `needs_human` flag, so the banner stays after a
  call back. A `PATCH /api/conversations/{id}` would let the owner mark it handled.
- The shareable chat link is the backend's dev page, reached at `<this origin>/demo/?key=...`
  (the dev server forwards `/demo/`). Production needs a real customer page.
- Test chats in the app are saved like real ones (same endpoint).
