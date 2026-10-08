<template>
  <section>
    <page-header :title="title">
      <template #subtitle>
        <p v-if="ready && hasAgent" class="mt-1 max-w-2xl text-sm text-ink-soft">{{ todayLine }}</p>
        <p v-else-if="!ready" class="skeleton mt-2 h-4 w-72" aria-hidden="true"></p>
      </template>
    </page-header>

    <load-error v-if="error" :message="error" @retry="load"></load-error>

    <!-- First run: no agent yet, one clear way forward. -->
    <div v-else-if="noAgent" class="px-5 pb-12 sm:px-8">
      <div class="panel max-w-2xl p-6 sm:p-8">
        <span class="grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-brand text-white" aria-hidden="true">
          <ph-sparkle :size="22" weight="fill"></ph-sparkle>
        </span>
        <h2 class="mt-5 text-xl font-semibold tracking-[-0.01em]">Let's set up your agent</h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Pick what kind of business you run, add your details, and try it. It takes about five
          minutes, and orders and messages start arriving here.
        </p>
        <router-link to="/setup" class="btn btn-primary mt-6">
          Set up your agent
          <ph-arrow-right :size="16" weight="bold"></ph-arrow-right>
        </router-link>
      </div>
    </div>

    <div v-else-if="!ready" class="px-5 sm:px-8" aria-hidden="true">
      <div class="skeleton h-48 w-full max-w-3xl !rounded-[var(--radius-panel)]"></div>
      <div class="skeleton mt-8 h-5 w-32"></div>
      <div class="skeleton mt-4 h-14 w-full max-w-3xl"></div>
      <div class="skeleton mt-2 h-14 w-full max-w-3xl"></div>
    </div>

    <div v-else class="grid gap-x-10 gap-y-10 px-5 pb-12 sm:px-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div class="min-w-0">
        <!-- The setup guide: the shortest road to a first real customer. It
             goes away once every step is done. -->
        <div v-if="!setupDone" class="panel mb-10 overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <div>
              <h2 class="section-title">Finish setting up</h2>
              <p class="mt-0.5 text-sm text-ink-soft">
                {{ todo.length }} {{ todo.length === 1 ? 'step' : 'steps' }} left, {{ doneCount }} of {{ steps.length }} done.
              </p>
            </div>
            <div class="flex gap-1" aria-hidden="true">
              <span
                v-for="step in steps"
                :key="step.id"
                class="h-1.5 w-7 rounded-full"
                :class="step.done ? 'bg-brand' : 'bg-hover'"
              ></span>
            </div>
          </div>
          <!-- Only what is left. Done steps only count toward the bar above. -->
          <ol>
            <li
              v-for="(step, index) in todo"
              :key="step.id"
              class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <span
                class="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold"
                :class="index === 0 ? 'bg-brand text-white' : 'bg-hover text-ink-soft'"
                aria-hidden="true"
              >
                {{ doneCount + index + 1 }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold">{{ step.title }}</p>
                <p class="mt-0.5 text-sm text-ink-soft">{{ step.text }}</p>
              </div>
              <button
                v-if="step.opensChat"
                type="button"
                class="btn col-start-2 mt-3 justify-self-start sm:col-start-auto sm:mt-0"
                :class="index === 0 ? 'btn-primary' : 'btn-secondary'"
                @click="openTestChat"
              >
                {{ step.action }}
              </button>
              <router-link
                v-else
                :to="step.to"
                class="btn col-start-2 mt-3 justify-self-start sm:col-start-auto sm:mt-0"
                :class="index === 0 ? 'btn-primary' : 'btn-secondary'"
              >
                {{ step.action }}
              </router-link>
            </li>
          </ol>
        </div>

        <!-- What needs a person now: hand-offs first, then new records. -->
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="section-title">Needs you</h2>
          <router-link v-if="attention.length" to="/inbox" class="link text-sm">Open inbox</router-link>
        </div>

        <div v-if="!attention.length" class="mt-3 flex items-center gap-3 rounded-[var(--radius-panel)] bg-wash px-5 py-5">
          <ph-check-circle :size="22" class="shrink-0 text-success"></ph-check-circle>
          <p class="text-sm">
            <span class="font-semibold">Nothing is waiting for you.</span>
            <span class="text-ink-soft"> New orders, bookings and customers who want a person show up here.</span>
          </p>
        </div>

        <ul v-else class="mt-3 border-t border-hairline">
          <li v-for="item in attention" :key="item.id">
            <router-link :to="item.to" class="row flex items-center gap-3 px-1 py-3 sm:px-2">
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                :class="item.handoff ? 'bg-attention-tint text-attention' : item.tint"
                aria-hidden="true"
              >
                <ph-user-sound v-if="item.handoff" :size="18" weight="bold"></ph-user-sound>
                <template v-else>{{ item.initials }}</template>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold">
                  {{ item.title }}
                  <span v-if="item.code" class="ml-1 font-normal text-ink-soft">{{ item.code }}</span>
                </span>
                <span class="block truncate text-sm text-ink-soft">{{ item.text }}</span>
              </span>
              <span class="hidden shrink-0 text-right sm:block">
                <span v-if="item.amount" class="block text-sm font-semibold">{{ item.amount }}</span>
                <span class="block text-xs text-ink-soft">{{ item.when }}</span>
              </span>
              <status-chip :status="item.status" class="hidden shrink-0 sm:inline-flex"></status-chip>
              <ph-caret-right :size="16" class="shrink-0 text-ink-faint"></ph-caret-right>
            </router-link>
          </li>
        </ul>
        <p v-if="moreWaiting" class="mt-3 text-sm text-ink-soft">
          And {{ moreWaiting }} more in your
          <router-link to="/inbox" class="link">inbox</router-link>.
        </p>
      </div>

      <!-- The agent at a glance: is it on, where customers reach it. -->
      <aside class="xl:border-l xl:border-hairline xl:pl-10">
        <h2 class="section-title">Your agent</h2>
        <div class="mt-4 flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand" aria-hidden="true">
            <ph-chat-circle-dots :size="20" weight="fill"></ph-chat-circle-dots>
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ config.name }}</p>
            <live-status :paused="suspended"></live-status>
          </div>
        </div>

        <dl class="mt-5 flex flex-col text-sm">
          <div class="flex items-center justify-between gap-3 border-t border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><ph-globe :size="16"></ph-globe> Website chat</dt>
            <dd class="font-medium">On</dd>
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><ph-telegram-logo :size="16"></ph-telegram-logo> Telegram</dt>
            <dd>
              <span v-if="telegram" class="font-medium">@{{ telegram.username }}</span>
              <router-link v-else to="/channels" class="link">Connect</router-link>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3 border-y border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><ph-books :size="16"></ph-books> Knowledge</dt>
            <dd>
              <router-link to="/knowledge" class="font-medium hover:underline">
                {{ documentCount }} {{ documentCount === 1 ? 'document' : 'documents' }}
              </router-link>
            </dd>
          </div>
        </dl>

        <div class="mt-5">
          <copy-field label="Chat link" :value="link" @copied="onCopied"></copy-field>
        </div>

        <router-link to="/agent" class="btn btn-secondary mt-5 w-full">
          <ph-sliders-horizontal :size="16"></ph-sliders-horizontal>
          Edit settings
        </router-link>
      </aside>
    </div>
  </section>
</template>

<script>
import {
  PhArrowRight,
  PhBooks,
  PhCaretRight,
  PhChatCircleDots,
  PhCheckCircle,
  PhGlobe,
  PhSlidersHorizontal,
  PhSparkle,
  PhTelegramLogo,
  PhUserSound,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import CopyField from '../../components/ui/CopyField.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import { fetchRecords } from '../../api/records.js';
import { fetchConversations, fetchConversation } from '../../api/conversations.js';
import { fetchTelegram } from '../../api/telegram.js';
import { fetchDocuments } from '../../api/agent.js';
import { formatMoney, formatAgo, greeting } from '../../lib/format.js';
import { isToday, avatarTint, initials } from '../../lib/group.js';
import { chatLink } from '../../lib/presets.js';
import { channelOf } from '../../lib/channels.js';
import { summarize } from '../../lib/records.js';
import { setupSteps, markShared, wasShared } from '../../lib/setup.js';

// How many waiting things Home lists before pointing to the inbox.
const ATTENTION_LIMIT = 6;

// What one record is called in the "Today" sentence: [one, many].
const NOUNS = {
  order: ['order', 'orders'],
  appointment: ['appointment request', 'appointment requests'],
  message: ['message', 'messages'],
};

export default {
  components: {
    PageHeader,
    LoadError,
    LiveStatus,
    CopyField,
    StatusChip,
    PhArrowRight,
    PhBooks,
    PhCaretRight,
    PhChatCircleDots,
    PhCheckCircle,
    PhGlobe,
    PhSlidersHorizontal,
    PhSparkle,
    PhTelegramLogo,
    PhUserSound,
  },
  data() {
    return {
      ready: false,
      error: null,
      records: [],
      conversations: [],
      handoffs: [], // the full conversations of customers waiting for a person
      telegram: null,
      documentCount: 0,
      shared: false,
    };
  },
  computed: {
    config() {
      return this.$store.getters['agent/config'];
    },
    hasAgent() {
      return this.$store.getters['agent/hasAgent'];
    },
    noAgent() {
      return this.$store.getters['agent/noAgent'];
    },
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
    timezone() {
      return (this.config && this.config.timezone) || 'Asia/Dhaka';
    },
    title() {
      return greeting(this.timezone);
    },
    link() {
      return chatLink(this.$store.getters['agent/publicKey']);
    },
    // "Today your agent had 14 conversations and took 3 orders worth ৳2,450."
    todayLine() {
      const chats = this.conversations.filter((c) => isToday(c.created_at, this.timezone)).length;
      if (!chats) return 'No customers yet today. Your agent is ready the moment one writes.';

      const today = this.records.filter((r) => isToday(r.created_at, this.timezone));
      const taken = Object.keys(NOUNS)
        .map((job) => {
          const count = today.filter((r) => r.job === job).length;
          if (!count) return null;
          let words = `${count} ${NOUNS[job][count === 1 ? 0 : 1]}`;
          if (job === 'order') {
            const total = today.filter((r) => r.job === 'order').reduce((sum, r) => sum + (r.total || 0), 0);
            words += ` worth ${formatMoney(total)}`;
          }
          return words;
        })
        .filter(Boolean);

      let line = `Today your agent had ${chats} ${chats === 1 ? 'conversation' : 'conversations'}`;
      if (taken.length) line += ` and took ${taken.join(' and ')}`;
      return line + '.';
    },
    steps() {
      return setupSteps({
        missing: this.$store.getters['agent/missing'],
        itemsLabel: this.$store.getters['agent/itemsLabel'],
        triedIt: this.conversations.length > 0,
        shared: this.shared || !!this.telegram,
      });
    },
    doneCount() {
      return this.steps.filter((step) => step.done).length;
    },
    todo() {
      return this.steps.filter((step) => !step.done);
    },
    setupDone() {
      return this.todo.length === 0;
    },
    waiting() {
      return this.records.filter((r) => r.status === 'new');
    },
    attention() {
      const handoffs = this.handoffs.map((c) => {
        const record = c.records[0];
        const name = (record && record.customer_name) || 'A visitor';
        return {
          id: c.id,
          handoff: true,
          title: `${name} asked for a person`,
          text: `${channelOf(c.channel).long}. Read what was said, then call or reply.`,
          when: formatAgo(c.updated_at, this.timezone),
          status: 'needs_human',
          to: `/conversations?open=${c.id}`,
        };
      });
      const records = this.waiting.map((r) => ({
        id: r.id,
        title: r.customer_name || 'Customer',
        code: r.code,
        text: summarize(r),
        when: formatAgo(r.created_at, this.timezone),
        amount: r.kind === 'order' ? formatMoney(r.total) : '',
        status: r.status,
        initials: initials(r.customer_name),
        tint: avatarTint(r.customer_name),
        to: `/inbox?job=${r.job}&open=${r.id}`,
      }));
      return [...handoffs, ...records].slice(0, ATTENTION_LIMIT);
    },
    moreWaiting() {
      return Math.max(0, this.handoffs.length + this.waiting.length - ATTENTION_LIMIT);
    },
  },
  watch: {
    // Closing the test chat may have finished "Try your agent": check again.
    '$store.state.ui.testSheetOpen'(open) {
      if (!open && this.hasAgent) this.refreshConversations();
    },
  },
  created() {
    this.load();
  },
  methods: {
    async refreshConversations() {
      try {
        this.conversations = await fetchConversations(this.$store.getters['auth/token']);
      } catch (error) {
        // Best effort: the next visit loads it again.
      }
    },
    async load() {
      this.error = null;
      this.ready = false;
      const token = this.$store.getters['auth/token'];
      try {
        await this.$store.dispatch('agent/load');
        if (this.noAgent) {
          this.ready = true;
          return;
        }
        await this.$store.dispatch('agent/loadPresets');
        const [records, conversations, telegram, documents] = await Promise.all([
          fetchRecords(token),
          fetchConversations(token),
          fetchTelegram(token).catch(() => null),
          fetchDocuments(token).catch(() => []),
        ]);
        this.records = records;
        this.conversations = conversations;
        this.telegram = telegram;
        this.documentCount = documents.length;

        // The list has no names; open the few waiting conversations to get them.
        const waiting = conversations.filter((c) => c.status === 'needs_human').slice(0, ATTENTION_LIMIT);
        const opened = await Promise.allSettled(waiting.map((c) => fetchConversation(token, c.id)));
        this.handoffs = opened.filter((r) => r.status === 'fulfilled').map((r) => r.value);

        const business = this.$store.getters['auth/business'];
        this.shared = !!business && wasShared(business.id);
        this.$store.dispatch('inbox/load').catch(() => {});
      } catch (error) {
        this.error = error.message;
      }
      this.ready = true;
    },
    openTestChat() {
      this.$store.commit('ui/setTestSheet', true);
    },
    onCopied() {
      const business = this.$store.getters['auth/business'];
      if (business) markShared(business.id);
      this.shared = true;
    },
  },
};
</script>
