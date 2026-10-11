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
            ├─ stores/       what several pages need at once (session, agent, counts)
            ├─ composables/  behaviour several components share (useAgentSection)
            ├─ api/          every call to the backend, through api/client.js
            ├─ lib/          plain functions: formatting, rules, lists
            └─ i18n/         every word on screen, in English and Bangla
assets/main.css      every colour, radius, shadow and shared class
```

Data goes one way: **api/** fetches, **stores/** or the page keeps it,
**components/** show it, and **lib/** helps format or decide. A component never
calls `fetch` and never imports from `api/` unless it owns a small self-contained
job (like `TelegramConnect.vue`, `AgentChat.vue` or `VoiceCall.vue`).

## Folders

| Folder | Put here | Do not put here |
|---|---|---|
| `src/pages/<area>/` | One file per route, named `<Thing>Page.vue`. A page loads its data, shows loading / error / empty states, and lays out components. Sub-sections of one page (child routes) sit beside it, named `<Thing>Section.vue`. | Reusable rows or panels (those are components). |
| `src/components/<area>/` | Pieces used by one area's pages: a row, a detail pane, an editor, an import panel. Folder named after the area (`records`, `menu`, `knowledge`, `agent`, `chat`, `conversations`). | Anything with its own route. |
| `src/components/ui/` | Pieces with no business knowledge, used across areas: `PageHeader`, `EmptyState`, `LoadError`, `SaveBar`, `FormProblems`, `StatusChip`, `LiveStatus`, `CopyField`, `ToggleSwitch`, `SkeletonRows`, `ShowMore`, `BrandMark`, `LanguageSwitch`. | Anything that knows about orders, doctors or the API. |
| `src/components/layout/` | The shell: `AppSidebar`, `AppTabBar`. | Page content. |
| `src/api/` | One file per backend resource. Every call goes through `request()` in `client.js`, which adds the session token itself (API functions take no token). Shape conversion (doctor to item, desk to preset) happens here, so pages see one shape. Return keys, not English words: a record's detail is `depositPaid`, the page shows `t('records.details.depositPaid')`. | UI state, formatting for display. |
| `src/stores/<name>.js` | Pinia setup stores (`defineStore('name', () => { ... })`): state more than one page needs at the same time. `auth` (session), `agent` (config, presets), `inbox` (sidebar counts), `ui` (test chat sheet, phone drawer). State is `ref`, derived values are `computed`, actions are plain functions. | Lists a single page shows (items, documents, records): the page fetches those itself. |
| `src/composables/` | `useSomething()` functions that hold behaviour several components share, with their own refs and lifecycle: `useAgentSection.js` (fill the form, dirty check, save, leave guard for an Agent settings section). | One-off helpers with no Vue in them (use `lib/`). |
| `src/i18n/` | `en.js` and `bn.js`: every word on screen, grouped by screen, same keys in both. `index.js`: the vue-i18n setup, `setLocale`, `localeTag` (for `Intl`) and `t` for plain JS files. | Words the backend sends (its errors, `missing`, the agent's replies): those show as they came. |
| `src/lib/` | Plain functions and constants with no Vue in them (words come from `t()` in `i18n/index.js`, called when the function runs, so a computed that calls it follows a language switch): `format.js` (money, numbers, time, greeting, in the chosen language), `group.js` (Today / Yesterday, avatars, `PAGE_SIZE`: rows per server page), `flows.js` (status buttons, mirrors backend `FLOWS`), `records.js` (one-line summaries), `navigation.js` (the menu), `setup.js` (Home checklist), `presets.js`, `channels.js`, `hours.js`, `slug.js`. | Components, or anything that calls the API. |
| `src/directives/` | Custom directives, imported where they are used as `vReveal` (`<script setup>` makes that `v-reveal`): `reveal.js` (an element settles in the first time it scrolls into view; CSS in `main.css`). | Anything with its own state or markup (use a component). |
| `src/assets/main.css` | Design tokens in `@theme`, and shared classes (`.btn`, `.field`, `.tabs`, `.row`, `.panel`, `.notice`, `.chip`, `.count`, `.segmented`, `.skeleton`). | Page-specific CSS (use `<style scoped>` in the component). |
| `docs/` | `api.md` (backend contract), `architecture.md` (this file), research notes. | Design tokens (those live in `DESIGN.md` at the root). |

## "I want to add..." (quick answers)

| You want to add | Where it goes | Copy this |
|---|---|---|
| A new screen in the sidebar | `pages/<area>/<Thing>Page.vue`, a route in `router.js`, an item in `lib/navigation.js` | `pages/channels/ChannelsPage.vue` |
| A new tab inside Agent settings | `pages/agent/<Thing>Section.vue`, a child route under `/agent`, an entry in `AgentPage.vue` `sections` | `pages/agent/AnswersSection.vue` |
| A new list with a detail pane | page in `pages/<area>/`, row and detail in `components/<area>/` | `pages/inbox/InboxPage.vue` + `components/records/` |
| A new backend call | a function in `api/<resource>.js` using `request()` | `api/telegram.js` |
| A new kind of record (e.g. reservations) | `api/records.js` `JOBS` and `JOBS_FOR`, `lib/flows.js` `FLOWS`, `lib/records.js` `summarize`, `StatusChip.vue` `LOOKS` for new statuses, and in both language files `status.*`, `flows.*`, `records.name`, `records.tabs`, `jobs.<kind>` | the `appointment` entries |
| A new channel (e.g. WhatsApp) | a card component in `components/agent/`, placed on `pages/channels/ChannelsPage.vue`; the icon in `lib/channels.js` and its words under `channels.*` in both language files; a line in Home's "Your agent" list | `components/agent/TelegramConnect.vue` |
| A new kind of business (preset) | icon and `KNOWN` in `lib/presets.js`, its list icon in `LIST_ICONS`, `api/agent.js` `JOBS`, and in both language files `presets.*`, `jobs.<kind>`, `payments.<kind>` and any new `profile.fields` | the `clinic` entries |
| A setup step on Home | `lib/setup.js` `setupSteps` (keep it to five or fewer) and, if the backend's `missing` text is new, `whereToFix` | the `share` step |
| Something every page needs to know | a Pinia store in `stores/` (or a `computed` on an existing one) | `stores/ui.js` |
| Words on a screen | a key in `i18n/en.js` and the same key in `i18n/bn.js`, then `t('area.key')` | the `inbox` group |
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
       <PageHeader :title="t('things.title')" :subtitle="t('things.subtitle')">
         <template #actions>
           <button type="button" class="btn btn-primary">{{ t('things.add') }}</button>
         </template>
       </PageHeader>

       <LoadError v-if="error" :message="error" @retry="load"></LoadError>
       <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>
       <EmptyState v-else-if="!things.length" :icon="PhPackage" :title="t('things.emptyTitle')" :text="t('things.emptyText')"></EmptyState>
       <div v-else class="border-t border-hairline">...rows...</div>
     </section>
   </template>

   <script setup>
   import { ref } from 'vue';
   import { useI18n } from 'vue-i18n';
   import { PhPackage } from '@phosphor-icons/vue';

   import PageHeader from '../../components/ui/PageHeader.vue';
   import LoadError from '../../components/ui/LoadError.vue';
   import SkeletonRows from '../../components/ui/SkeletonRows.vue';
   import EmptyState from '../../components/ui/EmptyState.vue';
   import { fetchThings } from '../../api/things.js';

   const { t } = useI18n();
   const things = ref([]);
   const loaded = ref(false);
   const error = ref(null);

   async function load() {
     error.value = null;
     try {
       things.value = await fetchThings();
       loaded.value = true;
     } catch (err) {
       error.value = err.message;
     }
   }

   load();
   </script>
   ```

   Add the `things.*` words to both `src/i18n/en.js` and `src/i18n/bn.js`.

2. Add the route in `src/router.js` with `meta: owner` (or `requiresAdmin`).
   Lazy-load it: `const ThingPage = () => import('./pages/<area>/ThingPage.vue');`
3. Add it to `lib/navigation.js`: daily work goes in the first group, setting
   the agent up goes in "Your agent". Pick a Phosphor icon. The sidebar, the
   phone drawer and the phone tab bar all read this list. Its label is a
   `nav.*` key.
4. If it needs data from the backend, add the call to `src/api/` first, and add
   the endpoint to `docs/api.md` if it is not there.

Every page has the four states: loading (a skeleton in the shape of the
content), error (`LoadError`, the backend's own sentence and Try again), empty
(`EmptyState`, says what to do next) and the content. One `btn-primary` per
screen.

### Add a section to Agent settings

1. Create `src/pages/agent/<Thing>Section.vue` and call
   `useAgentSection({ formFrom, patchFrom })` from `composables/useAgentSection.js`.
2. `formFrom(config)` returns what the inputs edit; `patchFrom(form)` returns
   only this section's fields (the API leaves the others alone). It gives back
   `form`, `isDirty`, `isSaving`, `saveError`, `problems`, `errors`,
   `savedNote`, `save` and `resetForm`.
3. End the form with `<SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm">`
   and put `<FormProblems :message="saveError" :problems="problems">` at the top.
4. Add a child route under `/agent` in `router.js` and an entry in the
   `sections` list in `pages/agent/AgentPage.vue`.

The composable already handles filling the form from the config, the
unsaved-changes check, the "leave without saving?" question and the saved note.

### Add a backend call

1. Add a function to the right `src/api/<resource>.js` that calls
   `request(path, { method, body, token })`. It throws an `Error` with
   `.status`, `.code`, `.fields` and the backend's `message`.
2. If the backend's shape differs from what pages use, convert it here (see
   `doctorToItem` in `api/agent.js`).
3. In the page, `try { ... } catch (err) { error.value = err.message; }` and
   show the sentence as it is. A function takes no token: `client.js` adds it.
4. Update `docs/api.md`.

### Add a record status or move

`lib/flows.js` mirrors the backend's `FLOWS`. Add the move there (the
`primary` next step and the rarer `others`, each `label` a `flows.*` key), add
the status's word as `status.<name>` in both language files, and a look (icon
plus colour) to `LOOKS` in `components/ui/StatusChip.vue`.
The server still decides (`409 invalid_transition`); the UI only offers legal
next steps.

## Rules that keep it consistent

- **`<script setup>` everywhere.** `ref` for state, `computed`, `watch`,
  plain functions, `onMounted` and friends; `defineProps`, `defineEmits`,
  `defineModel`. Shared behaviour is a composable, shared state a Pinia store.
  No Options API, no TypeScript.
- **Imported components are PascalCase in templates** (`<LoadError>`, `<PhTray>`).
  In `<script setup>` a kebab tag like `<load-error>` would resolve to a ref
  named `loadError` first. `router-link`, `router-view` and `i18n-t` stay kebab.
- **No words in code.** Every user-facing string is a key in `i18n/en.js` and
  `i18n/bn.js` (same keys; `t('key', { name })` fills `{name}`; English plurals
  are `'one | many'` with the count as the third argument, Bangla has one
  form). A sentence with a link or bold word inside uses `<i18n-t keypath>`
  with slots, never two half-sentences. Numbers, money and dates go through
  `lib/format.js` so Bangla mode shows Bangla digits.
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
  with a sticky day header. A list that grows forever asks the server for
  `PAGE_SIZE` rows (`limit`), and `ShowMore` asks for the next page
  (`before` = the oldest row's time). Copy `showMore` in `pages/inbox/InboxPage.vue`.
- **Fetch what the screen needs, once.** Read the agent from the store
  (`agent.load()` is cached), never fetch inside a loop over rows, debounce
  search inputs and drop out-of-order answers (`lastAsk` in `InboxPage.vue`).
  See [performance.md](performance.md).
- **Shared classes before new CSS.** Reach for `.btn`, `.field`, `.label`,
  `.hint`, `.tabs`, `.segmented`, `.row`, `.panel`, `.notice`, `.chip`, `.count` first.
- Run `npm run lint` and `npm run build` before you commit.
