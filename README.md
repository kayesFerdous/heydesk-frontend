# HeyDesk frontend

The business owner's side of [HeyDesk](../heydesk): set up the AI front desk,
then watch what it took (orders, messages, hand-offs).

**Vue 3 with `<script setup>`**, Pinia, Vue Router 4, vue-i18n, Vite,
Tailwind CSS v4, bare `fetch`.

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

`/api/*` is proxied to `:8000` by [vite.config.js](vite.config.js), so there is no
CORS setup. Create a login with `uv run heydesk create-user you@example.com "a long password"`
in the backend repo, or use "Create your business account" on the sign-in page.

## Where things are

| | |
|---|---|
| [PRODUCT.md](PRODUCT.md) | who it is for, what they do, what is true of the API |
| [docs/research.md](docs/research.md) | how Google, Apple, OpenAI, Meta and Stripe build product UI, and what we took |
| [DESIGN.md](DESIGN.md) | v3 "Cobalt on paper": palette, type, shape, shell, signature details |
| [docs/architecture.md](docs/architecture.md) | where a new feature goes: folders, recipes, rules |
| [docs/image-prompts.md](docs/image-prompts.md) | 8 prompts to make the design references in ChatGPT |
| [docs/reference-notes.md](docs/reference-notes.md) | the Gigalogy console screenshots: what to keep (brand) and what to fix |

```
src/
  api/         one fetch helper (client.js), one module per resource
  store/       Vuex: auth, agent, inbox, ui; each split into state/getters/mutations/actions
  lib/         plain functions: format, flows, navigation, setup, records, group...
  mixins/      agentSection.js: load, save and leave-guard for Agent settings sections
  components/  layout (sidebar, tab bar), ui (shared), and one folder per area
  pages/       one folder per screen; Agent settings has three section child routes
  assets/      main.css: every colour, radius and shadow as @theme tokens, shared classes
```

See [docs/architecture.md](docs/architecture.md) for where a new feature goes.

## Status

Every owner screen is built and wired to the API:

- **Sign in / create account**, then **Setup** (choose a preset, your details, try it)
- **Home**: a five-step setup guide until the agent is complete, what needs
  you now (hand-offs and new records), today in one sentence, the agent at a glance
- **Inbox**: orders, appointments and messages grouped by day, search, next-step button
- **Conversations**: list, transcript, the hand-off banner, the records it made
- **Agent settings**: Profile, Hours and hand-off, Answers and tone; each saves
  on its own with a sticky save bar; live test chat beside the form
- **Menu** (or Services, Doctors): inline editing, availability, CSV import with a preview
- **Knowledge**: documents the agent searches
- **Channels**: the website chat link and the Telegram bot
- **Try your agent**: a chat sheet available from the sidebar on every page
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
