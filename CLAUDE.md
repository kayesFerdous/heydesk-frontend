# CLAUDE.md

HeyDesk frontend: the owner's console for the HeyDesk API (`../heydesk`).
Read [PRODUCT.md](PRODUCT.md) first, then [DESIGN.md](DESIGN.md) (how it looks),
then [docs/architecture.md](docs/architecture.md) (where a new feature goes:
which folder, which file to copy, what to register). Keep architecture.md
current when you add a folder, a shared component or a new kind of page.
For anything touching the backend, read [docs/api.md](docs/api.md) (every
endpoint, schema, error code, limits, and a map of this frontend) instead of
exploring `../heydesk`. When the backend changes, update that file in the same
session.

## Rules

- **Vue 3, Composition API with `<script setup>`.** No Options API, no
  TypeScript, no UI kit. Pinia (setup stores in `src/stores/`), Vue Router 4,
  vue-i18n, bare `fetch`. Shared behaviour is a composable in
  `src/composables/`. The owner is learning and should be able to explain every
  line. Keep it simple, build the normal path well.
- **Two languages, English and Bangla.** No user-facing words in templates or
  scripts: every string is a key in `src/i18n/en.js` with the same key in
  `src/i18n/bn.js`. Components use `const { t } = useI18n()`; plain JS in
  `lib/` and `api/` imports `t` from `src/i18n/index.js`. Numbers, money and
  dates go through `lib/format.js` (Bangla digits in Bangla mode). The
  backend's own sentences (errors, `missing`, the agent's replies) show as sent.
- Imported components are written PascalCase in templates (`<LoadError>`), so
  a ref with the same camelCase name (`loadError`) can never shadow them.
- Every request goes through `src/api/client.js`, which also holds the session
  token (API functions take no token). The backend's error shape is
  `{ error: { code, message, fields? } }`; show `message` as-is.
- Money arrives in minor units (45000 = ৳450): always `formatMoney`. Times are
  UTC: always `formatTime` (agent timezone, default `Asia/Dhaka`).
- Colours, radii, shadows come from `@theme` in `src/assets/main.css`. One brand
  colour: Gigalogy's cobalt, used only for actions and selection. Green = success
  or live, amber = "needs a person", red = destructive, nothing else.
- Layout: a quiet paper sidebar (grouped nav, from `src/lib/navigation.js`) +
  edge-to-edge white work area; on phones a bottom tab bar and a drawer. Every
  page starts with `PageHeader`. No floating cards, no top banner. One cobalt
  primary action per screen.
- One shape rule (concentric): panels 12px, controls 8px, chips fully round.
- Shared classes first (`.btn`, `.field`, `.tabs`, `.row`, `.panel`, `.chip`),
  shared components next (`src/components/ui/`), new CSS last.
- Sentence case, never ALL CAPS. Numbers use tabular figures, not monospace.
- Lists are rows with hairlines, grouped "Today" / "Yesterday". Status is
  always icon plus word.
- Hide what a role cannot do instead of disabling it. Loading = skeleton in the
  shape of the content (`SkeletonRows`, `.skeleton`). Errors = `LoadError`.
  Empty states teach the next move (`EmptyState`).
- No em-dashes, no emoji, no eyebrow labels, no hand-rolled icons (use
  `@phosphor-icons/vue`).
- Record status buttons come from `src/lib/flows.js` (mirrors the backend's
  `FLOWS`); the server stays the judge.

## Commands

```bash
npm run serve   # :8080, proxies /api to :8000
npm run lint
npm run build
```

Design detector (run once when UI work is done):
`~/.claude/skills/impeccable/scripts/impeccable detect --json src`
