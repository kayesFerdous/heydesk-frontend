<template>
  <section>
    <PageHeader :title="title">
      <template #subtitle>
        <p v-if="ready && agent.hasAgent" class="mt-1 max-w-2xl text-sm text-ink-soft">{{ todayLine }}</p>
        <p v-else-if="!ready" class="skeleton mt-2 h-4 w-72" aria-hidden="true"></p>
      </template>
    </PageHeader>

    <LoadError v-if="error" :message="error" @retry="load"></LoadError>

    <!-- First run: no agent yet, one clear way forward. -->
    <div v-else-if="agent.noAgent" class="px-5 pb-12 sm:px-8">
      <div class="panel max-w-2xl p-6 sm:p-8">
        <span class="grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-brand text-white" aria-hidden="true">
          <PhSparkle :size="22" weight="fill"></PhSparkle>
        </span>
        <h2 class="mt-5 text-xl font-semibold tracking-[-0.01em]">{{ t('common.letsSetUp') }}</h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{{ t('home.setUpText') }}</p>
        <router-link to="/setup" class="btn btn-primary mt-6">
          {{ t('common.setUpYourAgent') }}
          <PhArrowRight :size="16" weight="bold"></PhArrowRight>
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
              <h2 class="section-title">{{ t('setup.finish') }}</h2>
              <p class="mt-0.5 text-sm text-ink-soft">
                {{ t('home.stepsLeft', { n: formatNumber(todo.length), done: formatNumber(doneCount), total: formatNumber(steps.length) }, todo.length) }}
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
                {{ formatNumber(doneCount + index + 1) }}
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
                @click="ui.testSheetOpen = true"
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
          <h2 class="section-title">{{ t('home.needsYou') }}</h2>
          <router-link v-if="attention.length" to="/inbox" class="link text-sm">{{ t('home.openInbox') }}</router-link>
        </div>

        <div v-if="!attention.length" class="mt-3 flex items-center gap-3 rounded-[var(--radius-panel)] bg-wash px-5 py-5">
          <PhCheckCircle :size="22" class="shrink-0 text-success"></PhCheckCircle>
          <p class="text-sm">
            <span class="font-semibold">{{ t('home.nothingWaiting') }}</span>
            <span class="text-ink-soft"> {{ t('home.nothingWaitingText') }}</span>
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
                <PhUserSound v-if="item.handoff" :size="18" weight="bold"></PhUserSound>
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
              <StatusChip :status="item.status" class="hidden shrink-0 sm:inline-flex"></StatusChip>
              <PhCaretRight :size="16" class="shrink-0 text-ink-faint"></PhCaretRight>
            </router-link>
          </li>
        </ul>
        <i18n-t v-if="moreWaiting" keypath="home.moreWaiting" tag="p" class="mt-3 text-sm text-ink-soft" scope="global">
          <template #n>{{ formatNumber(moreWaiting) }}</template>
          <template #inbox><router-link to="/inbox" class="link">{{ t('home.inbox') }}</router-link></template>
        </i18n-t>
      </div>

      <!-- The agent at a glance: is it on, where customers reach it. -->
      <aside class="xl:border-l xl:border-hairline xl:pl-10">
        <h2 class="section-title">{{ t('nav.yourAgent') }}</h2>
        <div class="mt-4 flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand" aria-hidden="true">
            <PhChatCircleDots :size="20" weight="fill"></PhChatCircleDots>
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ agent.config.name }}</p>
            <LiveStatus :paused="auth.isSuspended"></LiveStatus>
          </div>
        </div>

        <dl class="mt-5 flex flex-col text-sm">
          <div class="flex items-center justify-between gap-3 border-t border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><PhGlobe :size="16"></PhGlobe> {{ t('channelsPage.websiteChat') }}</dt>
            <dd class="font-medium">{{ t('common.on') }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><PhTelegramLogo :size="16"></PhTelegramLogo> Telegram</dt>
            <dd>
              <span v-if="telegram" class="font-medium">@{{ telegram.username }}</span>
              <router-link v-else to="/channels" class="link">{{ t('connect.connect') }}</router-link>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3 border-y border-hairline py-3">
            <dt class="flex items-center gap-2 text-ink-soft"><PhBooks :size="16"></PhBooks> {{ t('nav.knowledge') }}</dt>
            <dd>
              <router-link to="/knowledge" class="font-medium hover:underline">
                {{ t('home.documents', { n: formatNumber(documentCount) }, documentCount) }}
              </router-link>
            </dd>
          </div>
        </dl>

        <div class="mt-5">
          <CopyField :label="t('common.chatLink')" :value="link" @copied="onCopied"></CopyField>
        </div>

        <router-link to="/agent" class="btn btn-secondary mt-5 w-full">
          <PhSlidersHorizontal :size="16"></PhSlidersHorizontal>
          {{ t('home.editSettings') }}
        </router-link>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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
import { fetchRecords, byConversation } from '../../api/records.js';
import { fetchConversations } from '../../api/conversations.js';
import { fetchTelegram } from '../../api/telegram.js';
import { fetchDocuments } from '../../api/agent.js';
import { formatMoney, formatNumber, formatAgo, greeting } from '../../lib/format.js';
import { isToday, avatarTint, initials } from '../../lib/group.js';
import { chatLink, itemsLabel } from '../../lib/presets.js';
import { channelOf } from '../../lib/channels.js';
import { summarize } from '../../lib/records.js';
import { setupSteps, markShared, wasShared } from '../../lib/setup.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';
import { useInboxStore } from '../../stores/inbox.js';
import { useUiStore } from '../../stores/ui.js';

// How many waiting things Home lists before pointing to the inbox.
const ATTENTION_LIMIT = 6;

// The kinds of record the "Today" sentence counts, in its order.
const JOBS = ['order', 'appointment', 'message'];

const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();
const inbox = useInboxStore();
const ui = useUiStore();

const ready = ref(false);
const error = ref(null);
const records = ref([]);
const conversations = ref([]);
const telegram = ref(null);
const documentCount = ref(0);
const shared = ref(false);

const timezone = computed(() => agent.config?.timezone || 'Asia/Dhaka');
const title = computed(() => greeting(timezone.value));
const link = computed(() => chatLink(agent.publicKey));

// "Today your agent had 14 conversations and took 3 orders worth ৳2,450."
const todayLine = computed(() => {
  const chats = conversations.value.filter((c) => isToday(c.created_at, timezone.value)).length;
  if (!chats) return t('home.todayNone');

  const today = records.value.filter((r) => isToday(r.created_at, timezone.value));
  const taken = JOBS.map((job) => {
    const ofJob = today.filter((r) => r.job === job);
    if (!ofJob.length) return null;
    const total = ofJob.reduce((sum, r) => sum + (r.total || 0), 0);
    return t(`home.taken.${job}`, { n: formatNumber(ofJob.length), total: formatMoney(total) }, ofJob.length);
  }).filter(Boolean);

  const had = t('home.conversations', { n: formatNumber(chats) }, chats);
  if (!taken.length) return t('home.todayHad', { had });
  return t('home.todayHadTook', { had, took: taken.join(t('home.and')) });
});

const steps = computed(() =>
  setupSteps({
    missing: agent.missing,
    itemsLabel: itemsLabel(agent.kind),
    triedIt: conversations.value.length > 0,
    shared: shared.value || !!telegram.value,
  }),
);
const doneCount = computed(() => steps.value.filter((step) => step.done).length);
const todo = computed(() => steps.value.filter((step) => !step.done));
const setupDone = computed(() => todo.value.length === 0);
const waiting = computed(() => records.value.filter((r) => r.status === 'new'));
// Customers waiting for a person. Their name comes from a record the
// conversation made, so no conversation has to be opened for it.
const handoffs = computed(() => conversations.value.filter((c) => c.status === 'needs_human'));

const attention = computed(() => {
  const recordsOf = byConversation(records.value);
  const people = handoffs.value.slice(0, ATTENTION_LIMIT).map((c) => {
    const name = (recordsOf[c.id] || [])[0]?.customer_name || t('home.aVisitor');
    return {
      id: c.id,
      handoff: true,
      title: t('conversations.askedForPerson', { name }),
      text: t('home.handoffText', { channel: channelOf(c.channel).long }),
      when: formatAgo(c.updated_at, timezone.value),
      status: 'needs_human',
      to: `/conversations?open=${c.id}`,
    };
  });
  const taken = waiting.value.map((r) => ({
    id: r.id,
    title: r.customer_name || t('records.customer'),
    code: r.code,
    text: summarize(r),
    when: formatAgo(r.created_at, timezone.value),
    amount: r.kind === 'order' ? formatMoney(r.total) : '',
    status: r.status,
    initials: initials(r.customer_name),
    tint: avatarTint(r.customer_name),
    to: `/inbox?job=${r.job}&open=${r.id}`,
  }));
  return [...people, ...taken].slice(0, ATTENTION_LIMIT);
});
const moreWaiting = computed(() => Math.max(0, handoffs.value.length + waiting.value.length - ATTENTION_LIMIT));

async function refreshConversations() {
  try {
    conversations.value = await fetchConversations();
  } catch (err) {
    // Best effort: the next visit loads it again.
  }
}

async function load() {
  error.value = null;
  ready.value = false;
  try {
    await agent.load();
    if (agent.noAgent) {
      ready.value = true;
      return;
    }
    await agent.loadPresets();
    const [recordList, conversationList, bot, documents] = await Promise.all([
      fetchRecords(),
      fetchConversations(),
      fetchTelegram().catch(() => null),
      fetchDocuments().catch(() => []),
    ]);
    records.value = recordList;
    conversations.value = conversationList;
    telegram.value = bot;
    documentCount.value = documents.length;
    shared.value = !!auth.business && wasShared(auth.business.id);
    inbox.load().catch(() => {});
  } catch (err) {
    error.value = err.message;
  }
  ready.value = true;
}

function onCopied() {
  if (auth.business) markShared(auth.business.id);
  shared.value = true;
}

// Closing the test chat may have finished "Try your agent": check again.
watch(
  () => ui.testSheetOpen,
  (open) => {
    if (!open && agent.hasAgent) refreshConversations();
  },
);

load();
</script>
