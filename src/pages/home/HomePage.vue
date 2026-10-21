<template>
  <section>
    <PageHeader :title="title">
      <template #subtitle>
        <p class="mt-1.5 max-w-2xl text-sm text-ink-soft">
          {{ today }}<template v-if="ready && agent.hasAgent && !conversationsToday"> &middot; {{ t('home.todayNone') }}</template>
        </p>
      </template>
    </PageHeader>

    <LoadError v-if="error" :message="error" @retry="load"></LoadError>

    <!-- First run: no agent yet, one clear way forward. -->
    <div v-else-if="agent.noAgent" class="px-5 py-10 sm:px-8">
      <div class="panel max-w-2xl overflow-hidden p-6 sm:p-8">
        <BrandMark mark-only></BrandMark>
        <h2 class="mt-5 text-xl font-semibold tracking-[-0.015em]">{{ t('common.letsSetUp') }}</h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{{ t('home.setUpText') }}</p>
        <router-link v-if="auth.canManage" to="/setup" class="btn btn-primary mt-6">
          {{ t('common.setUpYourAgent') }}
          <PhArrowRight :size="16" weight="bold"></PhArrowRight>
        </router-link>
      </div>
    </div>

    <div v-else-if="!ready" aria-hidden="true">
      <div class="flex gap-10 border-b border-hairline px-5 py-6 sm:px-8">
        <div v-for="n in 4" :key="n">
          <div class="skeleton h-3.5 w-24"></div>
          <div class="skeleton mt-3 h-7 w-16"></div>
        </div>
      </div>
      <div class="px-5 pt-8 sm:px-8">
        <div class="skeleton h-5 w-32"></div>
        <div class="skeleton mt-4 h-14 w-full max-w-3xl"></div>
        <div class="skeleton mt-2 h-14 w-full max-w-3xl"></div>
      </div>
    </div>

    <template v-else>
      <!-- Today's statement: the passbook's balance line. Only what this kind
           of agent takes is counted. -->
      <dl class="grid grid-cols-2 gap-y-5 border-b border-hairline px-5 pt-2 pb-6 sm:flex sm:px-8">
        <div
          v-for="(cell, index) in figures"
          :key="cell.id"
          class="min-w-0 sm:flex-1 sm:pr-6"
          :class="{ 'sm:border-l sm:border-hairline sm:pl-6': index > 0 }"
        >
          <dt class="flex items-center gap-1.5 text-[0.8125rem] text-ink-soft">
            <component :is="cell.icon" :size="15" class="shrink-0" :class="cell.alert ? 'text-attention' : 'text-ink-faint'"></component>
            <span class="truncate">{{ cell.label }}</span>
          </dt>
          <dd class="mt-2 text-[1.75rem] leading-none font-semibold tracking-[-0.02em]" :class="{ 'text-attention': cell.alert }">
            {{ cell.value }}
          </dd>
        </div>
      </dl>

      <div class="grid gap-x-10 gap-y-10 px-5 pt-8 pb-12 sm:px-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="min-w-0">
          <!-- The setup guide: the shortest road to a first real customer. It
               goes away once every step is done. -->
          <div v-if="!setupDone && auth.canManage" class="panel mb-10 overflow-hidden">
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
                  class="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold"
                  :class="index === 0 ? 'border-brand bg-brand text-white' : 'border-line-strong text-ink-soft'"
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

          <!-- What needs a person now, as ledger entries: hand-offs first, then
               new records. The columns never move. -->
          <div class="flex items-baseline justify-between gap-4">
            <h2 class="section-title">{{ t('home.needsYou') }}</h2>
            <router-link v-if="attention.length" to="/inbox" class="link text-sm">{{ t('home.openInbox') }}</router-link>
          </div>

          <p v-if="!attention.length" class="mt-3 flex items-center gap-3 border-y border-hairline py-5 text-sm">
            <PhCheckCircle :size="22" class="shrink-0 text-success"></PhCheckCircle>
            <span>
              <span class="font-semibold">{{ t('home.nothingWaiting') }}</span>{{ ' ' }}<span class="text-ink-soft">{{ t('home.nothingWaitingText') }}</span>
            </span>
          </p>

          <div v-else class="mt-3">
            <div class="ledger ledger-head sm:px-2" :class="{ 'ledger-money': takesMoney }" aria-hidden="true">
              <span>{{ t('home.columns.when') }}</span>
              <span class="col-span-2">{{ t('home.columns.entry') }}</span>
              <span>{{ t('home.columns.code') }}</span>
              <span v-if="takesMoney" class="text-right">{{ t('home.columns.amount') }}</span>
              <span>{{ t('home.columns.status') }}</span>
            </div>
            <ul class="border-t border-hairline sm:border-t-0">
              <li v-for="item in attention" :key="item.id">
                <router-link :to="item.to" class="row ledger py-3 sm:px-2" :class="{ 'ledger-money': takesMoney }">
                  <span class="hidden text-[0.8125rem] text-ink-soft sm:block">{{ item.when }}</span>
                  <span
                    class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                    :class="item.handoff ? 'bg-attention-tint text-attention' : item.tint"
                    aria-hidden="true"
                  >
                    <PhUserSound v-if="item.handoff" :size="18" weight="bold"></PhUserSound>
                    <template v-else>{{ item.initials }}</template>
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-semibold">{{ item.title }}</span>
                    <span class="block truncate text-sm text-ink-soft">{{ item.text }}</span>
                  </span>
                  <span class="serial hidden truncate text-ink-soft sm:block">{{ item.code }}</span>
                  <span v-if="takesMoney" class="hidden text-right text-sm font-semibold sm:block">{{ item.amount }}</span>
                  <span class="hidden sm:block"><StatusChip :status="item.status"></StatusChip></span>
                  <PhCaretRight :size="16" class="justify-self-end text-ink-faint"></PhCaretRight>
                </router-link>
              </li>
            </ul>
          </div>
          <i18n-t v-if="moreWaiting" keypath="home.moreWaiting" tag="p" class="mt-3 text-sm text-ink-soft" scope="global">
            <template #n>{{ formatNumber(moreWaiting) }}</template>
            <template #inbox><router-link to="/inbox" class="link">{{ t('home.inbox') }}</router-link></template>
          </i18n-t>
        </div>

        <!-- The agent's certificate: is it on, where customers reach it. -->
        <aside class="panel self-start overflow-hidden p-5">
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
            <div v-if="auth.canManage" class="flex items-center justify-between gap-3 border-t border-hairline py-3">
              <dt class="flex items-center gap-2 text-ink-soft"><PhTelegramLogo :size="16"></PhTelegramLogo> Telegram</dt>
              <dd>
                <span v-if="telegram" class="font-medium">@{{ telegram.username }}</span>
                <router-link v-else to="/channels" class="link">{{ t('connect.connect') }}</router-link>
              </dd>
            </div>
            <div v-if="auth.canManage" class="flex items-center justify-between gap-3 border-y border-hairline py-3">
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

          <router-link v-if="auth.canManage" to="/agent" class="btn btn-secondary mt-5 w-full">
            <PhSlidersHorizontal :size="16"></PhSlidersHorizontal>
            {{ t('home.editSettings') }}
          </router-link>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhArrowRight,
  PhBooks,
  PhCalendarCheck,
  PhCaretRight,
  PhChatCircleDots,
  PhChatsCircle,
  PhCheckCircle,
  PhCoins,
  PhEnvelopeSimple,
  PhGlobe,
  PhHourglassMedium,
  PhReceipt,
  PhSlidersHorizontal,
  PhTelegramLogo,
  PhUserSound,
} from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import BrandMark from '../../components/ui/BrandMark.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import CopyField from '../../components/ui/CopyField.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import { fetchRecords, byConversation } from '../../api/records.js';
import { fetchConversations } from '../../api/conversations.js';
import { fetchTelegram } from '../../api/telegram.js';
import { fetchDocuments } from '../../api/agent.js';
import { formatMoney, formatNumber, formatAgo, formatToday, greeting } from '../../lib/format.js';
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

// The icon beside each job's figure in today's statement.
const JOB_ICONS = { order: PhReceipt, appointment: PhCalendarCheck, message: PhEnvelopeSimple };

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

const today = computed(() => formatToday(timezone.value));
// Only an agent that takes orders handles money, so only it gets an amount column.
const takesMoney = computed(() => agent.jobs.includes('order'));
const conversationsToday = computed(
  () => conversations.value.filter((c) => isToday(c.created_at, timezone.value)).length,
);

// Today's statement: conversations, one figure per job this agent takes, the
// money orders brought in, and how many things wait for the owner.
const figures = computed(() => {
  const today = records.value.filter((r) => isToday(r.created_at, timezone.value));
  const cells = [
    { id: 'chats', icon: PhChatsCircle, label: t('home.figures.conversations'), value: formatNumber(conversationsToday.value) },
  ];
  for (const job of agent.jobs) {
    const count = today.filter((r) => r.job === job).length;
    cells.push({ id: job, icon: JOB_ICONS[job], label: t(`home.figures.${job}`), value: formatNumber(count) });
  }
  if (takesMoney.value) {
    const total = today.filter((r) => r.job === 'order').reduce((sum, r) => sum + (r.total || 0), 0);
    cells.push({ id: 'taken', icon: PhCoins, label: t('home.figures.taken'), value: formatMoney(total) });
  }
  const waitingCount = handoffs.value.length + waiting.value.length;
  cells.push({
    id: 'waiting',
    icon: PhHourglassMedium,
    label: t('home.figures.waiting'),
    value: formatNumber(waitingCount),
    alert: waitingCount > 0,
  });
  return cells;
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
      // A moderator has no Telegram or Knowledge to set up (backend D97).
      auth.canManage ? fetchTelegram().catch(() => null) : null,
      auth.canManage ? fetchDocuments().catch(() => []) : [],
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
