<template>
  <!-- Three columns on the canvas: the list, the transcript, and who it was
       with. A phone shows the list, then one conversation with a way back. -->
  <section class="flex flex-col px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0 lg:h-full">
    <PageHeader :class="{ 'max-lg:hidden': selectedId }" :title="t('conversations.title')" :subtitle="t('conversations.subtitle')">
      <template #actions>
        <div class="tabs rounded-full bg-surface p-1" role="group" :aria-label="t('conversations.filter')">
          <button type="button" class="tab" :class="{ 'tab-active': filter === 'all' }" :aria-pressed="filter === 'all'" @click="setFilter('all')">
            {{ t('conversations.all') }}
          </button>
          <button type="button" class="tab" :class="{ 'tab-active': filter === 'needs_human' }" :aria-pressed="filter === 'needs_human'" @click="setFilter('needs_human')">
            {{ t('status.needs_human') }}
            <span v-if="inbox.needsHuman" class="count count-attention">{{ formatNumber(inbox.needsHuman) }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <LoadError v-if="error" class="island" :message="error" @retry="load"></LoadError>

    <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_17rem] 2xl:grid-cols-[24rem_minmax(0,1fr)_20rem]">
      <!-- The list -->
      <div class="island flex flex-col overflow-hidden lg:min-h-0" :class="{ 'max-lg:hidden': selectedId }">
        <!-- One channel at a time: its logo, and its name once chosen. -->
        <nav class="flex shrink-0 flex-wrap gap-1.5 border-b border-hairline p-3" :aria-label="t('conversations.byChannel')">
          <button
            type="button"
            class="chip h-9 px-3.5 text-sm font-semibold transition-colors"
            :class="!channel ? 'bg-lime text-ink' : 'bg-hover text-ink-soft hover:text-ink'"
            :aria-pressed="!channel"
            @click="setChannel(null)"
          >
            {{ t('conversations.all') }}
          </button>
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
        </nav>

        <SkeletonRows v-if="!loaded"></SkeletonRows>

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
                @select="select(row.id)"
              ></ConversationRow>
            </div>
          </div>
          <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></ShowMore>
        </div>
      </div>

      <!-- The conversation: the transcript, then who it was with. Wide
           screens give each its own column; narrower ones stack them. -->
      <div v-if="detail" class="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto xl:contents">
        <ConversationTranscript
          :conversation="detail"
          :busy="isHandling"
          :error="handleError"
          class="island xl:min-h-0"
          @back="select(null)"
          @handled="handled"
        ></ConversationTranscript>
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
import { PhChatsCircle, PhCheckCircle } from '@phosphor-icons/vue';

import ConversationRow from '../../components/conversations/ConversationRow.vue';
import ConversationTranscript from '../../components/conversations/ConversationTranscript.vue';
import ConversationSide from '../../components/conversations/ConversationSide.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchConversations, fetchConversation, markHandled } from '../../api/conversations.js';
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

const filter = computed(() => (route.query.filter === 'needs_human' ? 'needs_human' : 'all'));
const selectedId = computed(() => route.query.open || null);
const channel = computed(() => (CHANNEL_IDS.includes(route.query.channel) ? route.query.channel : null));
const channelOptions = computed(() => CHANNEL_IDS.map((id) => ({ id, ...channelOf(id) })));
// What the list is showing; a page asked for under another one is dropped.
const listKey = computed(() => `${filter.value}|${channel.value}`);

// The list endpoint has no names or previews. The name comes from a record
// the conversation made; the preview from its transcript, once loaded.
const rows = computed(() =>
  list.value.map((c) => {
    const messages = details.value[c.id]?.messages ?? [];
    const record = (recordsOf.value[c.id] || [])[0];
    return {
      ...c,
      name: record?.customer_name || t('conversations.visitor'),
      named: Boolean(record?.customer_name),
      preview: messages.length ? messages[messages.length - 1].text : '',
    };
  }),
);
const groups = computed(() => groupByDay(rows.value, 'updated_at'));
const detail = computed(() => {
  const found = selectedId.value ? details.value[selectedId.value] : null;
  return found ? { ...found, records: recordsOf.value[found.id] || [] } : null;
});

function setFilter(next) {
  const query = channel.value ? { channel: channel.value } : {};
  if (next !== 'all') query.filter = next;
  router.replace({ query });
}

function setChannel(next) {
  const query = filter.value === 'all' ? {} : { filter: filter.value };
  if (next) query.channel = next;
  router.replace({ query });
}

function select(id) {
  const query = { ...route.query };
  if (id) query.open = id;
  else delete query.open;
  router.replace({ query });
}

// One page of the list, newest activity first, older than `before` if given.
function fetchPage(before) {
  return fetchConversations({
    status: filter.value === 'needs_human' ? 'needs_human' : undefined,
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
  if (!loaded.value) return;
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
watch(() => inbox.arrivals, refresh);
watch(
  selectedId,
  (id) => {
    detailError.value = null;
    handleError.value = null;
    if (id && !details.value[id]) loadDetail(id);
  },
  { immediate: true },
);
</script>
