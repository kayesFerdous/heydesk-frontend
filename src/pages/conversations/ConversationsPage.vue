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
        <show-more v-if="hasMore" :loading="loadingMore" :error="moreError" @more="showMore"></show-more>
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
import { markRaw } from 'vue';
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

export default {
  components: { ConversationRow, ConversationTranscript, SkeletonRows, ShowMore, EmptyState, LoadError, PhChatsCircle },
  data() {
    return {
      list: [], // the pages loaded so far, newest activity first
      recordsOf: {}, // conversation id -> the records it made (for the name)
      details: {}, // conversation id -> its transcript, once opened
      hasMore: false, // the last page was full, so there may be older ones
      loadingMore: false,
      moreError: null,
      loaded: false,
      error: null,
      detailError: null,
      // markRaw: components are fixed, so Vue need not watch them for changes.
      icons: markRaw({ chats: PhChatsCircle, check: PhCheckCircle }),
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
    // The list endpoint has no names or previews. The name comes from a record
    // the conversation made; the preview from its transcript, once loaded.
    rows() {
      return this.list.map((c) => {
        const detail = this.details[c.id];
        const record = (this.recordsOf[c.id] || [])[0];
        const last = detail && detail.messages.length ? detail.messages[detail.messages.length - 1] : null;
        return { ...c, name: (record && record.customer_name) || 'Visitor', preview: last ? last.text : '' };
      });
    },
    groups() {
      return groupByDay(this.rows, 'updated_at');
    },
    detail() {
      const detail = this.selectedId ? this.details[this.selectedId] : null;
      return detail ? { ...detail, records: this.recordsOf[detail.id] || [] } : null;
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
      this.moreError = null;
      const token = this.$store.getters['auth/token'];
      try {
        // The records are only for names: without them the rows say "Visitor".
        // They are the newest 100 per kind, so a much older conversation says "Visitor".
        const [list, records] = await Promise.all([
          this.fetchPage(),
          fetchRecords(token).catch(() => []),
        ]);
        this.list = list;
        this.hasMore = list.length === PAGE_SIZE;
        this.recordsOf = byConversation(records);
        this.loaded = true;
        this.loadPreviews(list);
      } catch (error) {
        // No agent yet means no conversations: send them to set it up.
        if (error.status === 404) {
          this.list = [];
          this.loaded = true;
        } else {
          this.error = error.message;
        }
      }
    },
    openTestChat() {
      this.$store.commit('ui/setTestSheet', true);
    },
    // The transcript on the right, when a conversation is opened.
    async loadDetail(id) {
      this.detailError = null;
      try {
        this.details[id] = await fetchConversation(this.$store.getters['auth/token'], id);
      } catch (error) {
        this.detailError = error.message;
      }
    },
    // One page of the list, newest activity first, older than `before` if given.
    fetchPage(before) {
      return fetchConversations(this.$store.getters['auth/token'], {
        status: this.filter === 'needs_human' ? 'needs_human' : undefined,
        limit: PAGE_SIZE,
        before,
      });
    },
    // Previews for one page of rows, filled in as they arrive. The list does
    // not wait for them, and a missing preview is only an empty line.
    loadPreviews(conversations) {
      const token = this.$store.getters['auth/token'];
      conversations.forEach(async (c) => {
        if (this.details[c.id]) return;
        try {
          this.details[c.id] = await fetchConversation(token, c.id);
        } catch (error) {
          // Best effort: the row shows no preview.
        }
      });
    },
    // The next page: conversations quieter than the oldest one on screen.
    async showMore() {
      const filter = this.filter;
      this.loadingMore = true;
      this.moreError = null;
      try {
        const older = await this.fetchPage(this.list[this.list.length - 1].updated_at);
        // The filter changed meanwhile: this page belongs to the old list.
        if (filter === this.filter) {
          this.list = [...this.list, ...older];
          this.hasMore = older.length === PAGE_SIZE;
          this.loadPreviews(older);
        }
      } catch (error) {
        this.moreError = error.message;
      }
      this.loadingMore = false;
    },
  },
};
</script>
