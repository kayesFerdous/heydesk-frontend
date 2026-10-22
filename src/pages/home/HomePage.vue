<template>
  <!-- Home lays its islands straight on the grey canvas, under a greeting:
       what needs the owner, the agent, today's figures, today by hour. -->
  <section class="px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <header class="px-1 pb-6 md:px-3 md:pt-3">
      <h1 class="text-[2rem] leading-tight font-extrabold tracking-[-0.03em] text-balance sm:text-[2.5rem]">{{ title }}</h1>
      <p class="mt-1 max-w-2xl text-base text-ink-soft">
        {{ today }}<template v-if="ready && agent.hasAgent && !conversationsToday"> &middot; {{ t('home.todayNone') }}</template>
      </p>
    </header>

    <LoadError v-if="error" :message="error" class="island" @retry="load"></LoadError>

    <!-- First run: no agent yet, one clear way forward. -->
    <div v-else-if="agent.noAgent" class="island max-w-2xl p-6 sm:p-8">
      <BrandMark mark-only class="!h-12 !w-12"></BrandMark>
      <h2 class="mt-5 text-2xl font-bold tracking-[-0.02em]">{{ t('common.letsSetUp') }}</h2>
      <p class="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{{ t('home.setUpText') }}</p>
      <router-link v-if="auth.canManage" to="/setup" class="btn btn-primary mt-6">
        {{ t('common.setUpYourAgent') }}
        <PhArrowRight :size="16" weight="bold"></PhArrowRight>
      </router-link>
    </div>

    <div v-else-if="!ready" class="grid gap-3 xl:grid-cols-12" aria-hidden="true">
      <div class="island p-6 xl:col-span-7">
        <div class="skeleton h-6 w-32"></div>
        <div v-for="n in 4" :key="n" class="skeleton mt-4 h-16 w-full !rounded-[var(--radius-card)]"></div>
      </div>
      <div class="grid content-start gap-3 xl:col-span-5">
        <div class="skeleton h-56 !rounded-[var(--radius-panel)]"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="skeleton h-48 !rounded-[var(--radius-panel)]"></div>
          <div class="skeleton h-48 !rounded-[var(--radius-panel)]"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid gap-3 xl:grid-cols-12">
      <!-- The setup guide: the shortest road to a first real customer. It
           goes away once every step is done. -->
      <div v-if="!setupDone && auth.canManage" class="island overflow-hidden xl:col-span-12">
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
          <div>
            <h2 class="text-xl font-bold tracking-[-0.02em]">{{ t('setup.finish') }}</h2>
            <p class="mt-0.5 text-sm text-ink-soft">
              {{ t('home.stepsLeft', { n: formatNumber(todo.length), done: formatNumber(doneCount), total: formatNumber(steps.length) }, todo.length) }}
            </p>
          </div>
          <div class="flex gap-1" aria-hidden="true">
            <span v-for="step in steps" :key="step.id" class="h-2 w-8 rounded-full" :class="step.done ? 'bg-ink' : 'bg-hover'"></span>
          </div>
        </div>
        <!-- Only what is left. Done steps only count toward the bar above. -->
        <ol class="flex flex-col gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
          <li
            v-for="(step, index) in todo"
            :key="step.id"
            class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-[var(--radius-card)] bg-wash p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <span
              class="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
              :class="index === 0 ? 'bg-lime text-ink' : 'bg-surface text-ink-soft'"
              aria-hidden="true"
            >
              {{ formatNumber(doneCount + index + 1) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold">{{ step.title }}</p>
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

      <div class="flex min-w-0 flex-col gap-3 xl:col-span-7">
        <!-- What needs a person now: hand-offs first, then new records. -->
        <div class="island min-w-0 p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-bold tracking-[-0.02em]">{{ t('home.needsYou') }}</h2>
          <router-link to="/inbox" class="btn btn-secondary btn-sm btn-icon" :aria-label="t('home.openInbox')" :title="t('home.openInbox')">
            <PhArrowRight :size="16" weight="bold"></PhArrowRight>
          </router-link>
        </div>

        <p v-if="!attention.length" class="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] bg-wash p-4 text-sm">
          <PhCheckCircle :size="24" weight="fill" class="shrink-0 text-success"></PhCheckCircle>
          <span>
            <span class="font-semibold">{{ t('home.nothingWaiting') }}</span>{{ ' ' }}<span class="text-ink-soft">{{ t('home.nothingWaitingText') }}</span>
          </span>
        </p>

        <ul v-else class="mt-4 flex flex-col gap-2">
          <li v-for="item in attention" :key="item.id" class="flex items-center gap-2 rounded-[var(--radius-card)] bg-wash p-2 pr-2.5 transition-colors hover:bg-hover">
            <router-link :to="item.to" class="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-card)] p-1">
              <span
                class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold"
                :class="item.handoff ? 'bg-attention-tint text-attention' : item.tint"
                aria-hidden="true"
              >
                <PhUserSound v-if="item.handoff" :size="20" weight="bold"></PhUserSound>
                <template v-else>{{ item.initials }}</template>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[0.9375rem] font-bold">{{ item.title }}</span>
                <span class="block truncate text-sm text-ink-soft">
                  <span v-if="item.code" class="serial">{{ item.code }}</span><template v-if="item.code">, </template>{{ item.text }}
                </span>
              </span>
              <span class="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <StatusChip :status="item.status"></StatusChip>
                <span class="text-xs text-ink-soft">{{ item.when }}<template v-if="item.amount">, {{ item.amount }}</template></span>
              </span>
            </router-link>
            <!-- A customer waiting for a person: call them from here. -->
            <a
              v-if="item.phone"
              :href="`tel:${item.phone}`"
              class="btn btn-primary btn-icon shrink-0"
              :aria-label="t('home.call', { name: item.name })"
              :title="t('home.call', { name: item.name })"
            >
              <PhPhone :size="18" weight="fill"></PhPhone>
            </a>
          </li>
        </ul>
        <i18n-t v-if="moreWaiting" keypath="home.moreWaiting" tag="p" class="mt-3 px-1 text-sm text-ink-soft" scope="global">
          <template #n>{{ formatNumber(moreWaiting) }}</template>
          <template #inbox><router-link to="/inbox" class="link">{{ t('home.inbox') }}</router-link></template>
        </i18n-t>
      </div>

        <!-- When customers came today: conversations per hour, the busiest in black. -->
        <div class="island flex min-h-72 flex-1 flex-col p-5 sm:p-6">
          <h2 class="text-xl font-bold tracking-[-0.02em]">{{ t('home.byHour') }}</h2>
          <p class="mt-0.5 text-sm text-ink-soft">{{ t('home.byHourText') }}</p>
          <HourBars class="mt-10 min-h-40 flex-1" large :now="nowHour" :values="conversationHours" :label="t('home.byHour')"></HourBars>
        </div>
      </div>

      <div class="grid min-w-0 content-start gap-3 xl:col-span-5">
        <!-- The agent: is it on, where customers reach it, and one tap to try it. -->
        <div class="island bg-lime p-5 sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-bold tracking-[-0.02em]">{{ t('nav.yourAgent') }}</h2>
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              <span class="h-2.5 w-2.5 rounded-full" :class="auth.isSuspended ? 'bg-attention' : 'bg-ink'" aria-hidden="true"></span>
              {{ auth.isSuspended ? t('common.pausedByHeyDesk') : t('common.live') }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-sm text-ink/70">{{ agent.config.name }}</p>

          <ul class="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            <li class="flex h-10 items-center gap-2 rounded-full bg-surface px-4">
              <PhGlobe :size="18"></PhGlobe>{{ t('channelsPage.websiteChat') }}
            </li>
            <li v-if="telegram" class="flex h-10 items-center gap-2 rounded-full bg-surface px-4">
              <PhTelegramLogo :size="18"></PhTelegramLogo>@{{ telegram.username }}
            </li>
            <li v-else-if="auth.canManage">
              <router-link to="/channels" class="flex h-10 items-center gap-2 rounded-full border border-dashed border-ink/40 px-4 hover:bg-surface/60">
                <PhTelegramLogo :size="18"></PhTelegramLogo>{{ t('home.connectTelegram') }}
              </router-link>
            </li>
            <li v-if="auth.canManage">
              <router-link to="/knowledge" class="flex h-10 items-center gap-2 rounded-full bg-surface px-4 hover:bg-surface/80">
                <PhBooks :size="18"></PhBooks>{{ t('home.documents', { n: formatNumber(documentCount) }, documentCount) }}
              </router-link>
            </li>
          </ul>

          <button
            type="button"
            class="mt-4 flex h-14 w-full items-center gap-3 rounded-full bg-surface pr-1.5 pl-5 text-left text-sm text-ink-soft transition-shadow hover:shadow-[var(--shadow-lift)]"
            @click="ui.testSheetOpen = true"
          >
            <span class="min-w-0 flex-1 truncate">{{ t('home.askAgent') }}</span>
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white" aria-hidden="true">
              <PhPaperPlaneTilt :size="18" weight="fill"></PhPaperPlaneTilt>
            </span>
          </button>

          <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm font-semibold">
            <button type="button" class="inline-flex items-center gap-1.5 hover:underline" @click="copyLink">
              <component :is="copied ? PhCheck : PhLink" :size="16" weight="bold"></component>
              {{ copied ? t('common.copied') : t('home.copyChatLink') }}
            </button>
            <router-link v-if="auth.canManage" to="/agent" class="inline-flex items-center gap-1.5 hover:underline">
              <PhSlidersHorizontal :size="16" weight="bold"></PhSlidersHorizontal>
              {{ t('home.editSettings') }}
            </router-link>
          </div>
        </div>

        <!-- Today's figures, each with its hours underneath. -->
        <div class="grid grid-cols-2 gap-3">
          <div class="island flex min-w-0 flex-col bg-lilac p-5">
            <h2 class="truncate text-[0.9375rem] font-bold">{{ lead.label }}</h2>
            <p class="mt-2 truncate text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] sm:text-[2.25rem]">{{ lead.value }}</p>
            <HourBars class="mt-5 h-16" :values="lead.hours" :label="lead.label" bar-class="bg-ink/15"></HourBars>
          </div>
          <div class="island flex min-w-0 flex-col p-5">
            <h2 class="truncate text-[0.9375rem] font-bold">{{ t('home.figures.conversations') }}</h2>
            <p class="mt-2 text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] sm:text-[2.25rem]">{{ formatNumber(conversationsToday) }}</p>
            <HourBars class="mt-5 h-16" :values="conversationHours" :label="t('home.figures.conversations')"></HourBars>
          </div>
        </div>
        <p v-if="others.length" class="flex flex-wrap gap-x-5 gap-y-1 px-2 text-sm text-ink-soft">
          <span v-for="cell in others" :key="cell.id">{{ cell.label }} <span class="font-bold text-ink">{{ cell.value }}</span></span>
        </p>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PhArrowRight,
  PhBooks,
  PhCheck,
  PhCheckCircle,
  PhGlobe,
  PhLink,
  PhPaperPlaneTilt,
  PhPhone,
  PhSlidersHorizontal,
  PhTelegramLogo,
  PhUserSound,
} from '@phosphor-icons/vue';

import LoadError from '../../components/ui/LoadError.vue';
import BrandMark from '../../components/ui/BrandMark.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import HourBars from '../../components/home/HourBars.vue';
import { fetchRecords, byConversation } from '../../api/records.js';
import { fetchConversations } from '../../api/conversations.js';
import { fetchTelegram } from '../../api/telegram.js';
import { fetchDocuments } from '../../api/agent.js';
import { formatMoney, formatNumber, formatAgo, formatToday, greeting } from '../../lib/format.js';
import { isToday, avatarTint, initials, hourOf, todayByHour } from '../../lib/group.js';
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

// Today's figures. The lilac tile leads with the money orders brought in,
// else the first job's count; the other jobs follow in one line under it.
// ponytail: counted from the first page (100 of each), enough for a day of a
// small business; a figures endpoint when one outgrows it.
const todayRecords = computed(() => records.value.filter((r) => isToday(r.created_at, timezone.value)));
const jobFigures = computed(() =>
  agent.jobs.map((job) => ({
    id: job,
    label: t(`home.figures.${job}`),
    value: formatNumber(todayRecords.value.filter((r) => r.job === job).length),
    hours: todayByHour(todayRecords.value.filter((r) => r.job === job), timezone.value),
  })),
);
const lead = computed(() => {
  if (!takesMoney.value) return jobFigures.value[0] || { id: 'none', label: '', value: '', hours: Array(24).fill(0) };
  const orders = todayRecords.value.filter((r) => r.job === 'order');
  return {
    id: 'taken',
    label: t('home.figures.taken'),
    value: formatMoney(orders.reduce((sum, r) => sum + (r.total || 0), 0)),
    hours: todayByHour(orders, timezone.value, (r) => r.total || 0),
  };
});
const others = computed(() => jobFigures.value.filter((cell) => cell.id !== lead.value.id));
const conversationHours = computed(() => todayByHour(conversations.value, timezone.value));
const nowHour = computed(() => hourOf(new Date().toISOString(), timezone.value));

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
    const record = (recordsOf[c.id] || [])[0];
    const name = record?.customer_name || t('home.aVisitor');
    return {
      id: c.id,
      handoff: true,
      name,
      phone: record?.customer_phone || '',
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

// Copying the chat link counts as sharing it, for the setup guide.
const copied = ref(false);
let copiedTimer = null;

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch (err) {
    return; // Clipboard blocked: the link is on the Channels page to copy by hand.
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = false), 2000);
  if (auth.business) markShared(auth.business.id);
  shared.value = true;
}
onBeforeUnmount(() => clearTimeout(copiedTimer));

// Closing the test chat may have finished "Try your agent": check again.
watch(
  () => ui.testSheetOpen,
  (open) => {
    if (!open && agent.hasAgent) refreshConversations();
  },
);

load();
</script>
