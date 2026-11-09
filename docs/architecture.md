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
job (like `TelegramConnect.vue`, `AgentChat.vue`, or `OrderCall.vue`, an
order's call line in the Inbox).

## Folders

| Folder | Put here | Do not put here |
|---|---|---|
| `src/pages/<area>/` | One file per route, named `<Thing>Page.vue`. A page loads its data, shows loading / error / empty states, and lays out components. Sub-sections of one page (child routes) sit beside it, named `<Thing>Section.vue`. | Reusable rows or panels (those are components). |
| `src/components/<area>/` | Pieces used by one area's pages: a row, a detail pane, an editor, an import panel. Folder named after the area (`records`, `menu`, `knowledge`, `agent`, `chat`, `conversations`, `calls`). | Anything with its own route. |
| `src/components/ui/` | Pieces with no business knowledge, used across areas: `PageHeader`, `EmptyState`, `LoadError`, `SaveBar`, `FormProblems`, `StatusChip`, `LiveStatus`, `CopyField`, `ToggleSwitch`, `SkeletonRows`, `ShowMore`, `BrandMark`, `LanguageSwitch`, `InfoTip`, `FieldLabel`, `SettingsGroup`, `ConnectionRow` (a ruled row for something the business connects: logo tile, name over one line, Connected or Set up, and a caret that opens its body; used by Channels and Delivery and payments), `CodeInput` (the six cells of an emailed code), `TagField` (a text box where the backend's tags, `{total}` and friends, show as coloured pills the owner adds with buttons and deletes like a letter; the welcome message and the call's first line). | Anything that knows about orders, doctors or the API. |
| `src/components/layout/` | The shell: `AppSidebar` (black panel, nav counts, the needs-a-person strip), `AppTabBar`. | Page content. |
| `src/components/coupons/` | `DiscountPicker` (what a coupon or an offer takes off: the three kinds as a segmented switch, then the amount with `%` or `৳` beside it). | Anything another page needs. |
| `src/components/home/` | Home's pieces: `WeekBars` (the last seven days, one bar a day). | Anything another page needs. |
| `src/components/landing/` | The landing page's pieces, all made-up data: `NightStory` (the problem: a pinned night the scroll runs, the clock and a phone filling with unanswered messages), `OneOrder` (how it works: one message followed across three pinned lanes, run by the scroll), `HeroConsole` (the hero's simplified console, plain HTML that is never scaled), `PerkLanguages`, `PerkPerson`, `PerkMorning` (the what-changes cards, each playing one idea), `SetupHub` (channels wiring up to the assistant), `HourBars` (a made-up day, hour by hour), `RollingNumber` (a figure whose digits roll), `AskTry` (the one live thing: pick a question, the answer comes back in its language), `ScrollWords` (a paragraph whose words light as it scrolls up; words between stars get a lime marker), `SplitWords` (a heading whose words rise in once an ancestor is `is-shown`), `ExampleTag` (the one way an example says it is one), `InboxRow` (one inbox row, also on sign-in). | Anything that calls the API. |
| `src/api/` | One file per backend resource. Every call goes through `request()` in `client.js`, and the browser sends the session cookie itself (API functions take no token). Shape conversion (product to item, desk to preset) happens here, so pages see one shape. Return keys, not English words: a record's detail is `courierSays`, the page shows `t('records.details.courierSays')`. | UI state, formatting for display. |
| `src/stores/<name>.js` | Pinia setup stores (`defineStore('name', () => { ... })`): state more than one page needs at the same time. `auth` (session), `agent` (config, presets), `inbox` (sidebar counts; `useLiveInbox` asks for them again when the server says a conversation changed, and `App.vue` every two minutes while the tab is visible, and `arrivals` goes up when more is waiting, which chimes, puts "(2) HeyDesk" in the tab title and refreshes an open Inbox or Conversations list), `ui` (test chat sheet, phone drawer). State is `ref`, derived values are `computed`, actions are plain functions. | Lists a single page shows (items, documents, records): the page fetches those itself. |
| `src/composables/` | `useSomething()` functions that hold behaviour several components share, with their own refs and lifecycle: `useAgentSection.js` (fill the form, dirty check, save, leave guard for an Agent settings section), `useLiveInbox.js` (holds the server's stream of changed conversations while a business is on screen, backend D158), `usePopover.js` (a menu under a button that closes on an outside click or Escape). `usePresence.js` (keeps a sheet mounted while it slides out), `useSummary.js` (a chat's summary, kept per chat and shared by the strip above the transcript and the reply box, backend D137), `useScrollProgress.js` (how far an element has travelled through the screen, 0 to 1, for the landing page's scroll-run pieces; 1 at once under reduced motion), `useSceneClock.js` (the timed steps of a landing page piece; it runs while on screen and sits on the last step under reduced motion). | One-off helpers with no Vue in them (use `lib/`). |
| `src/i18n/` | `en.js` and `bn.js`: every word on screen, grouped by screen, same keys in both. `index.js`: the vue-i18n setup, `setLocale`, `localeTag` (for `Intl`) and `t` for plain JS files. | Words the backend sends (its errors, `missing`, the agent's replies): those show as they came. |
| `src/lib/` | Plain functions and constants with no Vue in them (words come from `t()` in `i18n/index.js`, called when the function runs, so a computed that calls it follows a language switch): `format.js` (money, numbers, time, greeting, in the chosen language), `group.js` (Today / Yesterday, avatars, `PAGE_SIZE`: rows per server page), `flows.js` (status buttons, mirrors backend `FLOWS`), `records.js` (one-line summaries), `navigation.js` (the menu), `setup.js` (Home checklist), `presets.js`, `channels.js`, `hours.js`, `slug.js`, `visitor.js` (the browser's visitor token for the public chat and calls), `photo.js` (a picked photo made a small JPEG before the chat sends it), `colour.js` (is a business's colour light, so its words go dark), `calls.js` (the demo phone's link and a call's chip, backend D89), `team.js` (a role's name, and a team activity line in words with a link, backend D97), `chime.js` (the new-work sound, Web Audio, silent until the first click). | Components, or anything that calls the API. |
| `src/directives/` | Custom directives, imported where they are used as `vReveal` (`<script setup>` makes that `v-reveal`): `reveal.js` (an element settles in the first time it scrolls into view; CSS in `main.css`). | Anything with its own state or markup (use a component). |
| `src/assets/main.css` | Design tokens in `@theme`, and shared classes (`.btn`, `.field`, `.tabs`, `.row`, `.check`, `.panel`, `.notice`, `.chip`, `.count`, `.segmented`, `.skeleton`). | Page-specific CSS (use `<style scoped>` in the component). |
| `dev/` | Tools that never ship: `widget-test/` (try the chat bubble). | Anything the app imports. |
| `docs/` | `api.md` (backend contract), `architecture.md` (this file), research notes. | Design tokens (those live in `DESIGN.md` at the root). |

## "I want to add..." (quick answers)

| You want to add | Where it goes | Copy this |
|---|---|---|
| A new screen in the sidebar | `pages/<area>/<Thing>Page.vue`, a route in `router.js`, an item in `lib/navigation.js` | `pages/channels/ChannelsPage.vue` |
| A new tab inside Agent settings | `pages/agent/<Thing>Section.vue`, a child route under `/agent`, an entry in `AgentPage.vue` `sections` (path, Phosphor icon, label, a one-line `agent.sectionText.<name>`) | `pages/agent/AnswersSection.vue` |
| A new list with a detail pane | page in `pages/<area>/`, row, detail and side panel in `components/<area>/`. Three islands: the list, the detail, and who it is with the next step (a wrapper with `xl:contents` stacks the last two under 1280px) | `pages/inbox/InboxPage.vue` + `components/records/` (`RecordRow`, `RecordDetail`, `RecordNextStep`) |
| Something the team does to an opened chat | who has it is `AssignControl.vue` (one button, its list in a `usePopover` menu); anything else is a `menu-item` in `ConversationActions.vue`'s ⋯ menu, with a chip beside it while it is on. Only Done gets a button of its own | the AI off item in `components/conversations/ConversationActions.vue` |
| A true/false setting | A `ToggleSwitch` (`components/ui/`), never a checkbox or radio. One that stands alone saves at once (the AI switch in the agent island of `AgentPage.vue`, the hand-off switch in `TeamPage.vue`); one in a form goes through `useAgentSection` | `CallsSection.vue` |
| A new backend call | a function in `api/<resource>.js` using `request()` | `api/telegram.js` |
| A new kind of record (e.g. reservations) | `api/records.js` `JOBS` and `JOB_LIST`, `lib/flows.js` `FLOWS`, `lib/records.js` `summarize`, `StatusChip.vue` `LOOKS` for new statuses, and in both language files `status.*`, `flows.*`, `records.name`, `records.tabs`, `jobs.<kind>` | the `message` entries |
| A new kind of card in the chat (backend D110) | a `v-else-if="card.kind === '…'"` block in `components/chat/ChatCard.vue`, its few fixed words under `chat.card.*`; the backend writes everything else on it, so show its `text` and `value` as sent | the `tracking` block |
| A new payment gateway for the business | a card in `components/agent/` beside the others on `pages/agent/PaymentsSection.vue` (it emits `change`; any one connected is enough), its calls in `api/payments.js` | `components/agent/BkashConnect.vue` |
| A courier for a shop's parcels (backend D113) | `components/agent/CourierConnect.vue` in its own `Courier` group on `PaymentsSection.vue`, its calls in `api/courier.js`; a new courier is one more entry in its `NAMES` and its help words under `courier.*` | `components/agent/CourierConnect.vue` |
| A new channel (e.g. WhatsApp) | a card component in `components/agent/`, placed on `pages/channels/ChannelsPage.vue`; the icon in `lib/channels.js` and its words under `channels.*` in both language files; a line in Home's "Your agent" list | `components/agent/TelegramConnect.vue` |
| A new kind of business (service) | flip `live` to true on its entry in `SERVICES` in `lib/presets.js` (the setup page shows "Coming soon" until then), add it to `api/agent.js` `JOBS`, and in both language files `presets.items`, `presets.noun`, `jobs.<kind>`, `payments.<kind>` and any new `profile.fields`; the menu, navigation and payments pages are shop-only today and need their branches back | the `shop` entries |
| A setup step on Home | `lib/setup.js` `setupSteps` (keep it to five or fewer) and, if the backend's `missing` text is new, `whereToFix` | the `share` step |
| Something every page needs to know | a Pinia store in `stores/` (or a `computed` on an existing one) | `stores/ui.js` |
| Words on a screen | a key in `i18n/en.js` and the same key in `i18n/bn.js`, then `t('area.key')` | the `inbox` group |
| A shared visual piece (badge, banner, field) | `components/ui/` if it knows nothing about the business; a class in `main.css` if it is only styling | `components/ui/EmptyState.vue` |
| A new colour, radius or shadow | `@theme` in `main.css`, and a line in `DESIGN.md`. Never a hex value inside a component. | `--color-attention` |
| A formatting rule (dates, money, plurals) | `lib/format.js` | `formatAgo` |
| Any console page | a `<section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">` with `PageHeader` and the content in `.island`s on the grey canvas (`.page` stretches the last island to the bottom of the screen; a list page instead adds `flex flex-col lg:h-full` so its island scrolls inside the screen) | `pages/team/TeamPage.vue` (form), `pages/menu/MenuPage.vue` (list) |
| A settings section the preview should follow before Save | pass `previewFrom(form)` to `useAgentSection` and add the path to `showPreview` in `AgentPage` | `pages/agent/BubbleSection.vue` |
| A public page (no sign-in, no shell) | `pages/<area>/`, route meta `{ bare: true }` and no `requiresAuth` | `pages/chat/ChatPage.vue` |
| A partner's logo on a connection row (a payment account, a courier) | its square app icon from the company's own site in `public/logos/`, passed to `ConnectionRow` as `image` (channels use Phosphor's brand icons instead) | `image="/logos/bkash.png"` in `pages/agent/PaymentsSection.vue` |
| A new animated piece on the landing page | `components/landing/<Thing>.vue`: a `useSceneClock` with the wait before each step, and what shows at each `step`. Plain HTML at its real size, never a transform scale on words. Show the idea, not every control of the real screen | `components/landing/PerkPerson.vue` |
| Something a business's own website loads | `public/` (plain JS, copied as it is), talking to a bare page by `postMessage`; try it on `dev/widget-test/` (`python -m http.server 5500` there) | `public/widget.js` opens `pages/chat/EmbedPage.vue` |
| A personal setting (notifications, password) | a `SettingsGroup` on `pages/account/AccountPage.vue`. Business-wide settings (team, billing) get their own page, not this one | the Language group |
| Something a moderator must not see (backend D97) | hide it with `auth.canManage` (an owner, or an admin inside a business); a page of its own gets route meta `manager` in `router.js` and goes in `navGroups` only when `canManage` | the Team item in `lib/navigation.js` |
| An admin-only screen | `pages/admin/`, route meta `requiresAdmin`, the admin group in `lib/navigation.js` | `pages/admin/AdminPage.vue` |
| An admin inside a business | nothing new: `auth.view(business)` sends `X-Business`, the owner's pages and sidebar open (`auth.seesBusiness`), `App.vue` shows the banner; going to an admin page closes it | `open()` in `pages/admin/AdminPage.vue` |

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
3. Add it to `lib/navigation.js`: daily work goes in "Daily work", what the
   business sells in "Your business", and a page set up once goes in the
   `setup` list (the "Setup" group). Pick a Phosphor icon. The sidebar, the
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
   `sections` list in `pages/agent/AgentPage.vue` (an icon and a one-line
   `agent.sectionText.<name>` in both language files: the track under the
   title shows the icon, the top of the open section the line).

The composable already handles filling the form from the config, the
unsaved-changes check, the "leave without saving?" question and the saved note.

### Add a backend call

1. Add a function to the right `src/api/<resource>.js` that calls
   `request(path, { method, body })`. It throws an `Error` with
   `.status`, `.code`, `.fields` and the backend's `message`.
2. If the backend's shape differs from what pages use, convert it here (see
   `productToItem` in `api/agent.js`).
3. In the page, `try { ... } catch (err) { error.value = err.message; }` and
   show the sentence as it is. A function takes no token: the browser sends the session cookie.
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
  `border-hairline`). Black means "act here", lime means "selected". Green is
  live or done, orange is "needs a person", red is destructive. Lilac and the
  pastel tints are decoration only.
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
- Run `pnpm run lint` and `pnpm run build` before you commit.
