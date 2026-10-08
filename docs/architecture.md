# Where things go

Read this before adding a feature. It says which folder a new piece of code
belongs in, which existing piece to copy, and what to update so the app stays
in one style. For how things look, see [../DESIGN.md](../DESIGN.md). For the
backend, see [api.md](api.md). Keep this file current: when you add a folder,
a shared component or a new kind of page, add a line here in the same change.

## The app in one picture

```
router.js            which page shows for a URL, and who may see it
  └─ App.vue         the shell: sidebar (desktop), tab bar + drawer (phone),
                     the paused banner, the test chat sheet
       └─ pages/     one folder per screen; a page fetches its own lists
            ├─ components/   pieces of a page (rows, panels, editors)
            │    └─ components/ui/   pieces every page shares
            ├─ store/        what several pages need at once (session, agent, counts)
            ├─ api/          every call to the backend, through api/client.js
            └─ lib/          plain functions: formatting, rules, lists
assets/main.css      every colour, radius, shadow and shared class
```

Data goes one way: **api/** fetches, **store/** or the page keeps it,
**components/** show it, and **lib/** helps format or decide. A component never
calls `fetch` and never imports from `api/` unless it owns a small self-contained
job (like `TelegramConnect.vue`, `AgentChat.vue` or `VoiceCall.vue`).

## Folders

| Folder | Put here | Do not put here |
|---|---|---|
| `src/pages/<area>/` | One file per route, named `<Thing>Page.vue`. A page loads its data, shows loading / error / empty states, and lays out components. Sub-sections of one page (child routes) sit beside it, named `<Thing>Section.vue`. | Reusable rows or panels (those are components). |
| `src/components/<area>/` | Pieces used by one area's pages: a row, a detail pane, an editor, an import panel. Folder named after the area (`records`, `menu`, `knowledge`, `agent`, `chat`, `conversations`). | Anything with its own route. |
| `src/components/ui/` | Pieces with no business knowledge, used across areas: `PageHeader`, `EmptyState`, `LoadError`, `SaveBar`, `FormProblems`, `StatusChip`, `LiveStatus`, `CopyField`, `ToggleSwitch`, `SkeletonRows`, `BrandMark`. | Anything that knows about orders, doctors or the API. |
| `src/components/layout/` | The shell: `AppSidebar`, `AppTabBar`. | Page content. |
| `src/api/` | One file per backend resource. Every call goes through `request()` in `client.js`. Shape conversion (doctor to item, desk to preset) happens here, so pages see one shape. | UI state, formatting for display. |
| `src/store/modules/<name>/` | State more than one page needs at the same time: `auth` (session), `agent` (config, presets), `inbox` (sidebar counts), `ui` (test chat sheet, phone drawer). Split into `state`, `getters`, `mutations`, `actions`. | Lists a single page shows (items, documents, records): the page fetches those itself. |
| `src/lib/` | Plain functions and constants with no Vue in them: `format.js` (money, time, greeting), `group.js` (Today / Yesterday, avatars), `flows.js` (status buttons, mirrors backend `FLOWS`), `records.js` (one-line summaries), `navigation.js` (the menu), `setup.js` (Home checklist), `presets.js`, `channels.js`, `hours.js`, `slug.js`. | Components, or anything that calls the API. |
| `src/mixins/` | Behaviour several components share, written in Options API: `agentSection.js` (load, dirty check, save, leave guard for an Agent settings section). | One-off helpers (use `lib/`). |
| `src/assets/main.css` | Design tokens in `@theme`, and shared classes (`.btn`, `.field`, `.tabs`, `.row`, `.panel`, `.notice`, `.chip`, `.count`, `.segmented`, `.skeleton`). | Page-specific CSS (use `<style scoped>` in the component). |
| `docs/` | `api.md` (backend contract), `architecture.md` (this file), research notes. | Design tokens (those live in `DESIGN.md` at the root). |

## "I want to add..." (quick answers)

| You want to add | Where it goes | Copy this |
|---|---|---|
| A new screen in the sidebar | `pages/<area>/<Thing>Page.vue`, a route in `router.js`, an item in `lib/navigation.js` | `pages/channels/ChannelsPage.vue` |
| A new tab inside Agent settings | `pages/agent/<Thing>Section.vue`, a child route under `/agent`, an entry in `AgentPage.vue` `sections` | `pages/agent/AnswersSection.vue` |
| A new list with a detail pane | page in `pages/<area>/`, row and detail in `components/<area>/` | `pages/inbox/InboxPage.vue` + `components/records/` |
| A new backend call | a function in `api/<resource>.js` using `request()` | `api/telegram.js` |
| A new kind of record (e.g. reservations) | `api/records.js` `JOBS` and `JOBS_FOR`, `lib/flows.js` `FLOWS` and `STATUS_LABELS`, `lib/records.js` `JOB_TABS` and `summarize`, `StatusChip.vue` `LOOKS` for new statuses | the `appointment` entries |
| A new channel (e.g. WhatsApp) | a card component in `components/agent/`, placed on `pages/channels/ChannelsPage.vue`; the label and icon in `lib/channels.js`; a line in Home's "Your agent" list | `components/agent/TelegramConnect.vue` |
| A new kind of business (preset) | icon and noun in `lib/presets.js`, its list link in `listLinks`, field words in `pages/agent/ProfileSection.vue` `FIELD_WORDS`, `api/agent.js` `JOBS` and `ITEMS_LABEL` | the `clinic` entries |
| A setup step on Home | `lib/setup.js` `setupSteps` (keep it to five or fewer) and, if the backend's `missing` text is new, `whereToFix` | the `share` step |
| Something every page needs to know | a store module (or a getter on an existing one) | `store/modules/ui/index.js` |
| A shared visual piece (badge, banner, field) | `components/ui/` if it knows nothing about the business; a class in `main.css` if it is only styling | `components/ui/EmptyState.vue` |
| A new colour, radius or shadow | `@theme` in `main.css`, and a line in `DESIGN.md`. Never a hex value inside a component. | `--color-attention` |
| A formatting rule (dates, money, plurals) | `lib/format.js` | `formatAgo` |
| A public page (no sign-in, no shell) | `pages/<area>/`, route meta `{ bare: true }` and no `requiresAuth` | `pages/chat/ChatPage.vue` |
| An admin-only screen | `pages/admin/`, route meta `requiresAdmin`, the admin group in `lib/navigation.js` | `pages/admin/AdminPage.vue` |

## Recipes

### Add a page to the sidebar

1. Create `src/pages/<area>/<Thing>Page.vue` with this shape:

   ```vue
   <template>
     <section class="flex flex-col lg:h-full">
       <page-header title="Thing" subtitle="One sentence: what this is for.">
         <template #actions>
           <button type="button" class="btn btn-primary">Add thing</button>
         </template>
       </page-header>

       <load-error v-if="error" :message="error" @retry="load"></load-error>
       <skeleton-rows v-else-if="!loaded" class="border-t border-hairline"></skeleton-rows>
       <empty-state v-else-if="!things.length" :icon="icons.empty" title="No things yet" text="What it is, and how to add the first one."></empty-state>
       <div v-else class="border-t border-hairline">...rows...</div>
     </section>
   </template>
   ```

2. Add the route in `src/router.js` with `meta: owner` (or `requiresAdmin`).
   Lazy-load it: `const ThingPage = () => import('./pages/<area>/ThingPage.vue');`
3. Add it to `lib/navigation.js`: daily work goes in the first group, setting
   the agent up goes in "Your agent". Pick a Phosphor icon. The sidebar, the
   phone drawer and the phone tab bar all read this list.
4. If it needs data from the backend, add the call to `src/api/` first, and add
   the endpoint to `docs/api.md` if it is not there.

Every page has the four states: loading (a skeleton in the shape of the
content), error (`LoadError`, the backend's own sentence and Try again), empty
(`EmptyState`, says what to do next) and the content. One `btn-primary` per
screen.

### Add a section to Agent settings

1. Create `src/pages/agent/<Thing>Section.vue` with `mixins: [agentSection]`.
2. Define `formFrom(config)` (what the inputs edit) and `patchFrom(form)`
   (only this section's fields; the API leaves the others alone).
3. End the form with `<save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm">`
   and put `<form-problems :message="saveError" :problems="problems">` at the top.
4. Add a child route under `/agent` in `router.js` and an entry in the
   `sections` list in `pages/agent/AgentPage.vue`.

The mixin already handles loading the config, the unsaved-changes check, the
"leave without saving?" question and refreshing the test chat after a save.

### Add a backend call

1. Add a function to the right `src/api/<resource>.js` that calls
   `request(path, { method, body, token })`. It throws an `Error` with
   `.status`, `.code`, `.fields` and the backend's `message`.
2. If the backend's shape differs from what pages use, convert it here (see
   `doctorToItem` in `api/agent.js`).
3. In the page, `try { ... } catch (error) { this.error = error.message; }` and
   show the sentence as it is.
4. Update `docs/api.md`.

### Add a record status or move

`lib/flows.js` mirrors the backend's `FLOWS`. Add the move there (the
`primary` next step and the rarer `others`), add a label to `STATUS_LABELS`,
and a look (icon plus colour) to `LOOKS` in `components/ui/StatusChip.vue`.
The server still decides (`409 invalid_transition`); the UI only offers legal
next steps.

## Rules that keep it consistent

- **Options API only.** `data`, `computed`, `watch`, `methods`, lifecycle
  hooks, `mixins`. No `<script setup>`, no Composition API, no TypeScript.
- **Every request through `api/client.js`.** Show `error.message` as it is.
- **Money** through `formatMoney` (minor units), **times** through
  `formatTime` / `formatDay` / `formatAgo` in the agent's timezone.
- **Colours from tokens only** (`text-ink-soft`, `bg-brand-tint`,
  `border-hairline`). Cobalt means "act here" or "selected". Green is live or
  done, amber is "needs a person", red is destructive. Nothing else gets colour.
- **Status is an icon plus a word** (`StatusChip`, `LiveStatus`), never colour alone.
- **Hide what a role cannot do**; do not show disabled buttons for it.
- **Sentence case**, no ALL CAPS, no em-dashes, no emoji, no labels above
  headings. Icons from `@phosphor-icons/vue` only.
- **Lists are rows** with hairlines, grouped Today / Yesterday (`groupByDay`),
  with a sticky day header.
- **Shared classes before new CSS.** Reach for `.btn`, `.field`, `.label`,
  `.hint`, `.tabs`, `.segmented`, `.row`, `.panel`, `.notice`, `.chip`, `.count` first.
- Run `npm run lint` and `npm run build` before you commit.
