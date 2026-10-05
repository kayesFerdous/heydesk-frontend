<template>
  <section class="flex flex-col lg:h-full">
    <header class="px-5 pt-6 pb-6 sm:px-8 sm:pt-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-[1.75rem] font-semibold tracking-tight">Knowledge</h1>
          <p class="mt-1 max-w-xl text-ink-soft">
            Documents your agent can look things up in when a question is not answered
            elsewhere: policies, price lists, care instructions.
          </p>
        </div>
        <button v-if="loaded" type="button" class="btn btn-primary" @click="adding = !adding">
          <ph-plus :size="18" weight="bold"></ph-plus>
          Add document
        </button>
      </div>
    </header>

    <add-document-panel v-if="adding" @close="adding = false" @added="onAdded"></add-document-panel>

    <p v-if="actionError" class="border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      {{ actionError }}
    </p>

    <p v-if="loadError" class="px-5 py-10 text-sm sm:px-8" role="alert">
      <span class="text-danger">{{ loadError }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
    </p>

    <skeleton-rows v-else-if="!loaded" class="border-t border-hairline"></skeleton-rows>

    <div v-else class="border-t border-hairline lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <div v-if="!documents.length && !adding" class="px-5 py-16 sm:px-8">
        <div class="max-w-md">
          <h2 class="text-xl font-semibold tracking-tight">No documents yet</h2>
          <p class="mt-2 text-ink-soft">
            Add a file or paste some text. Your agent will search it when a customer asks
            something your menu and answers do not cover.
          </p>
          <button type="button" class="btn btn-primary mt-6" @click="adding = true">Add document</button>
        </div>
      </div>

      <template v-else>
        <div v-for="group in groups" :key="group.label">
          <h2 class="bg-wash px-5 py-2 text-xs font-semibold text-ink-soft sm:px-8">{{ group.label }}</h2>
          <ul>
            <document-row
              v-for="document in group.items"
              :key="document.id"
              :document="document"
              :timezone="timezone"
              :busy="removingId === document.id"
              @read="read(document)"
              @remove="remove(document)"
            ></document-row>
          </ul>
        </div>
        <p class="px-5 py-4 text-sm text-ink-soft sm:px-8">
          {{ documents.length }} of {{ limit }} documents
        </p>
      </template>
    </div>

    <div
      v-if="reading"
      class="fixed inset-0 z-30 grid place-items-center bg-rail/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="reading.title"
      @click.self="reading = null"
      @keydown.esc="reading = null"
    >
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[var(--radius-panel)] bg-surface shadow-xl">
        <div class="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
          <h2 class="truncate text-lg font-semibold tracking-tight">{{ reading.title }}</h2>
          <button type="button" class="btn btn-quiet" @click="reading = null">Close</button>
        </div>
        <p v-if="reading.text === null" class="px-5 py-8 text-sm text-ink-soft">Opening...</p>
        <pre v-else class="overflow-y-auto px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">{{ reading.text }}</pre>
      </div>
    </div>
  </section>
</template>

<script>
import { PhPlus } from '@phosphor-icons/vue';

import AddDocumentPanel from '../../components/knowledge/AddDocumentPanel.vue';
import DocumentRow from '../../components/knowledge/DocumentRow.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchDocuments, fetchDocument, deleteDocument } from '../../api/agent.js';
import { groupByDay } from '../../lib/group.js';

export default {
  components: { AddDocumentPanel, DocumentRow, SkeletonRows, PhPlus },
  data() {
    return {
      documents: [],
      loaded: false,
      loadError: null,
      actionError: null,
      adding: false,
      removingId: null,
      reading: null, // { title, text } while the full text is open
      limit: 30, // the backend's MAX_DOCUMENTS per business
    };
  },
  computed: {
    timezone() {
      const config = this.$store.getters['agent/config'];
      return (config && config.timezone) || 'Asia/Dhaka';
    },
    groups() {
      return groupByDay(this.documents, 'created_at', this.timezone);
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loadError = null;
      try {
        // The documents belong to the agent, so a business without one sets it up first.
        await this.$store.dispatch('agent/load');
        if (this.$store.getters['agent/noAgent']) {
          this.$router.replace('/setup');
          return;
        }
        this.documents = await fetchDocuments(this.$store.getters['auth/token']);
        this.loaded = true;
      } catch (error) {
        this.loadError = error.message;
      }
    },
    onAdded(document) {
      this.documents = [document, ...this.documents];
      this.adding = false;
      this.actionError = null;
    },
    async read(document) {
      this.reading = { title: document.title, text: null };
      try {
        const full = await fetchDocument(this.$store.getters['auth/token'], document.id);
        this.reading = { title: full.title, text: full.text };
      } catch (error) {
        this.reading = null;
        this.actionError = error.message;
      }
    },
    async remove(document) {
      this.removingId = document.id;
      this.actionError = null;
      try {
        await deleteDocument(this.$store.getters['auth/token'], document.id);
        this.documents = this.documents.filter((d) => d.id !== document.id);
      } catch (error) {
        // 503 knowledge_unavailable: the document is still there, so keep the row.
        this.actionError = error.message;
      }
      this.removingId = null;
    },
  },
};
</script>
