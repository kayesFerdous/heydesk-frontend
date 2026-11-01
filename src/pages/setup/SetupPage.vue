<template>
  <div class="flex min-h-dvh flex-col bg-canvas p-3">
    <header class="flex items-center justify-between px-3 py-2 sm:px-5">
      <BrandMark></BrandMark>
      <div class="flex items-center gap-2">
        <LanguageSwitch></LanguageSwitch>
        <button type="button" class="btn btn-quiet btn-sm" @click="signOut">
          {{ t('common.signOut') }}
        </button>
      </div>
    </header>

    <main class="island mx-auto mt-3 mb-6 w-full max-w-3xl px-5 pt-8 pb-10 sm:px-10">
      <ol class="flex items-center gap-3 text-sm" :aria-label="t('setup.progress')">
        <li
          v-for="(label, index) in steps"
          :key="index"
          class="flex items-center gap-3"
          :class="index > 0 ? 'flex-1' : ''"
        >
          <span v-if="index > 0" class="h-px flex-1 bg-hairline"></span>
          <span class="flex items-center gap-2" :aria-current="index === step ? 'step' : undefined">
            <span
              class="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold"
              :class="index < step ? 'bg-ink text-white' : index === step ? 'bg-lime text-ink' : 'bg-hover text-ink-soft'"
            >
              <PhCheck v-if="index < step" :size="14" weight="bold"></PhCheck>
              <template v-else>{{ formatNumber(index + 1) }}</template>
            </span>
            <span :class="index === step ? 'font-semibold' : 'text-ink-soft'">{{ label }}</span>
          </span>
        </li>
      </ol>

      <!-- Step 1: choose -->
      <section v-if="step === 0" class="mt-12">
        <h1 class="text-[2rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.chooseTitle') }}</h1>
        <p class="mt-2 text-ink-soft">{{ t('setup.chooseText') }}</p>

        <!-- Every service, as ruled rows: one line each, chosen like a radio. Only the live one can be chosen. -->
        <div class="mt-8 flex flex-col gap-1.5" role="radiogroup" :aria-label="t('setup.kind')">
          <button
            v-for="service in SERVICES"
            :key="service.id"
            type="button"
            role="radio"
            :aria-checked="service.id === presetId"
            :aria-disabled="!service.live"
            :disabled="!service.live"
            class="flex w-full items-center gap-4 rounded-[var(--radius-card)] p-3 text-left transition-colors sm:p-4"
            :class="[service.id === presetId ? 'bg-brand-tint' : 'bg-wash', service.live ? 'hover:bg-hover' : 'cursor-not-allowed']"
            @click="presetId = service.id"
          >
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-ink"
              :class="{ 'opacity-55': !service.live }"
              aria-hidden="true"
            >
              <component :is="service.icon" :size="22"></component>
            </span>
            <span class="min-w-0 flex-1" :class="{ 'opacity-55': !service.live }">
              <span class="block font-semibold">{{ serviceLabel(service.id) }}</span>
              <span class="mt-0.5 block text-sm text-ink-soft">{{ serviceDescription(service.id) }}</span>
            </span>
            <span v-if="!service.live" class="chip shrink-0 bg-surface text-ink-soft">{{ t('setup.comingSoon') }}</span>
            <PhCheckCircle v-else-if="service.id === presetId" :size="22" weight="fill" class="shrink-0 text-brand" aria-hidden="true"></PhCheckCircle>
            <PhCircle v-else :size="22" class="shrink-0 text-line-strong" aria-hidden="true"></PhCircle>
          </button>
        </div>

        <p v-if="formError" class="mt-6 text-sm text-danger" role="alert">{{ formError }}</p>

        <div class="mt-10 flex items-center justify-between">
          <p class="text-sm text-ink-soft">{{ t('setup.liveSoon') }}</p>
          <button type="button" class="btn btn-primary" :disabled="!presetId" @click="step = 1">
            {{ t('common.continue') }}
          </button>
        </div>
      </section>

      <!-- Step 2: details -->
      <section v-else-if="step === 1" class="mt-12">
        <h1 class="text-[2rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.detailsTitle') }}</h1>
        <p class="mt-2 text-ink-soft">{{ t('setup.detailsText') }}</p>

        <form class="mt-8 flex max-w-lg flex-col gap-5" novalidate @submit.prevent="create">
          <div>
            <label class="label" for="business-name">{{ t('common.businessName') }}</label>
            <input
              id="business-name"
              v-model.trim="businessName"
              class="field"
              :class="{ 'field-invalid': fieldErrors.business_name }"
              type="text"
              autocomplete="organization"
              @input="onBusinessInput"
            />
            <p v-if="fieldErrors.business_name" class="error-text">
              {{ fieldErrors.business_name }}
            </p>
          </div>

          <div>
            <label class="label" for="agent-name">{{ t('setup.agentName') }}</label>
            <input
              id="agent-name"
              v-model.trim="agentName"
              class="field"
              :class="{ 'field-invalid': fieldErrors.name }"
              type="text"
              @input="agentNameEdited = true"
            />
            <p v-if="fieldErrors.name" class="error-text">{{ fieldErrors.name }}</p>
          </div>

          <div>
            <label class="label" for="address">{{ t('setup.address') }} <span class="font-normal text-ink-soft">{{ t('common.optional') }}</span></label>
            <input id="address" v-model.trim="address" class="field" type="text" autocomplete="street-address" />
          </div>

          <p v-if="formError" class="text-sm text-danger" role="alert">{{ formError }}</p>

          <div class="mt-2 flex items-center justify-between">
            <button type="button" class="btn btn-quiet" :disabled="isCreating" @click="step = 0">{{ t('common.back') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreating">
              {{ isCreating ? t('setup.creating') : t('setup.create') }}
            </button>
          </div>
        </form>
      </section>

      <!-- Step 3: try it -->
      <section v-else class="mt-12">
        <h1 class="text-[2rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.readyTitle') }}</h1>
        <p class="mt-2 text-ink-soft">{{ t('setup.readyText') }}</p>

        <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div class="h-[28rem] overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-wash">
            <AgentChat v-if="agent.publicKey" :public-key="agent.publicKey"></AgentChat>
          </div>

          <div class="flex flex-col gap-6">
            <CopyField v-if="agent.publicKey" :label="t('common.chatLink')" :value="link"></CopyField>
            <div v-if="agent.missing.length" class="notice">
              <PhListChecks :size="20" class="shrink-0 text-attention" aria-hidden="true"></PhListChecks>
              <div class="min-w-0">
                <p class="font-semibold">{{ t('setup.stillToFill') }}</p>
                <ul class="mt-1 list-disc pl-5 text-ink-soft">
                  <li v-for="item in agent.missing" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <router-link to="/agent" class="btn btn-primary">{{ t('setup.finish') }}</router-link>
              <router-link to="/home" class="btn btn-quiet">{{ t('common.goHome') }}</router-link>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhCheck, PhCheckCircle, PhCircle, PhListChecks } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import CopyField from '../../components/ui/CopyField.vue';
import LanguageSwitch from '../../components/ui/LanguageSwitch.vue';
import AgentChat from '../../components/chat/AgentChat.vue';
import { SERVICES, serviceLabel, serviceDescription, chatLink } from '../../lib/presets.js';
import { formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();

const step = ref(0);
const presetId = ref('shop'); // the one live service, chosen from the start
const businessName = ref('');
const agentName = ref('');
const agentNameEdited = ref(false);
const address = ref('');
const fieldErrors = ref({});
const formError = ref(null);
const isCreating = ref(false);

const steps = computed(() => [t('setup.stepChoose'), t('setup.stepDetails'), t('setup.stepTry')]);
const link = computed(() => chatLink(agent.publicKey));

function suggestedName() {
  return businessName.value ? t('setup.suggestedName', { name: businessName.value }) : '';
}

// The agent's name follows the business name until the owner types their own.
function onBusinessInput() {
  if (!agentNameEdited.value) agentName.value = suggestedName();
}

async function create() {
  fieldErrors.value = {};
  formError.value = null;
  if (!businessName.value) {
    fieldErrors.value = { business_name: t('setup.enterBusinessName') };
    return;
  }
  if (!agentName.value) {
    fieldErrors.value = { name: t('setup.enterAgentName') };
    return;
  }

  isCreating.value = true;
  try {
    await agent.create({
      preset: presetId.value,
      config: {
        business_name: businessName.value,
        name: agentName.value,
        knowledge: address.value ? { address: address.value } : {},
      },
    });
    step.value = 2;
  } catch (error) {
    formError.value = error.message;
    if (error.fields) fieldErrors.value = error.fields;
  }
  isCreating.value = false;
}

function signOut() {
  auth.logout();
  router.replace('/sign-in');
}

// An agent already exists: this wizard is only for the first run.
async function start() {
  try {
    await agent.load();
  } catch (error) {
    formError.value = error.message;
    return;
  }
  if (agent.hasAgent) {
    router.replace('/agent');
    return;
  }
  businessName.value = auth.business?.name ?? '';
  agentName.value = suggestedName();
}

start();
</script>
