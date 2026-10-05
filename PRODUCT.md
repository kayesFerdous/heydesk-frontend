# PRODUCT.md

**HeyDesk** is the business owner's side of an AI front desk: set up the agent
that answers customers by web chat or voice, then watch what it took.

> Written 4 Oct 2026 from the backend repo (`../heydesk`: README, PLAN,
> CLAUDE.md, API routes) and the owner's brief. The audience, tone and
> anti-references below were **inferred, not interviewed**; correct them if
> they are wrong. Nothing here is invented about the API.

## Register

**Product (Operate).** The UI serves a task. There is no marketing site in this
repo; the login page is the front door and is deliberately small.

## Who uses it

An **owner of a small business** (a restaurant, a clinic, a front-office), in
Dhaka first. Not technical. Uses a laptop at the shop or a phone between
customers. English UI today; the customer-facing agent may talk to visitors in
other languages, which the owner should see in transcripts verbatim.

A second, rare user: a **HeyDesk admin** (platform staff) who sees all
businesses, can suspend one, reset a password and read an audit log.

## What the owner does, in order of frequency

1. **Check the inbox.** Orders (to confirm, mark ready, mark collected) and
   messages (to read, call back). The sidebar shows how many are waiting per
   job (`GET /api/inbox`).
2. **Handle hand-offs.** A conversation flagged `needs_human` is a customer
   waiting for a person. Open it, read the transcript, act.
3. **Read conversations.** Transcript of what the agent said, and the orders or
   messages that came out of it.
4. **Keep the menu / services current.** Items, prices, availability, a CSV
   import. The preset names the list ("Menu", "Services").
5. **Tune the agent.** Name, greeting, opening hours, address, policies, FAQ,
   hand-off phone, and `notes` for tone and rules. Edits are **live on the next
   message**, with no publish step.
6. **Set up once.** Pick a preset (restaurant host, receptionist, clinic front
   desk), fill what `missing` lists, test it, share the chat link.

## Product truth (do not contradict)

- One agent per business. No ids in URLs; the token carries the workspace.
- **The model talks; Python decides every price, total and time.** Nothing is
  saved until the agent has read it back and the customer said a clear yes. The
  UI must never suggest the owner is approving an order the AI invented: an
  order in the inbox is already confirmed by the customer.
- Money is in minor units (paisa): 45000 means ৳450. Display `৳450`, never raw.
- Timezone is per agent (`Asia/Dhaka`); show times in it.
- Roles: `owner` (their business) and `admin` (all). An owner **cannot** edit
  `instructions`, `tools` or `preset`; they write `notes`. Hide, do not disable,
  what they cannot do, and say where to ask.
- A suspended business (`status: suspended`) has an agent that no longer
  answers. The UI must say so plainly, at the top.
- Errors come back as `{ error: { code, message, fields? } }`. Show the
  backend's own sentence. `422 invalid_config` carries per-field problems.
- Status changes are guarded (`409 invalid_transition`): offer only the next
  legal step instead of a free-for-all dropdown.
- Login token is a bearer JWT; a 401 means sign in again.

## Constraints that outrank taste

- Same stack and style as `../store-manager-vue`: **Vue 3 runtime, Options API
  only, Vuex 4, Vue Router 4, Vue CLI 5, Tailwind v4, bare `fetch`**. Chosen
  because Gigalogy runs Vue 2 and the owner is practising patterns that carry
  over. No Composition API, no TypeScript, no UI kit.
- Every pattern should be one the owner can explain line by line.
- Dev server proxies `/api` to the FastAPI app on `:8000` (no CORS setup needed).

## Brand and tone

- Friendly, direct, short sentences. "Your agent is live." not "Agent
  deployment successful."
- Calm confidence of a tool that handles money and customers: no hype, no
  gamification, no emoji in the UI.
- Plain words over system words: "Menu", "Messages", "Opening hours", never
  "items payload", "workspace", "record".

## Anti-references

- The Gigalogy console (see [docs/reference-notes.md](docs/reference-notes.md)):
  Material-default, blue band, giant empty fields, jargon.
- The generic AI-SaaS look: purple gradients, glassmorphism everywhere, three
  equal feature cards, hero metrics.
- The cream + brass "artisan" palette already used in `store-manager-vue`.
- **The v1 HeyDesk theme** (pale stone canvas, floating white card, pill nav,
  green accent), rejected by the owner as "what most AI tools produce".
  HeyDesk is instead an **upgrade of Gigalogy's own identity** (cobalt
  `#004AAC`, indigo navy, dot-network logo), built on the research in
  [docs/research.md](docs/research.md).

## Success looks like

A first-time owner goes from sign-up to a **working, tested agent in under five
minutes**, and every morning after that opens the inbox and understands in one
glance what needs them.
