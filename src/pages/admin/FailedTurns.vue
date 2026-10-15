<template>
  <!-- Replies that ended with the polite line (backend D73), newest first: every
       business's, or one's with `workspaceId`. Open goes to that conversation as
       the business's admin (A1); the audit log records the opening. -->
  <LoadError v-if="error" :message="error" @retry="load"></LoadError>

  <div v-else-if="rows">
    <ul class="flex flex-col divide-y divide-hairline text-sm">
      <li v-for="row in rows" :key="row.id" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
        <div class="min-w-0">
          <p>
            <span class="text-ink-soft">{{ formatDay(row.at) }}, {{ formatTime(row.at) }}</span>
            <span v-if="!workspaceId" class="ml-2 font-semibold">{{ row.business_name }}</span>
            <span class="ml-2 text-ink-soft">{{ row.channel }} · {{ row.llm }}</span>
          </p>
          <p class="truncate text-danger" :title="row.error">{{ row.error }}</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" @click="open(row)">{{ t('failed.open') }}</button>
      </li>
    </ul>
    <p v-if="!rows.length" class="text-sm text-ink-soft">{{ t('failed.none') }}</p>
    <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="more"></ShowMore>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import LoadError from '../../components/ui/LoadError.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import { fetchFailedTurns } from '../../api/admin.js';
import { formatDay, formatTime } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const PAGE = 10; // a short list first; more on asking

const props = defineProps({
  workspaceId: { type: String, default: '' }, // empty: every business's
});

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const rows = ref(null);
const hasMore = ref(false);
const error = ref(null);
const loadingMore = ref(false);
const moreError = ref(null);

async function load() {
  error.value = null;
  try {
    rows.value = await fetchFailedTurns({ limit: PAGE, workspaceId: props.workspaceId });
    hasMore.value = rows.value.length === PAGE;
  } catch (err) {
    error.value = err.message;
  }
}

// The next page: the failures before the oldest one on screen.
async function more() {
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchFailedTurns({ limit: PAGE, before: rows.value[rows.value.length - 1].at, workspaceId: props.workspaceId });
    rows.value = [...rows.value, ...older];
    hasMore.value = older.length === PAGE;
  } catch (err) {
    moreError.value = err.message;
  }
  loadingMore.value = false;
}

// See what the customer got: the conversation, inside its business.
function open(row) {
  auth.view({ id: row.workspace_id, name: row.business_name, status: row.business_status });
  router.push({ path: '/conversations', query: { open: row.conversation_id } });
}

load();
</script>
