<template>
  <div class="flex min-h-dvh flex-col bg-surface">
    <header class="flex items-center justify-between border-b border-hairline px-5 py-4 sm:px-10">
      <BrandMark></BrandMark>
      <div class="flex items-center gap-2">
        <LanguageSwitch></LanguageSwitch>
        <button type="button" class="btn btn-quiet btn-sm" @click="signOut">
          {{ t('common.signOut') }}
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-16 sm:px-10">
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
              :class="index <= step ? 'bg-brand text-white' : 'bg-hover text-ink-soft'"
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
        <h1 class="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.chooseTitle') }}</h1>
        <p class="mt-2 text-ink-soft">{{ t('setup.chooseText') }}</p>

        <p v-if="loadError" class="mt-8 text-sm text-danger" role="alert">
          {{ loadError }}
          <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="loadPresets">
            {{ t('common.tryAgain') }}
          </button>
        </p>

        <!-- The kinds of agent, as ruled rows: one line each, chosen like a radio. -->
        <div v-else class="mt-8 border-t border-line-strong" role="radiogroup" :aria-label="t('setup.kind')">
          <button
            v-for="preset in presets"
            :key="preset.id"
            type="button"
            role="radio"
            :aria-checked="preset.id === presetId"
            class="row flex w-full items-center gap-4 px-2 py-4 text-left sm:px-3"
            :class="{ 'row-selected': preset.id === presetId }"
            @click="presetId = preset.id"
          >
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
              <component :is="presetIcon(preset.id)" :size="22"></component>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">{{ presetLabel(preset) }}</span>
              <span class="mt-0.5 block text-sm text-ink-soft">{{ presetDescription(preset) }}</span>
            </span>
            <PhCheckCircle v-if="preset.id === presetId" :size="22" weight="fill" class="shrink-0 text-brand" aria-hidden="true"></PhCheckCircle>
            <PhCircle v-else :size="22" class="shrink-0 text-line-strong" aria-hidden="true"></PhCircle>
          </button>
        </div>

        <div class="mt-10 flex items-center justify-between">
          <p class="text-sm text-ink-soft">{{ t('setup.liveSoon') }}</p>
          <button type="button" class="btn btn-primary" :disabled="!presetId" @click="step = 1">
            {{ t('common.continue') }}
          </button>
        </div>
      </section>

      <!-- Step 2: details -->
      <section v-else-if="step === 1" class="mt-12">
        <h1 class="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.detailsTitle') }}</h1>
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
        <h1 class="text-[1.625rem] leading-tight font-semibold tracking-[-0.025em]">{{ t('setup.readyTitle') }}</h1>
        <p class="mt-2 text-ink-soft">{{ t('setup.readyText') }}</p>

        <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div class="h-[28rem] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-wash">
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
import { presetIcon, presetLabel, presetDescription, chatLink } from '../../lib/presets.js';
import { formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();

const step = ref(0);
const presetId = ref(null);
const businessName = ref('');
const agentName = ref('');
const agentNameEdited = ref(false);
const address = ref('');
const fieldErrors = ref({});
const formError = ref(null);
const loadError = ref(null);
const isCreating = ref(false);

const steps = computed(() => [t('setup.stepChoose'), t('setup.stepDetails'), t('setup.stepTry')]);
// Most common first; a preset the frontend has not heard of goes last.
const presets = computed(() => {
  const order = ['restaurant', 'shop', 'receptionist', 'clinic'];
  const rank = (p) => (order.includes(p.id) ? order.indexOf(p.id) : order.length);
  return [...agent.presets].sort((a, b) => rank(a) - rank(b));
});
const link = computed(() => chatLink(agent.publicKey));

async function loadPresets() {
  loadError.value = null;
  try {
    await agent.loadPresets();
  } catch (error) {
    loadError.value = error.message;
  }
}

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
    loadError.value = error.message;
    return;
  }
  if (agent.hasAgent) {
    router.replace('/agent');
    return;
  }
  businessName.value = auth.business?.name ?? '';
  agentName.value = suggestedName();
  loadPresets();
}

start();
</script>
