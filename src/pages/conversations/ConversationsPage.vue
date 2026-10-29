<template>
  <!-- Three columns on the canvas: the list, the transcript, and who it was
       with. A phone shows the list, then one conversation with a way back. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full">
    <PageHeader :class="{ 'max-lg:hidden': selectedId }" :title="t('conversations.title')" :subtitle="t('conversations.subtitle')">
      <!-- Who has it (backend I1): one choice, with how many there wait for a person. -->
      <template v-if="!auth.isViewing" #actions>
        <div class="tabs rounded-[0.875rem] bg-surface p-1" role="group" :aria-label="t('conversations.assign.filter')">
          <button
            v-for="option in whoOptions"
            :key="option.id"
            type="button"
            class="tab"
            :class="{ 'tab-active': who === option.id }"
            :aria-pressed="who === option.id"
            @click="setWho(option.id)"
          >
            {{ option.label }}
            <span v-if="option.waiting" class="count count-attention" :title="t('status.needs_human')">{{ formatNumber(option.waiting) }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <LoadError v-if="error" class="island" :message="error" @retry="load"></LoadError>

    <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_17rem] 2xl:grid-cols-[24rem_minmax(0,1fr)_20rem]">
      <!-- The list -->
      <div class="island flex flex-col overflow-hidden lg:min-h-0" :class="{ 'max-lg:hidden': selectedId }">
        <!-- Who is blocked (backend I2): a list of its own, a step away from the chats. -->
        <div v-if="filter === 'blocked'" class="flex shrink-0 items-center gap-2 border-b border-hairline p-3">
          <button type="button" class="btn btn-quiet btn-icon btn-sm" :aria-label="t('conversations.them.backToChats')" @click="setFilter(null)">
            <PhArrowLeft :size="18"></PhArrowLeft>
          </button>
          <h2 class="text-sm font-bold">{{ t('conversations.them.blockedLink') }}</h2>
        </div>

        <template v-else>
          <!-- A name, a phone, an order code or any words (backend I3) -->
          <div class="shrink-0 px-3 pt-3">
            <input
              v-model="searchText"
              class="field"
              type="search"
              :placeholder="t('conversations.later.search')"
              :aria-label="t('conversations.later.search')"
            />
          </div>
          <!-- Narrow it down: waiting for a person or done, then one channel (its logo, and its
               name once chosen). Each one pressed again lets go. -->
          <nav class="flex shrink-0 flex-col gap-2 border-b border-hairline p-3" :aria-label="t('conversations.filter')">
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                class="chip h-9 px-3.5 text-sm font-semibold transition-colors"
                :class="filter === 'needs_human' ? 'bg-lime text-ink' : 'bg-hover text-ink-soft hover:text-ink'"
                :aria-pressed="filter === 'needs_human'"
                @click="setFilter('needs_human')"
              >
                {{ t('status.needs_human') }}
                <span v-if="waitingHere" class="count count-attention">{{ formatNumber(waitingHere) }}</span>
              </button>
              <button
                type="button"
                class="chip h-9 px-3.5 text-sm font-semibold transition-colors"
                :class="filter === 'done' ? 'bg-lime text-ink' : 'bg-hover text-ink-soft hover:text-ink'"
                :aria-pressed="filter === 'done'"
                @click="setFilter('done')"
              >
                {{ t('conversations.later.doneList') }}
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="option in channelOptions"
                :key="option.id"
                type="button"
                class="chip h-9 gap-1.5 text-sm font-semibold transition-colors"
                :class="channel === option.id ? 'bg-lime px-3.5 text-ink' : 'w-9 justify-center bg-hover px-0 text-ink-soft hover:text-ink'"
                :aria-pressed="channel === option.id"
                :aria-label="option.label"
                :title="option.label"
                @click="setChannel(option.id)"
              >
                <component :is="option.icon" :size="18" :weight="option.weight" :class="option.color"></component>
                <span v-if="channel === option.id">{{ option.label }}</span>
              </button>
            </div>
          </nav>
        </template>

        <BlockedList v-if="filter === 'blocked'" @open="select"></BlockedList>

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

        <div v-else class="px-2 pb-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div v-for="group in groups" :key="group.label">
            <h2 class="day-head !border-hairline !px-2.5 !pt-3">{{ group.label }}</h2>
            <div class="flex flex-col gap-1 pt-1.5">
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

        <button
          v-if="filter !== 'blocked' && !auth.isViewing"
          type="button"
          class="mt-auto flex shrink-0 items-center gap-2 border-t border-hairline px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          @click="setFilter('blocked')"
        >
          <PhProhibit :size="16"></PhProhibit>
          {{ t('conversations.them.blockedLink') }}
        </button>
      </div>

      <!-- The conversation: the transcript, then who it was with. Wide
           screens give each its own column; narrower ones stack them. -->
      <div v-if="detail" class="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto xl:contents">
        <ConversationTranscript
          :conversation="detail"
          :busy="isHandling"
          :error="handleError"
          :can-take="!auth.isViewing && !detail.assigned_to"
          class="island xl:min-h-0"
          @back="select(null)"
          @handled="handled"
          @take="assign(auth.me?.id)"
        >
          <template v-if="!auth.isViewing" #actions>
            <AssignControl
              :conversation="detail"
              :members="members"
              :me-id="auth.me?.id || ''"
              :can-assign-anyone="auth.canManage"
              :busy="isAssigning"
              :error="assignError"
              @assign="assign"
            ></AssignControl>
            <ConversationActions
              :conversation="detail"
              :busy="isLater || isChanging"
              :error="laterError || changeError"
              @done="done"
              @snooze="snooze"
              @change="changeThem"
            ></ConversationActions>
          </template>
        </ConversationTranscript>
        <ConversationSide :conversation="detail" class="island xl:min-h-0 xl:overflow-y-auto"></ConversationSide>
      </div>
      <LoadError v-else-if="detailError" class="island" :message="detailError" @retry="loadDetail(selectedId)"></LoadError>
      <div v-else-if="selectedId" class="island p-8" aria-hidden="true">
        <div class="skeleton h-5 w-40"></div>
        <div class="skeleton mt-8 h-12 w-2/3 !rounded-[var(--radius-card)]"></div>
        <div class="skeleton mt-3 ml-auto h-12 w-1/2 !rounded-[var(--radius-card)]"></div>
      </div>
      <div v-else class="island hidden flex-col items-center justify-center p-8 text-center lg:flex xl:col-span-2">
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
import { PhArrowLeft, PhChatsCircle, PhCheckCircle, PhMagnifyingGlass, PhProhibit } from '@phosphor-icons/vue';

import ConversationRow from '../../components/conversations/ConversationRow.vue';
import ConversationTranscript from '../../components/conversations/ConversationTranscript.vue';
import ConversationSide from '../../components/conversations/ConversationSide.vue';
import AssignControl from '../../components/conversations/AssignControl.vue';
import ConversationActions from '../../components/conversations/ConversationActions.vue';
import BlockedList from '../../components/conversations/BlockedList.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import {
  fetchConversations,
  fetchConversation,
  markHandled,
  assignConversation,
  changeVisitor,
  markDone,
  snoozeConversation,
} from '../../api/conversations.js';
import { fetchMembers } from '../../api/team.js';
import { fetchRecords, byConversation } from '../../api/records.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber } from '../../lib/format.js';
import { channelOf, CHANNEL_IDS } from '../../lib/channels.js';
import { useAuthStore } from '../../stores/auth.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const inbox = useInboxStore();
const ui = useUiStore();

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
const searchText = ref(''); // what's typed; `query` follows it after a pause
const query = ref('');
let searchTimer = null;

// Two choices, both in the URL so a link can open them: whose chats (`who`, backend I1), and
// which of them (`filter`): waiting for a person, done (I3), or the blocked visitors (I2).
const WHO = ['mine', 'unassigned'];
const FILTERS = ['needs_human', 'done', 'blocked'];
const who = computed(() => (!auth.isViewing && WHO.includes(route.query.who) ? route.query.who : 'all'));
const filter = computed(() => (FILTERS.includes(route.query.filter) ? route.query.filter : null));
const whoOptions = computed(() => [
  { id: 'mine', label: t('conversations.assign.mine'), waiting: inbox.mineWaiting },
  { id: 'unassigned', label: t('conversations.assign.unassigned'), waiting: inbox.unassignedWaiting },
  { id: 'all', label: t('conversations.assign.all'), waiting: 0 },
]);
// How many of the chats in this tab wait for a person, on the "Needs a person" chip.
const waitingHere = computed(
  () => ({ mine: inbox.mineWaiting, unassigned: inbox.unassignedWaiting, all: inbox.needsHuman })[who.value],
);
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
    if (id && !details.value[id]) loadDetail(id);
  },
  { immediate: true },
);
</script>
