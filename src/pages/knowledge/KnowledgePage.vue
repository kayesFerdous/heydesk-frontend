<template>
  <section class="flex flex-col lg:h-full">
    <PageHeader
      :title="t('knowledge.title')"
      :tip="t('knowledge.subtitle')"
      :subtitle="loaded ? t('knowledge.count', { n: formatNumber(documents.length), limit: formatNumber(LIMIT) }) : ''"
    >
      <template v-if="loaded" #actions>
        <button type="button" class="btn btn-primary" @click="adding = !adding">
          <PhPlus :size="16" weight="bold"></PhPlus>
          {{ t('knowledge.add') }}
        </button>
      </template>
    </PageHeader>

    <AddDocumentPanel v-if="adding" @close="adding = false" @added="onAdded"></AddDocumentPanel>

    <p v-if="actionError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <PhWarningCircle :size="16" class="shrink-0"></PhWarningCircle>
      {{ actionError }}
    </p>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>

    <div v-else class="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <EmptyState
        v-if="!documents.length && !adding"
        :icon="PhBooks"
        :title="t('knowledge.emptyTitle')"
        :text="t('knowledge.emptyText')"
      ></EmptyState>

      <template v-else>
        <div v-for="group in groups" :key="group.label">
          <h2 class="day-head">{{ group.label }}</h2>
          <ul>
            <DocumentRow
              v-for="document in group.items"
              :key="document.id"
              :document="document"
              :timezone="timezone"
              :busy="removingId === document.id"
              @read="read(document)"
              @remove="remove(document)"
            ></DocumentRow>
          </ul>
        </div>
      </template>
    </div>

    <div
      v-if="reading"
      class="fixed inset-0 z-30 grid place-items-center bg-ink/30 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="reading.title"
      @click.self="reading = null"
      @keydown.esc="reading = null"
    >
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[var(--radius-panel)] bg-surface shadow-[var(--shadow-float)]">
        <div class="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
          <h2 class="truncate text-base font-semibold">{{ reading.title }}</h2>
          <button ref="closeButton" type="button" class="btn btn-quiet btn-icon" :aria-label="t('common.close')" @click="reading = null">
            <PhX :size="18"></PhX>
          </button>
        </div>
        <p v-if="reading.text === null" class="px-5 py-8 text-sm text-ink-soft">{{ t('knowledge.opening') }}</p>
        <pre v-else class="overflow-y-auto px-5 py-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{{ reading.text }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhBooks, PhPlus, PhWarningCircle, PhX } from '@phosphor-icons/vue';

import AddDocumentPanel from '../../components/knowledge/AddDocumentPanel.vue';
import DocumentRow from '../../components/knowledge/DocumentRow.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchDocuments, fetchDocument, deleteDocument } from '../../api/agent.js';
import { groupByDay } from '../../lib/group.js';
import { formatNumber } from '../../lib/format.js';
import { useAgentStore } from '../../stores/agent.js';

const LIMIT = 30; // the backend's MAX_DOCUMENTS per business

const router = useRouter();
const { t } = useI18n();
const agent = useAgentStore();

const documents = ref([]);
const loaded = ref(false);
const loadError = ref(null);
const actionError = ref(null);
const adding = ref(false);
const removingId = ref(null);
const reading = ref(null); // { title, text } while the full text is open
const closeButton = ref(null);

const timezone = computed(() => agent.config?.timezone || 'Asia/Dhaka');
const groups = computed(() => groupByDay(documents.value, 'created_at', timezone.value));

async function load() {
  loadError.value = null;
  try {
    // The documents belong to the agent, so a business without one sets it up first.
    await agent.load();
    if (agent.noAgent) {
      router.replace('/setup');
      return;
    }
    documents.value = await fetchDocuments();
    loaded.value = true;
  } catch (error) {
    loadError.value = error.message;
  }
}

function onAdded(document) {
  documents.value = [document, ...documents.value];
  adding.value = false;
  actionError.value = null;
}

async function read(document) {
  reading.value = { title: document.title, text: null };
  nextTick(() => closeButton.value?.focus());
  try {
    const full = await fetchDocument(document.id);
    reading.value = { title: full.title, text: full.text };
  } catch (error) {
    reading.value = null;
    actionError.value = error.message;
  }
}

async function remove(document) {
  removingId.value = document.id;
  actionError.value = null;
  try {
    await deleteDocument(document.id);
    documents.value = documents.value.filter((d) => d.id !== document.id);
  } catch (error) {
    // 503 knowledge_unavailable: the document is still there, so keep the row.
    actionError.value = error.message;
  }
  removingId.value = null;
}

load();
</script>
