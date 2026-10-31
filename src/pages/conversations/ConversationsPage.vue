<template>
  <!-- One island, its columns ruled apart: the list, the transcript, and who it was
       with. A phone shows the list, then one conversation with a way back. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full lg:pt-0">
    <!-- Wide screens give the whole height to the work: the title is for screen readers only. -->
    <h1 class="sr-only max-lg:hidden">{{ t('conversations.title') }}</h1>
    <PageHeader :class="selectedId ? 'lg:hidden max-lg:hidden' : 'lg:hidden'" :title="t('conversations.title')" :tip="t('conversations.subtitle')"></PageHeader>

    <div class="island grid grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:grid-cols-[21rem_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[20rem_minmax(0,1fr)_17rem] 2xl:grid-cols-[23rem_minmax(0,1fr)_20rem]">
      <!-- The list -->
      <div class="flex flex-col lg:min-h-0 lg:border-r lg:border-hairline" :class="{ 'max-lg:hidden': selectedId }">
        <!-- Who is blocked (backend I2): a list of its own, a step away from the chats. -->
        <div v-if="filter === 'blocked'" class="flex shrink-0 items-center gap-2 border-b border-hairline p-3">
          <button type="button" class="btn btn-quiet btn-icon btn-sm" :aria-label="t('conversations.them.backToChats')" @click="setFilter(null)">
            <PhArrowLeft :size="18"></PhArrowLeft>
          </button>
          <h2 class="text-sm font-bold">{{ t('conversations.them.blockedLink') }}</h2>
        </div>

        <div v-else class="flex shrink-0 flex-col gap-2 border-b border-hairline p-3">
          <div class="flex items-center gap-2">
            <SidebarToggle class="max-lg:!hidden"></SidebarToggle>
            <!-- A name, a phone, an order code or any words (backend I3) -->
            <label class="relative block min-w-0 flex-1">
              <span class="sr-only">{{ t('conversations.later.search') }}</span>
              <PhMagnifyingGlass :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"></PhMagnifyingGlass>
              <input v-model="searchText" class="field !h-9 !border-transparent !bg-wash pl-9 text-sm" type="search" :placeholder="t('conversations.later.search')" />
            </label>
            <!-- Narrow it down past the tabs: one channel, or the blocked visitors. -->
            <div ref="filterRoot" class="relative">
              <button
                type="button"
                class="btn btn-sm btn-icon relative"
                :class="channel ? 'btn-secondary !border-ink' : 'btn-quiet'"
                :aria-label="t('conversations.filter')"
                :title="t('conversations.filter')"
                :aria-expanded="filterOpen"
                aria-haspopup="menu"
                @click="filterOpen = !filterOpen"
              >
                <PhFunnelSimple :size="18"></PhFunnelSimple>
              </button>
              <div v-if="filterOpen" class="popover right-0 w-60" role="menu">
                <p class="px-3 pt-1.5 pb-1 text-xs font-semibold text-ink-soft">{{ t('conversations.byChannel') }}</p>
                <button type="button" class="menu-item" role="menuitemradio" :aria-checked="!channel" @click="pick(() => setChannel(null))">
                  <span class="min-w-0 flex-1">{{ t('conversations.allChannels') }}</span>
                  <PhCheck v-if="!channel" :size="16" weight="bold"></PhCheck>
                </button>
                <button
                  v-for="option in channelOptions"
                  :key="option.id"
                  type="button"
                  class="menu-item"
                  role="menuitemradio"
                  :aria-checked="channel === option.id"
                  @click="pick(() => setChannel(option.id))"
                >
                  <component :is="option.icon" :size="18" :weight="option.weight" :class="option.color"></component>
                  <span class="min-w-0 flex-1">{{ option.label }}</span>
                  <PhCheck v-if="channel === option.id" :size="16" weight="bold"></PhCheck>
                </button>
                <button
                  v-if="!auth.isViewing"
                  type="button"
                  class="menu-item mt-1 border-t border-hairline !rounded-none text-ink-soft"
                  role="menuitem"
                  @click="pick(() => setFilter('blocked'))"
                >
                  <PhProhibit :size="16"></PhProhibit>
                  {{ t('conversations.them.blockedLink') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Who has it (backend I1): one choice, with how many there wait for a person. -->
          <div v-if="!auth.isViewing" class="segmented flex w-full" role="group" :aria-label="t('conversations.assign.filter')">
            <button
              v-for="id in WHO"
              :key="id"
              type="button"
              class="segment !h-7 flex-1 justify-center !px-2"
              :class="{ 'segment-active': who === id }"
              :aria-pressed="who === id"
              @click="setWho(id)"
            >
              {{ t(`conversations.assign.${id}`) }}
              <span v-if="id !== 'all' && waitingIn[id] > 0" class="count count-attention" :title="t('status.needs_human')">{{ formatNumber(waitingIn[id]) }}</span>
            </button>
          </div>

          <!-- Which of them: every chat, the ones waiting for a person, or the done ones. -->
          <nav class="flex flex-wrap items-center gap-1" :aria-label="t('conversations.filter')">
            <button
              v-for="id in FILTER_TABS"
              :key="id ?? 'all'"
              type="button"
              class="tab !h-7 !px-2.5 !text-[0.8125rem]"
              :class="{ 'tab-active': filter === id }"
              :aria-pressed="filter === id"
              @click="setFilter(id)"
            >
              {{ id === null ? t('conversations.all') : id === 'done' ? t('conversations.later.doneList') : t('status.needs_human') }}
              <span v-if="id === 'needs_human' && waitingIn[who] > 0" class="count count-attention">{{ formatNumber(waitingIn[who]) }}</span>
            </button>
            <button v-if="channel" type="button" class="chip ml-auto h-7 bg-lime px-2.5 text-ink" :title="t('conversations.allChannels')" @click="setChannel(null)">
              <component :is="channelOf(channel).icon" :size="14" :weight="channelOf(channel).weight"></component>
              {{ channelOf(channel).label }}
              <PhX :size="12" weight="bold"></PhX>
            </button>
          </nav>
        </div>

        <BlockedList v-if="filter === 'blocked'" @open="select"></BlockedList>

        <LoadError v-else-if="error" :message="error" @retry="load"></LoadError>

        <SkeletonRows v-else-if="!loaded"></SkeletonRows>

        <EmptyState
          v-else-if="!rows.length && (query || filter === 'done')"
          :icon="query ? PhMagnifyingGlass : PhCheckCircle"
          :title="query ? t('conversations.later.noMatch') : t('conversations.later.noneDone')"
          :text="query ? t('conversations.later.noMatchText') : t('conversations.later.noneDoneText')"
        ></EmptyState>
        <EmptyState
          v-else-if="!rows.length && who !== 'all'"
          :icon="PhCheckCircle"
          :title="who === 'mine' ? t('conversations.assign.noneMine') : t('conversations.assign.noneFree')"
          :text="who === 'mine' ? t('conversations.assign.noneMineText') : t('conversations.assign.noneFreeText')"
        ></EmptyState>
        <EmptyState
          v-else-if="!rows.length && channel && filter !== 'needs_human'"
          :icon="channelOf(channel).icon"
          :title="t('conversations.noneFrom', { channel: channelOf(channel).label })"
          :text="t('conversations.noneFromText')"
        ></EmptyState>
        <EmptyState
          v-else-if="!rows.length"
          :icon="filter === 'needs_human' ? PhCheckCircle : PhChatsCircle"
          :title="filter === 'needs_human' ? t('conversations.nobodyWaiting') : t('conversations.emptyTitle')"
          :text="filter === 'needs_human' ? t('conversations.nobodyWaitingText') : t('conversations.emptyText')"
        >
          <button v-if="filter !== 'needs_human'" type="button" class="btn btn-secondary" @click="ui.testSheetOpen = true">
            {{ t('common.tryYourAgent') }}
          </button>
        </EmptyState>

        <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div v-for="group in groups" :key="group.label">
            <h2 class="day-head !border-hairline !px-3 !pt-2.5 !pb-1.5 !text-xs !text-ink-soft">{{ group.label }}</h2>
            <div class="flex flex-col">
              <ConversationRow
                v-for="row in group.items"
                :key="row.id"
                :row="row"
                :selected="row.id === selectedId"
                :me-id="auth.me?.id || ''"
                @select="select(row.id)"
              ></ConversationRow>
            </div>
          </div>
          <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></ShowMore>
        </div>
      </div>

      <!-- The transcript, then who it was with. Wide screens give each its own
           column, ruled apart; narrower ones stack them. -->
      <div v-if="detail" class="flex flex-col lg:min-h-0 lg:overflow-y-auto xl:contents">
        <div class="xl:flex xl:min-h-0 xl:flex-col">
          <ConversationTranscript
            :conversation="detail"
            :busy="isHandling || isAssigning"
            :error="handleError || assignError || laterError || changeError"
            :can-take="!auth.isViewing && !detail.assigned_to"
            class="xl:min-h-0 xl:flex-1"
            @back="select(null)"
            @handled="handled"
            @take="assign(auth.me?.id)"
          >
            <template v-if="!auth.isViewing" #actions>
              <ConversationActions
                :conversation="detail"
                :members="members"
                :me-id="auth.me?.id || ''"
                :can-assign-anyone="auth.canManage"
                :busy="isAssigning || isLater || isChanging"
                @assign="assign"
                @done="done"
                @snooze="snooze"
                @change="changeThem"
              ></ConversationActions>
            </template>
            <template #chips>
              <ConversationChips :conversation="detail" :me-id="auth.me?.id || ''"></ConversationChips>
            </template>
            <template v-if="!auth.isViewing" #top>
              <ConversationSummary :conversation="detail"></ConversationSummary>
            </template>
            <!-- A call can't be answered in writing. -->
            <template v-if="!auth.isViewing && detail.channel !== 'voice'" #bottom>
              <ReplyBox :conversation="detail" :busy="isReplying" :error="replyError" @send="reply"></ReplyBox>
            </template>
          </ConversationTranscript>
        </div>
        <div class="border-t border-hairline xl:min-h-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
          <ConversationSide :conversation="detail" :me-id="auth.me?.id || ''"></ConversationSide>
        </div>
      </div>
      <LoadError v-else-if="detailError" :message="detailError" @retry="loadDetail(selectedId)"></LoadError>
      <div v-else-if="selectedId" class="p-8" aria-hidden="true">
        <div class="skeleton h-5 w-40"></div>
        <div class="skeleton mt-8 h-12 w-2/3 !rounded-[var(--radius-card)]"></div>
        <div class="skeleton mt-3 ml-auto h-12 w-1/2 !rounded-[var(--radius-card)]"></div>
      </div>
      <div v-else class="hidden flex-col items-center justify-center p-8 text-center lg:flex xl:col-span-2">
        <span class="grid h-14 w-14 place-items-center rounded-full bg-brand-tint" aria-hidden="true">
          <PhChatsCircle :size="26"></PhChatsCircle>
        </span>
        <h2 class="mt-4 text-lg font-bold">{{ t('conversations.pick') }}</h2>
        <p class="mt-1 max-w-xs text-sm text-ink-soft">{{ t('conversations.pickText') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowLeft, PhChatsCircle, PhCheck, PhCheckCircle, PhFunnelSimple, PhMagnifyingGlass, PhProhibit, PhX } from '@phosphor-icons/vue';

import ConversationRow from '../../components/conversations/ConversationRow.vue';
import ConversationTranscript from '../../components/conversations/ConversationTranscript.vue';
import ConversationSide from '../../components/conversations/ConversationSide.vue';
import ConversationActions from '../../components/conversations/ConversationActions.vue';
import ConversationChips from '../../components/conversations/ConversationChips.vue';
import ConversationSummary from '../../components/conversations/ConversationSummary.vue';
import ReplyBox from '../../components/conversations/ReplyBox.vue';
import BlockedList from '../../components/conversations/BlockedList.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SidebarToggle from '../../components/layout/SidebarToggle.vue';
import {
  fetchConversations,
  fetchConversation,
  markHandled,
  assignConversation,
  changeVisitor,
  markDone,
  snoozeConversation,
  sendReply,
} from '../../api/conversations.js';
import { fetchMembers } from '../../api/team.js';
import { fetchRecords, byConversation } from '../../api/records.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber } from '../../lib/format.js';
import { channelOf, CHANNEL_IDS } from '../../lib/channels.js';
import { usePopover } from '../../composables/usePopover.js';
import { useAuthStore } from '../../stores/auth.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const inbox = useInboxStore();
const ui = useUiStore();
const { open: filterOpen, root: filterRoot } = usePopover(); // the funnel's menu: a channel, or the blocked visitors

const list = ref([]); // the pages loaded so far, newest activity first
const recordsOf = ref({}); // conversation id -> the records it made (for the name)
const details = ref({}); // conversation id -> its transcript, once opened
const hasMore = ref(false); // the last page was full, so there may be older ones
const loadingMore = ref(false);
const moreError = ref(null);
const loaded = ref(false);
const error = ref(null);
const detailError = ref(null);
const isHandling = ref(false);
const handleError = ref(null);
const members = ref([]); // the team with their open chats, for the owner's Assign (backend I1)
const isAssigning = ref(false);
const assignError = ref(null);
const isChanging = ref(false); // blocking, or turning the AI off (backend I2)
const changeError = ref(null);
const isLater = ref(false); // Done or Snooze (backend I3)
const laterError = ref(null);
const isReplying = ref(false); // the team's reply from the inbox (backend D136)
const replyError = ref(null);
const searchText = ref(''); // what's typed; `query` follows it after a pause
const query = ref('');
let searchTimer = null;

// Two choices, both in the URL so a link can open them: whose chats (`who`, backend I1), and
// which of them (`filter`): waiting for a person, done (I3), or the blocked visitors (I2).
const WHO = ['mine', 'unassigned', 'all'];
const FILTERS = ['needs_human', 'done', 'blocked'];
const FILTER_TABS = [null, 'needs_human', 'done']; // every chat, waiting for a person, done
const who = computed(() => (!auth.isViewing && WHO.includes(route.query.who) ? route.query.who : 'all'));
const filter = computed(() => (FILTERS.includes(route.query.filter) ? route.query.filter : null));
// How many chats wait for a person, in each tab and on the "Needs a person" tab.
const waitingIn = computed(() => ({ mine: inbox.mineWaiting, unassigned: inbox.unassignedWaiting, all: inbox.needsHuman }));
const selectedId = computed(() => route.query.open || null);
const channel = computed(() => (CHANNEL_IDS.includes(route.query.channel) ? route.query.channel : null));
const channelOptions = computed(() => CHANNEL_IDS.map((id) => ({ id, ...channelOf(id) })));
// What the list is showing; a page asked for under another one is dropped.
const listKey = computed(() => `${who.value}|${filter.value}|${channel.value}|${query.value}`);

// The list endpoint has no previews. The name is the messaging app's, else a
// record's the conversation made; the preview from its transcript, once loaded.
const rows = computed(() =>
  list.value.map((c) => {
    const messages = details.value[c.id]?.messages ?? [];
    const known = c.name || (recordsOf.value[c.id] || [])[0]?.customer_name;
    return {
      ...c,
      name: known || t('conversations.visitor'),
      named: Boolean(known),
      preview: messages.length ? messages[messages.length - 1].text : '',
      record: (recordsOf.value[c.id] || [])[0], // the newest order or request it made
    };
  }),
);
const groups = computed(() => groupByDay(rows.value, 'updated_at'));
const detail = computed(() => {
  const found = selectedId.value ? details.value[selectedId.value] : null;
  return found ? { ...found, records: recordsOf.value[found.id] || [] } : null;
});

// Changes some of the URL's choices and keeps the rest; an empty one is left out.
function go(changes) {
  const next = { ...route.query, ...changes };
  Object.keys(next).forEach((key) => next[key] || delete next[key]);
  router.replace({ query: next });
}
// A new list closes the open chat. A filter or channel pressed again lets go.
const setWho = (next) => go({ who: next === 'all' ? null : next, open: null });
const setFilter = (next) => go({ filter: next === filter.value ? null : next, open: null });
const setChannel = (next) => go({ channel: next === channel.value ? null : next, open: null });
const select = (id) => go({ open: id });
// A choice in the funnel's menu closes it.
function pick(choose) {
  filterOpen.value = false;
  choose();
}

// One page of the list, newest activity first, older than `before` if given.
function fetchPage(before) {
  return fetchConversations({
    status: filter.value === 'needs_human' ? 'needs_human' : undefined,
    assigned: { mine: 'me', unassigned: 'none' }[who.value],
    done: filter.value === 'done',
    q: query.value || undefined,
    channel: channel.value || undefined,
    limit: PAGE_SIZE,
    before,
  });
}

// Previews for one page of rows, filled in as they arrive. The list does
// not wait for them, and a missing preview is only an empty line.
// Not for an admin inside a business: each preview reads a whole conversation,
// which the audit log would record as opened (backend D23).
function loadPreviews(conversations) {
  if (auth.isViewing) return;
  conversations.forEach(async (c) => {
    // Already loaded and nothing new said since: keep it.
    if (details.value[c.id]?.updated_at === c.updated_at) return;
    try {
      details.value[c.id] = await fetchConversation(c.id);
    } catch (err) {
      // Best effort: the row shows no preview.
    }
  });
}

async function load() {
  if (filter.value === 'blocked') return; // the Blocked list loads its own rows
  error.value = null;
  loaded.value = false;
  moreError.value = null;
  try {
    // The records are only for names: without them the rows say "Visitor".
    // They are the newest 100 per kind, so a much older conversation says "Visitor".
    const [page, records] = await Promise.all([fetchPage(), fetchRecords().catch(() => [])]);
    list.value = page;
    hasMore.value = page.length === PAGE_SIZE;
    recordsOf.value = byConversation(records);
    loaded.value = true;
    loadPreviews(page);
  } catch (err) {
    // No agent yet means no conversations: send them to set it up.
    if (err.status === 404) {
      list.value = [];
      loaded.value = true;
    } else {
      error.value = err.message;
    }
  }
}

// New work came in (the counts went up): the first page again, quietly, the
// old rows staying until it arrives. Rows that moved on load their preview again.
async function refresh() {
  if (!loaded.value || filter.value === 'blocked') return;
  const asked = listKey.value;
  try {
    const [page, records] = await Promise.all([fetchPage(), fetchRecords()]);
    if (asked !== listKey.value) return; // the filter changed meanwhile
    list.value = page;
    hasMore.value = page.length === PAGE_SIZE;
    recordsOf.value = byConversation(records);
    loadPreviews(page);
  } catch (err) {
    // Best effort: the list on screen stays.
  }
}

// The transcript on the right, when a conversation is opened.
async function loadDetail(id) {
  detailError.value = null;
  try {
    details.value[id] = await fetchConversation(id);
  } catch (err) {
    detailError.value = err.message;
  }
}

// The owner dealt with a hand-off: the agent answers again, and it leaves
// "Needs a person" (the filter, the badges and Home's "Waiting for you").
async function handled() {
  const id = selectedId.value;
  isHandling.value = true;
  handleError.value = null;
  try {
    const updated = await markHandled(id);
    details.value[id] = { ...details.value[id], status: updated.status };
    list.value =
      filter.value === 'needs_human'
        ? list.value.filter((c) => c.id !== id)
        : list.value.map((c) => (c.id === id ? { ...c, ...updated } : c));
    inbox.load().catch(() => {});
  } catch (err) {
    // e.g. 409: someone already gave it back on Telegram. Show the sentence.
    handleError.value = err.message;
  }
  isHandling.value = false;
}

// Someone takes the chat, gives it back, or the owner gives it to someone (backend I1).
// It leaves "Mine" or "Unassigned" when it no longer fits there.
async function assign(userId) {
  const id = selectedId.value;
  isAssigning.value = true;
  assignError.value = null;
  try {
    const updated = await assignConversation(id, userId);
    details.value[id] = { ...details.value[id], ...updated };
    const fits =
      who.value === 'all' ||
      (who.value === 'mine' && updated.assigned_to === auth.me?.id) ||
      (who.value === 'unassigned' && !updated.assigned_to);
    list.value = fits
      ? list.value.map((c) => (c.id === id ? { ...c, ...updated } : c))
      : list.value.filter((c) => c.id !== id);
    inbox.load().catch(() => {}); // the tabs' numbers
    loadMembers(); // and everyone's open chats
  } catch (err) {
    // e.g. 403: a colleague took it first. Show the sentence.
    assignError.value = err.message;
  }
  isAssigning.value = false;
}

// Done or not done, snoozed or back now (backend I3). A chat that leaves this list goes from
// it: done or snoozed out of the usual list, or not done out of "Done". A search keeps them all.
async function later(call) {
  const id = selectedId.value;
  isLater.value = true;
  laterError.value = null;
  try {
    const updated = await call(id);
    details.value[id] = { ...details.value[id], ...updated };
    const hidden = Boolean(updated.done_at) || (updated.snoozed_until && new Date(updated.snoozed_until) > new Date());
    const fits = query.value || (filter.value === 'done' ? Boolean(updated.done_at) : !hidden);
    list.value = fits
      ? list.value.map((c) => (c.id === id ? { ...c, ...updated } : c))
      : list.value.filter((c) => c.id !== id);
    inbox.load().catch(() => {});
  } catch (err) {
    laterError.value = err.message; // e.g. 422: a time too far ahead
  }
  isLater.value = false;
}
const done = (isDone) => later((id) => markDone(id, isDone));
const snooze = (until) => later((id) => snoozeConversation(id, until));

// Block or unblock this chat's visitor, or turn the AI off or on for them (backend I2).
async function changeThem(change) {
  const id = selectedId.value;
  isChanging.value = true;
  changeError.value = null;
  try {
    const visitor = await changeVisitor(details.value[id].visitor.id, change);
    details.value[id] = { ...details.value[id], visitor };
  } catch (err) {
    changeError.value = err.message;
  }
  isChanging.value = false;
}

// The team's own words to the visitor (backend D136). The chat is taken over, and its
// transcript is fetched again to show the line.
async function reply(text, sent) {
  const id = selectedId.value;
  isReplying.value = true;
  replyError.value = null;
  try {
    const updated = await sendReply(id, text);
    sent();
    list.value = list.value.map((c) => (c.id === id ? { ...c, ...updated } : c));
    await loadDetail(id);
  } catch (err) {
    replyError.value = err.message; // e.g. Messenger's 24 hours have passed
  }
  isReplying.value = false;
}

// The next page: conversations quieter than the oldest one on screen.
async function showMore() {
  const asked = listKey.value;
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchPage(list.value[list.value.length - 1].updated_at);
    // The filter changed meanwhile: this page belongs to the old list.
    if (asked === listKey.value) {
      list.value = [...list.value, ...older];
      hasMore.value = older.length === PAGE_SIZE;
      loadPreviews(older);
    }
  } catch (err) {
    moreError.value = err.message;
  }
  loadingMore.value = false;
}

watch(listKey, load, { immediate: true });
watch(searchText, (text) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (query.value = text.trim()), 300);
});
// Only the owner gives a chat to someone else, so only they need the team.
function loadMembers() {
  if (auth.canManage && !auth.isViewing) fetchMembers().then((found) => (members.value = found)).catch(() => {});
}
loadMembers();
watch(() => inbox.arrivals, refresh);
watch(() => inbox.changes, refresh); // the server said a conversation changed (backend D158)
watch(
  selectedId,
  (id) => {
    detailError.value = null;
    handleError.value = null;
    assignError.value = null;
    changeError.value = null;
    laterError.value = null;
    replyError.value = null;
    if (id && !details.value[id]) loadDetail(id);
  },
  { immediate: true },
);
</script>
