<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <SettingsGroup :title="t('profile.nameAndGreeting')">
      <div>
        <FieldLabel html-for="agent-name">{{ t('profile.agentName') }}</FieldLabel>
        <input id="agent-name" v-model.trim="form.name" class="field max-w-sm" :class="{ 'field-invalid': errors.name }" type="text" />
        <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
      </div>
      <div>
        <FieldLabel html-for="greeting" :tip="t('profile.greetingHint', { placeholder: '{business_name}' })">{{ t('profile.greeting') }}</FieldLabel>
        <textarea id="greeting" v-model="form.greeting" class="field" :class="{ 'field-invalid': errors.greeting }" rows="2"></textarea>
        <p v-if="errors.greeting" class="error-text">{{ errors.greeting }}</p>
        <!-- The {business_name} placeholder is a system word: show what it becomes. -->
        <p v-else-if="greetingPreview" class="hint">{{ t('profile.greetingPreview', { text: greetingPreview }) }}</p>
      </div>
    </SettingsGroup>

    <SettingsGroup :title="t('answers.soundTitle')" :tip="t('answers.soundText')">
      <div>
        <FieldLabel html-for="notes">
          {{ t('answers.notes') }}
          <template #end>{{ t('answers.characters', { n: formatNumber(form.notes.length), max: formatNumber(4000) }) }}</template>
        </FieldLabel>
        <textarea
          id="notes"
          v-model="form.notes"
          class="field"
          :class="{ 'field-invalid': errors.notes }"
          rows="5"
          maxlength="4000"
          :placeholder="t('answers.notesPlaceholder')"
        ></textarea>
        <p v-if="errors.notes" class="error-text">{{ errors.notes }}</p>
      </div>
    </SettingsGroup>

    <SettingsGroup :title="t('hours.handoffTitle')" :tip="t('hours.handoffText')">
      <div>
        <FieldLabel html-for="handoff-message">{{ t('hours.handoffMessage') }}</FieldLabel>
        <input id="handoff-message" v-model="form.handoff.message" class="field" :class="{ 'field-invalid': errors['handoff.message'] }" type="text" />
        <p v-if="errors['handoff.message']" class="error-text">{{ errors['handoff.message'] }}</p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel html-for="handoff-phone" :tip="t('hours.oneIsEnough')">{{ t('common.phone') }}</FieldLabel>
          <input id="handoff-phone" v-model.trim="form.handoff.phone" class="field" :class="{ 'field-invalid': errors['handoff.phone'] }" type="tel" autocomplete="off" placeholder="01712 345678" />
          <p v-if="errors['handoff.phone']" class="error-text">{{ errors['handoff.phone'] }}</p>
        </div>
        <div>
          <FieldLabel html-for="handoff-email" :tip="t('hours.oneIsEnough')">{{ t('common.email') }}</FieldLabel>
          <input id="handoff-email" v-model.trim="form.handoff.email" class="field" :class="{ 'field-invalid': errors['handoff.email'] }" type="email" autocomplete="off" />
          <p v-if="errors['handoff.email']" class="error-text">{{ errors['handoff.email'] }}</p>
        </div>
      </div>
    </SettingsGroup>

    <!-- What the agent does is fixed per kind of business; shown, not edited. -->
    <SettingsGroup :title="t('profile.canDo')" :tip="t('profile.canDoText')">
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="job in agent.jobs"
          :key="job"
          class="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-wash py-1.5 pr-2 pl-3 text-sm font-medium"
        >
          <PhCheckCircle :size="16" weight="fill" class="shrink-0 text-brand"></PhCheckCircle>
          {{ t(`jobs.${agent.kind}.${job}.label`) }}
          <InfoTip :text="t(`jobs.${agent.kind}.${job}.text`)" :label="t(`jobs.${agent.kind}.${job}.label`)"></InfoTip>
        </li>
      </ul>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import InfoTip from '../../components/ui/InfoTip.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { formatNumber } from '../../lib/format.js';

// How the agent talks to customers: its name, its first words, its tone, and
// what it says when a customer needs a person.
const { t } = useI18n();
const agent = useAgentStore();

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => ({
    name: config.name,
    greeting: config.greeting,
    notes: config.notes || '',
    handoff: {
      message: config.handoff.message,
      phone: config.handoff.phone || '',
      email: config.handoff.email || '',
    },
  }),
  // Empty contact fields go to the API as null.
  patchFrom: (f) => ({
    name: f.name,
    greeting: f.greeting,
    notes: f.notes,
    handoff: {
      message: f.handoff.message,
      phone: f.handoff.phone || null,
      email: f.handoff.email || null,
      // Who gets a hand-off is chosen on the Team page (backend I1); keep it as it is.
      auto_assign: Boolean(agent.config?.handoff.auto_assign),
    },
  }),
  // The page's chat preview shows the name and greeting as they are typed.
  previewFrom: (f) => ({ name: f.name, greeting: f.greeting }),
});

// The greeting as a customer reads it, when it uses the placeholder.
const greetingPreview = computed(() => {
  const greeting = form.value?.greeting ?? '';
  if (!greeting.includes('{business_name}')) return '';
  return greeting.replaceAll('{business_name}', agent.config?.business_name || t('common.businessName'));
});
</script>
