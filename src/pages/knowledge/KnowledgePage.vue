<template>
  <section class="flex flex-col lg:h-full">
    <page-header
      title="Knowledge"
      subtitle="Documents your agent looks things up in when a question is not answered elsewhere: policies, price lists, care instructions."
    >
      <template v-if="loaded" #actions>
        <button type="button" class="btn btn-primary" @click="adding = !adding">
          <ph-plus :size="16" weight="bold"></ph-plus>
          Add document
        </button>
      </template>
    </page-header>

    <add-document-panel v-if="adding" @close="adding = false" @added="onAdded"></add-document-panel>

    <p v-if="actionError" class="flex items-center gap-2 border-b border-hairline px-5 py-3 text-sm text-danger sm:px-8" role="alert">
      <ph-warning-circle :size="16" class="shrink-0"></ph-warning-circle>
      {{ actionError }}
    </p>

    <load-error v-if="loadError" :message="loadError" @retry="load"></load-error>

    <skeleton-rows v-else-if="!loaded" class="border-t border-hairline"></skeleton-rows>

    <div v-else class="border-t border-hairline lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <empty-state
        v-if="!documents.length && !adding"
        :icon="icons.books"
        title="No documents yet"
        text="Upload a file or paste some text with Add document. Your agent searches it when a customer asks something your menu and answers do not cover."
      ></empty-state>

      <template v-else>
        <div v-for="group in groups" :key="group.label">
          <h2 class="sticky top-0 z-[1] border-b border-hairline bg-wash/95 px-5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur sm:px-8">{{ group.label }}</h2>
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
          <button ref="close" type="button" class="btn btn-quiet btn-icon" aria-label="Close" @click="reading = null">
            <ph-x :size="18"></ph-x>
          </button>
        </div>
        <p v-if="reading.text === null" class="px-5 py-8 text-sm text-ink-soft">Opening...</p>
        <pre v-else class="overflow-y-auto px-5 py-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{{ reading.text }}</pre>
      </div>
    </div>
  </section>
</template>

<script>
import { PhBooks, PhPlus, PhWarningCircle, PhX } from '@phosphor-icons/vue';

import AddDocumentPanel from '../../components/knowledge/AddDocumentPanel.vue';
import DocumentRow from '../../components/knowledge/DocumentRow.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchDocuments, fetchDocument, deleteDocument } from '../../api/agent.js';
import { groupByDay } from '../../lib/group.js';

export default {
  components: {
    AddDocumentPanel,
    DocumentRow,
    SkeletonRows,
    PageHeader,
    EmptyState,
    LoadError,
    PhPlus,
    PhWarningCircle,
    PhX,
  },
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
      icons: { books: PhBooks },
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
      this.$nextTick(() => this.$refs.close && this.$refs.close.focus());
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
