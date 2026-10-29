<template>
  <!-- The business's team (backend D97): the owner adds moderators, who run the
       inbox but not the settings, and sees what everyone changed. -->
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('team.title')" :tip="t('team.subtitle')"></PageHeader>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>
    <SkeletonRows v-else-if="!loaded" class="island overflow-hidden"></SkeletonRows>

    <div v-else class="island px-5 pt-6 pb-4 sm:px-8">
      <SettingsGroup :title="t('team.people')" :tip="t('team.peopleTip')">
        <ul class="border-t border-hairline">
          <li v-for="member in members" :key="member.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline py-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand" aria-hidden="true">
              {{ member.email.charAt(0).toUpperCase() }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">{{ member.email }}</span>
              <span class="block text-sm text-ink-soft">
                {{ roleName(member.role) }}
                <template v-if="member.status === 'active' && member.role === 'moderator'">
                  &middot; {{ t('team.joined', { day: formatDay(member.joined_at) }) }}
                </template>
              </span>
            </span>

            <span v-if="member.status === 'invited'" class="chip bg-hover text-ink-soft">
              <PhEnvelopeSimple :size="14"></PhEnvelopeSimple>
              {{ t('team.invited') }}
            </span>
            <!-- How busy they are now (backend I1): what a hand-off goes by. -->
            <span v-else class="chip bg-hover text-ink-soft" :title="t('conversations.assign.openHint')">
              <PhChatsCircle :size="14"></PhChatsCircle>
              {{ t('conversations.assign.open', { n: formatNumber(member.open_chats || 0) }) }}
            </span>

            <!-- Removing asks once more, in the row: it signs them out at once. -->
            <span v-if="confirmingId === member.id" class="flex items-center gap-2 text-sm">
              <span>{{ t('team.removeIt') }}</span>
              <button type="button" class="btn btn-danger btn-sm" :disabled="busyId === member.id" @click="remove(member)">
                {{ busyId === member.id ? t('team.removing') : t('common.remove') }}
              </button>
              <button type="button" class="btn btn-quiet btn-sm" @click="confirmingId = null">{{ t('common.cancel') }}</button>
            </span>
            <span v-else-if="member.role === 'moderator'" class="flex items-center gap-1">
              <button
                v-if="member.status === 'invited'"
                type="button"
                class="btn btn-quiet btn-sm"
                :disabled="busyId === member.id"
                @click="resend(member)"
              >
                {{ t('team.sendAgain') }}
              </button>
              <button type="button" class="btn btn-quiet btn-sm" @click="confirmingId = member.id">{{ t('common.remove') }}</button>
            </span>
          </li>
        </ul>

        <p v-if="rowError" class="flex items-start gap-2 text-sm text-danger" role="alert">
          <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
          {{ rowError }}
        </p>

        <form class="flex max-w-md flex-col gap-3" novalidate @submit.prevent="invite">
          <div>
            <label class="label" for="invite-email">{{ t('team.addLabel') }}</label>
            <div class="flex gap-2">
              <input
                id="invite-email"
                v-model.trim="email"
                class="field"
                :class="{ 'field-invalid': !emailValid }"
                type="email"
                autocomplete="off"
                :placeholder="t('team.emailPlaceholder')"
                @blur="emailValid = true"
              />
              <button type="submit" class="btn btn-primary shrink-0" :disabled="inviting || !email">
                <PhUserPlus :size="16"></PhUserPlus>
                {{ inviting ? t('common.saving') : t('team.add') }}
              </button>
            </div>
            <p class="hint">{{ t('team.addHint') }}</p>
          </div>
          <p v-if="inviteError" class="flex items-start gap-2 text-sm text-danger" role="alert">
            <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
            {{ inviteError }}
          </p>
          <p v-if="sent" class="flex items-start gap-2 text-sm text-success" role="status">
            <PhCheckCircle :size="18" weight="fill" class="mt-px shrink-0"></PhCheckCircle>
            {{ sent }}
          </p>
        </form>
      </SettingsGroup>

      <!-- Who gets a chat when a customer asks for a person (backend I1). Saved at once. -->
      <SettingsGroup v-if="agent.config" :title="t('team.handoffs.title')" :tip="t('team.handoffs.tip')">
        <fieldset class="flex max-w-xl flex-col gap-2" :disabled="savingHandoffs">
          <legend class="sr-only">{{ t('team.handoffs.title') }}</legend>
          <label
            v-for="choice in HANDOFF_CHOICES"
            :key="choice.id"
            class="panel flex cursor-pointer items-start gap-3 p-4 transition-colors"
            :class="{ 'border-ink': autoAssign === choice.on }"
          >
            <input
              type="radio"
              name="handoffs"
              class="mt-0.5 h-4 w-4 accent-[var(--color-ink)]"
              :checked="autoAssign === choice.on"
              @change="saveHandoffs(choice.on)"
            />
            <span>
              <span class="block text-sm font-semibold">{{ t(`team.handoffs.${choice.id}`) }}</span>
              <span class="block text-sm text-ink-soft">{{ t(`team.handoffs.${choice.id}Text`) }}</span>
            </span>
          </label>
          <p v-if="handoffsError" class="text-sm text-danger" role="alert">{{ handoffsError }}</p>
          <p v-else-if="handoffsSaved" class="text-sm text-success" role="status">{{ t('team.handoffs.saved') }}</p>
        </fieldset>
      </SettingsGroup>

      <SettingsGroup :title="t('team.activityTitle')" :tip="t('team.activityTip')">
        <p v-if="!activity.length" class="text-sm text-ink-soft">{{ t('team.nothingYet') }}</p>
        <div class="max-h-[28rem] overflow-y-auto overscroll-contain pr-2" tabindex="0" role="region" :aria-label="t('team.activityTitle')">
        <div v-for="group in activityGroups" :key="group.label">
          <h3 class="sticky top-0 z-10 border-b border-hairline bg-surface py-1.5 text-xs font-semibold text-ink-soft">{{ group.label }}</h3>
          <div
            v-for="event in group.items"
            :key="event.at + event.action"
            class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-hairline py-3 text-sm"
          >
            <p class="min-w-0">
              <span class="font-semibold">{{ event.actor_email }}</span>
              <span class="ml-1 text-ink-soft">{{ event.text }}</span>
              <router-link v-if="event.to" :to="event.to" class="link ml-1">{{ t('team.open') }}</router-link>
            </p>
            <p class="text-ink-soft">{{ formatTime(event.at, timezone) }}</p>
          </div>
        </div>
        <ShowMore v-if="hasMore" :loading="loadingMore" :error="moreError" @more="more"></ShowMore>
        </div>
      </SettingsGroup>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhChatsCircle, PhCheckCircle, PhEnvelopeSimple, PhUserPlus, PhWarningCircle } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import ShowMore from '../../components/ui/ShowMore.vue';
import { fetchActivity, fetchMembers, inviteMember, removeMember, resendInvite } from '../../api/team.js';
import { formatDay, formatNumber, formatTime } from '../../lib/format.js';
import { groupByDay, PAGE_SIZE } from '../../lib/group.js';
import { describeActivity, roleName } from '../../lib/team.js';
import { useAgentStore } from '../../stores/agent.js';

const { t } = useI18n();
const agent = useAgentStore();
const timezone = computed(() => agent.config?.timezone || 'Asia/Dhaka');

const members = ref([]);
const activity = ref([]); // only grows, so it comes a page at a time
const hasMore = ref(false);
const loaded = ref(false);
const loadError = ref(null);
const loadingMore = ref(false);
const moreError = ref(null);
// Each line in words ("Changed an order"), with a link to what it changed when it can be opened.
const activityGroups = computed(() =>
  groupByDay(activity.value.map((event) => ({ ...event, ...describeActivity(event) })), 'at', timezone.value),
);

const email = ref('');
const emailValid = ref(true);
const inviting = ref(false);
const inviteError = ref(null);
const sent = ref('');
const busyId = ref(null);
const savingHandoffs = ref(false);
const handoffsError = ref(null);
const handoffsSaved = ref(false);
const confirmingId = ref(null);
const rowError = ref(null);

async function loadActivity() {
  activity.value = await fetchActivity({ limit: PAGE_SIZE });
  hasMore.value = activity.value.length === PAGE_SIZE;
}

async function load() {
  loadError.value = null;
  try {
    [members.value] = await Promise.all([fetchMembers(), loadActivity()]);
    loaded.value = true;
  } catch (error) {
    loadError.value = error.message;
  }
}

// New hand-offs wait for someone to take them, or go to the least busy moderator.
const HANDOFF_CHOICES = [
  { id: 'wait', on: false },
  { id: 'spread', on: true },
];
const autoAssign = computed(() => Boolean(agent.config?.handoff.auto_assign));

async function saveHandoffs(on) {
  savingHandoffs.value = true;
  handoffsError.value = null;
  handoffsSaved.value = false;
  try {
    // The hand-off settings go as one (backend: a top-level field replaces the old one).
    await agent.save({ handoff: { ...agent.config.handoff, auto_assign: on } });
    handoffsSaved.value = true;
    refreshActivity();
  } catch (error) {
    handoffsError.value = error.message;
  }
  savingHandoffs.value = false;
}

async function more() {
  loadingMore.value = true;
  moreError.value = null;
  try {
    const older = await fetchActivity({ limit: PAGE_SIZE, before: activity.value[activity.value.length - 1].at });
    activity.value = [...activity.value, ...older];
    hasMore.value = older.length === PAGE_SIZE;
  } catch (error) {
    moreError.value = error.message;
  }
  loadingMore.value = false;
}

// Each change is in the activity too, so it is fetched again after one.
function refreshActivity() {
  loadActivity().catch(() => {});
}

async function invite() {
  inviteError.value = null;
  sent.value = '';
  emailValid.value = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
  if (!emailValid.value) return;
  inviting.value = true;
  try {
    const member = await inviteMember(email.value);
    members.value = [...members.value, member];
    sent.value = t('team.sent', { email: member.email });
    email.value = '';
    refreshActivity();
  } catch (error) {
    inviteError.value = error.message; // the backend's own words: an account already, or a full team
  }
  inviting.value = false;
}

async function resend(member) {
  busyId.value = member.id;
  rowError.value = null;
  sent.value = '';
  try {
    await resendInvite(member.id);
    sent.value = t('team.sentAgain', { email: member.email });
    refreshActivity();
  } catch (error) {
    rowError.value = error.message;
  }
  busyId.value = null;
}

async function remove(member) {
  busyId.value = member.id;
  rowError.value = null;
  try {
    await removeMember(member.id);
    members.value = members.value.filter((m) => m.id !== member.id);
    confirmingId.value = null;
    refreshActivity();
  } catch (error) {
    rowError.value = error.message;
  }
  busyId.value = null;
}

load();
agent.load().catch(() => {}); // for the hand-off choice
</script>
