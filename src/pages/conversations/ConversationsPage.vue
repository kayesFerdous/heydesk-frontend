<template>
  <section class="flex h-full flex-col lg:flex-row">
    <!-- The list -->
    <div
      class="flex min-h-0 flex-col border-hairline lg:w-[22rem] lg:shrink-0 lg:border-r"
      :class="selectedId ? 'hidden lg:flex' : 'flex flex-1'"
    >
      <header class="px-5 pt-6 pb-4 sm:px-8 sm:pt-9 lg:px-5">
        <h1 class="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('conversations.title') }}</h1>
        <p class="mt-1 text-sm text-ink-soft">{{ t('conversations.subtitle') }}</p>
        <div class="segmented mt-4" role="group" :aria-label="t('conversations.filter')">
          <button type="button" class="segment" :class="{ 'segment-active': filter === 'all' }" :aria-pressed="filter === 'all'" @click="setFilter('all')">
            {{ t('conversations.all') }}
          </button>
          <button type="button" class="segment" :class="{ 'segment-active': filter === 'needs_human' }" :aria-pressed="filter === 'needs_human'" @click="setFilter('needs_human')">
            {{ t('status.needs_human') }}
            <span v-if="inbox.needsHuman" class="count count-attention">{{ formatNumber(inbox.needsHuman) }}</span>
          </button>
        </div>
      </header>

      <LoadError v-if="error" :message="error" @retry="load"></LoadError>

      <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>

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

      <div v-else class="min-h-0 flex-1 overflow-y-auto">
        <div v-for="group in groups" :key="group.label">
          <h2 class="day-head lg:!px-5">
            {{ group.label }}
          </h2>
          <ConversationRow
            v-for="row in group.items"
            :key="row.id"
            :row="row"
            :selected="row.id === selectedId"
            @select="select(row.id)"
          ></ConversationRow>
        </div>
        <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></ShowMore>
      </div>
    </div>

    <!-- The transcript -->
    <div class="min-h-0 min-w-0 flex-1" :class="selectedId ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'">
      <ConversationTranscript
        v-if="detail"
        :conversation="detail"
        @back="select(null)"
      ></ConversationTranscript>
      <LoadError v-else-if="detailError" :message="detailError" @retry="loadDetail(selectedId)"></LoadError>
      <div v-else-if="selectedId" class="p-8" aria-hidden="true">
        <div class="skeleton h-5 w-40"></div>
        <div class="skeleton mt-8 h-12 w-2/3"></div>
        <div class="skeleton mt-3 ml-auto h-12 w-1/2"></div>
      </div>
      <div v-else class="m-auto max-w-xs p-8 text-center">
        <PhChatsCircle :size="32" class="mx-auto text-ink-faint"></PhChatsCircle>
        <h2 class="mt-3 text-base font-semibold">{{ t('conversations.pick') }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ t('conversations.pickText') }}</p>
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
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchConversations, fetchConversation } from '../../api/conversations.js';
import { fetchRecords, byConversation } from '../../api/records.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { formatNumber } from '../../lib/format.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
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

const filter = computed(() => (route.query.filter === 'needs_human' ? 'needs_human' : 'all'));
const selectedId = computed(() => route.query.open || null);

// The list endpoint has no names or previews. The name comes from a record
// the conversation made; the preview from its transcript, once loaded.
const rows = computed(() =>
  list.value.map((c) => {
    const messages = details.value[c.id]?.messages ?? [];
    const record = (recordsOf.value[c.id] || [])[0];
    return {
      ...c,
      name: record?.customer_name || t('conversations.visitor'),
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
  router.replace({ query: next === 'all' ? {} : { filter: next } });
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
    limit: PAGE_SIZE,
    before,
  });
}

// Previews for one page of rows, filled in as they arrive. The list does
// not wait for them, and a missing preview is only an empty line.
function loadPreviews(conversations) {
  conversations.forEach(async (c) => {
    if (details.value[c.id]) return;
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

// The transcript on the right, when a conversation is opened.
async function loadDetail(id) {
  detailError.value = null;
  try {
    details.value[id] = await fetchConversation(id);
  } catch (err) {
    detailError.value = err.message;
  }
}

// The next page: conversations quieter than the oldest one on screen.
async function showMore() {
  const asked = filter.value;
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchPage(list.value[list.value.length - 1].updated_at);
    // The filter changed meanwhile: this page belongs to the old list.
    if (asked === filter.value) {
      list.value = [...list.value, ...older];
      hasMore.value = older.length === PAGE_SIZE;
      loadPreviews(older);
    }
  } catch (err) {
    moreError.value = err.message;
  }
  loadingMore.value = false;
}

watch(filter, load, { immediate: true });
watch(
  selectedId,
  (id) => {
    detailError.value = null;
    if (id && !details.value[id]) loadDetail(id);
  },
  { immediate: true },
);
</script>
