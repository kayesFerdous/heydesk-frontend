<template>
  <section class="flex h-full flex-col lg:flex-row">
    <!-- The list -->
    <div
      class="flex min-h-0 flex-col border-hairline lg:w-[22rem] lg:shrink-0 lg:border-r"
      :class="selectedId ? 'hidden lg:flex' : 'flex flex-1'"
    >
      <header class="px-5 pt-6 sm:px-8 lg:px-5 lg:pt-8">
        <h1 class="text-[1.75rem] font-semibold tracking-tight">Conversations</h1>
        <div class="mt-4 flex gap-2" role="group" aria-label="Filter">
          <button type="button" class="filter" :class="{ 'filter-active': filter === 'all' }" @click="setFilter('all')">
            All
          </button>
          <button type="button" class="filter" :class="{ 'filter-active': filter === 'needs_human' }" @click="setFilter('needs_human')">
            Needs a person
            <span v-if="needsHuman" class="ml-1 text-xs font-semibold text-attention">{{ needsHuman }}</span>
          </button>
        </div>
      </header>

      <p v-if="error" class="px-5 py-8 text-sm" role="alert">
        <span class="text-danger">{{ error }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
      </p>

      <skeleton-rows v-else-if="!loaded" class="mt-4"></skeleton-rows>

      <div v-else-if="!rows.length" class="px-5 py-12">
        <h2 class="text-lg font-semibold tracking-tight">
          {{ filter === 'needs_human' ? 'Nobody is waiting' : 'No conversations yet' }}
        </h2>
        <p class="mt-2 text-sm text-ink-soft">
          {{
            filter === 'needs_human'
              ? 'When a customer asks for a person, they show up here.'
              : 'Chats and calls with your agent appear here. Try it yourself with Talk to your agent.'
          }}
        </p>
      </div>

      <div v-else class="mt-3 min-h-0 flex-1 overflow-y-auto">
        <div v-for="group in groups" :key="group.label">
          <h2 class="px-5 pt-4 pb-2 text-sm font-semibold text-ink-soft">{{ group.label }}</h2>
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
      <p v-else-if="detailError" class="p-8 text-sm text-danger" role="alert">{{ detailError }}</p>
      <div v-else-if="selectedId" class="p-8" aria-hidden="true"><div class="h-5 w-40 animate-pulse rounded bg-wash"></div></div>
      <div v-else class="m-auto max-w-sm p-8 text-center">
        <h2 class="text-lg font-semibold tracking-tight">Pick a conversation</h2>
        <p class="mt-1 text-sm text-ink-soft">See exactly what your agent said, and what it took.</p>
      </div>
    </div>
  </section>
</template>

<script>
import ConversationRow from '../../components/conversations/ConversationRow.vue';
import ConversationTranscript from '../../components/conversations/ConversationTranscript.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchConversations, fetchConversation } from '../../api/conversations.js';
import { groupByDay } from '../../lib/group.js';

// The list endpoint has no names or previews, so the newest conversations are
// opened once to fill them in. Older ones load when clicked.
const PREVIEW_LIMIT = 30;

export default {
  components: { ConversationRow, ConversationTranscript, SkeletonRows },
  data() {
    return {
      rows: [],
      details: {},
      loaded: false,
      error: null,
      detailError: null,
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
    async loadDetail(id) {
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

<style scoped>
.filter {
  height: 2.25rem;
  padding: 0 0.875rem;
  border: 1px solid var(--color-hairline);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-soft);
  transition: background-color 0.2s var(--ease-settle), color 0.2s var(--ease-settle);
}

.filter:hover {
  background-color: var(--color-wash);
}

.filter-active,
.filter-active:hover {
  background-color: var(--color-brand-tint);
  border-color: transparent;
  color: var(--color-brand);
}
</style>
