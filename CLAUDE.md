# CLAUDE.md

HeyDesk frontend: the owner's console for the HeyDesk API (`../heydesk`).
Read [PRODUCT.md](PRODUCT.md) first, then [docs/design-direction.md](docs/design-direction.md).
For anything touching the backend, read [docs/api.md](docs/api.md) (every
endpoint, schema, error code, limits, and a map of this frontend) instead of
exploring `../heydesk`. When the backend changes, update that file in the same
session.

## Rules

- **Vue 3 runtime, Options API only.** No `<script setup>`, no Composition API,
  no TypeScript, no UI kit. Vuex 4, Vue Router 4, bare `fetch`. Same style as
  `../../store-manager-vue`; the owner is learning and should be able to explain
  every line. Keep it simple, build the normal path well.
- Every request goes through `src/api/client.js`. The backend's error shape is
  `{ error: { code, message, fields? } }`; show `message` as-is.
- Money arrives in minor units (45000 = ৳450): always `formatMoney`. Times are
  UTC: always `formatTime` (agent timezone, default `Asia/Dhaka`).
- Colours, radii, shadows come from `@theme` in `src/assets/main.css`. One brand
  colour: Gigalogy's cobalt, used only for actions and selection. Green = success
  or live, amber = "needs a person", red = destructive, nothing else.
- Layout: full-height navy rail + edge-to-edge white work area. No floating
  cards, no pill nav, no top banner. One large cobalt primary action per screen.
- One shape rule (concentric): panels 14px, controls 10px, chips fully round.
- Sentence case, never ALL CAPS. Numbers use tabular figures, not monospace.
- Lists are rows with hairlines, grouped "Today" / "Yesterday". Status is
  always icon plus word.
- Hide what a role cannot do instead of disabling it. Loading = skeleton in the
  shape of the content. Empty states teach the next move.
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
