<template>
  <section class="flex h-full flex-col lg:flex-row">
    <!-- The list -->
    <div
      class="flex min-h-0 flex-col border-hairline lg:w-[22rem] lg:shrink-0 lg:border-r"
      :class="selectedId ? 'hidden lg:flex' : 'flex flex-1'"
    >
      <header class="px-5 pt-6 pb-4 sm:px-8 sm:pt-8 lg:px-5">
        <h1 class="text-2xl font-semibold tracking-[-0.02em]">Conversations</h1>
        <p class="mt-1 text-sm text-ink-soft">Every chat and call, word for word.</p>
        <div class="segmented mt-4" role="group" aria-label="Filter">
          <button type="button" class="segment" :class="{ 'segment-active': filter === 'all' }" :aria-pressed="filter === 'all'" @click="setFilter('all')">
            All
          </button>
          <button type="button" class="segment" :class="{ 'segment-active': filter === 'needs_human' }" :aria-pressed="filter === 'needs_human'" @click="setFilter('needs_human')">
            Needs a person
            <span v-if="needsHuman" class="count count-attention">{{ needsHuman }}</span>
          </button>
        </div>
      </header>

      <load-error v-if="error" :message="error" @retry="load"></load-error>

      <skeleton-rows v-else-if="!loaded" class="border-t border-hairline"></skeleton-rows>

      <empty-state
        v-else-if="!rows.length"
        :icon="filter === 'needs_human' ? icons.check : icons.chats"
        :title="filter === 'needs_human' ? 'Nobody is waiting' : 'No conversations yet'"
        :text="
          filter === 'needs_human'
            ? 'When a customer asks for a person, they show up here and on Home.'
            : 'Chats and calls with your agent appear here, word for word. Try it yourself to see your first one.'
        "
      >
        <button v-if="filter !== 'needs_human'" type="button" class="btn btn-secondary" @click="openTestChat">
          Try your agent
        </button>
      </empty-state>

      <div v-else class="min-h-0 flex-1 overflow-y-auto border-t border-hairline">
        <div v-for="group in groups" :key="group.label">
          <h2 class="sticky top-0 z-[1] border-b border-hairline bg-wash/95 px-5 py-1.5 text-xs font-semibold text-ink-soft backdrop-blur">
            {{ group.label }}
          </h2>
          <conversation-row
            v-for="row in group.items"
            :key="row.id"
            :row="row"
            :selected="row.id === selectedId"
            @select="select(row.id)"
          ></conversation-row>
        </div>
      </div>
    </div>

    <!-- The transcript -->
    <div class="min-h-0 min-w-0 flex-1" :class="selectedId ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'">
      <conversation-transcript
        v-if="detail"
        :conversation="detail"
        @back="select(null)"
      ></conversation-transcript>
      <load-error v-else-if="detailError" :message="detailError" @retry="loadDetail(selectedId)"></load-error>
      <div v-else-if="selectedId" class="p-8" aria-hidden="true">
        <div class="skeleton h-5 w-40"></div>
        <div class="skeleton mt-8 h-12 w-2/3"></div>
        <div class="skeleton mt-3 ml-auto h-12 w-1/2"></div>
      </div>
      <div v-else class="m-auto max-w-xs p-8 text-center">
        <ph-chats-circle :size="32" class="mx-auto text-ink-faint"></ph-chats-circle>
        <h2 class="mt-3 text-base font-semibold">Pick a conversation</h2>
        <p class="mt-1 text-sm text-ink-soft">See exactly what your agent said, and what it took.</p>
      </div>
    </div>
  </section>
</template>

<script>
import { PhChatsCircle, PhCheckCircle } from '@phosphor-icons/vue';

import ConversationRow from '../../components/conversations/ConversationRow.vue';
import ConversationTranscript from '../../components/conversations/ConversationTranscript.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import LoadError from '../../components/ui/LoadError.vue';
import { fetchConversations, fetchConversation } from '../../api/conversations.js';
import { groupByDay } from '../../lib/group.js';

// The list endpoint has no names or previews, so the newest conversations are
// opened once to fill them in. Older ones load when clicked.
const PREVIEW_LIMIT = 30;

export default {
  components: { ConversationRow, ConversationTranscript, SkeletonRows, EmptyState, LoadError, PhChatsCircle },
  data() {
    return {
      rows: [],
      details: {},
      loaded: false,
      error: null,
      detailError: null,
      icons: { chats: PhChatsCircle, check: PhCheckCircle },
    };
  },
  computed: {
    filter() {
      return this.$route.query.filter === 'needs_human' ? 'needs_human' : 'all';
    },
    selectedId() {
      return this.$route.query.open || null;
    },
    needsHuman() {
      return this.$store.getters['inbox/needsHuman'];
    },
    groups() {
      return groupByDay(this.rows, 'updated_at');
    },
    detail() {
      return this.selectedId ? this.details[this.selectedId] : null;
    },
  },
  watch: {
    filter() {
      this.load();
    },
    selectedId: {
      immediate: true,
      handler(id) {
        this.detailError = null;
        if (id && !this.details[id]) this.loadDetail(id);
      },
    },
  },
  created() {
    this.load();
  },
  methods: {
    setFilter(filter) {
      this.$router.replace({ query: filter === 'all' ? {} : { filter } });
    },
    select(id) {
      const query = { ...this.$route.query };
      if (id) query.open = id;
      else delete query.open;
      this.$router.replace({ query });
    },
    async load() {
      this.error = null;
      this.loaded = false;
      const token = this.$store.getters['auth/token'];
      try {
        const list = await fetchConversations(token, {
          status: this.filter === 'needs_human' ? 'needs_human' : undefined,
        });
        list.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        await Promise.allSettled(list.slice(0, PREVIEW_LIMIT).map((c) => this.loadDetail(c.id)));
        this.rows = list.map((c) => this.toRow(c));
        this.loaded = true;
      } catch (error) {
        // No agent yet means no conversations: send them to set it up.
        if (error.status === 404) {
          this.rows = [];
          this.loaded = true;
        } else {
          this.error = error.message;
        }
      }
    },
    openTestChat() {
      this.$store.commit('ui/setTestSheet', true);
    },
    async loadDetail(id) {
      this.detailError = null;
      try {
        this.details[id] = await fetchConversation(this.$store.getters['auth/token'], id);
      } catch (error) {
        this.detailError = error.message;
      }
    },
    toRow(conversation) {
      const detail = this.details[conversation.id];
      const record = detail && detail.records[0];
      const last = detail && detail.messages.length ? detail.messages[detail.messages.length - 1] : null;
      return {
        ...conversation,
        name: (record && record.customer_name) || 'Visitor',
        preview: last ? last.text : '',
      };
    },
  },
};
</script>
