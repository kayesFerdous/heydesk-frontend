<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <div v-if="hasHours">
      <h2 class="section-title">{{ t('hours.title') }}</h2>
      <p class="mt-1 mb-4 text-sm text-ink-soft">{{ t('hours.text') }}</p>
      <HoursEditor v-model="form.hours"></HoursEditor>
    </div>

    <div class="flex flex-col gap-5" :class="{ 'mt-10 border-t border-hairline pt-8': hasHours }">
      <div>
        <h2 class="section-title">{{ t('hours.handoffTitle') }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ t('hours.handoffText') }}</p>
      </div>
      <div>
        <label class="label" for="handoff-message">{{ t('hours.handoffMessage') }}</label>
        <input id="handoff-message" v-model="form.handoff.message" class="field" :class="{ 'field-invalid': errors['handoff.message'] }" type="text" />
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class="label" for="handoff-phone">{{ t('common.phone') }}</label>
          <input id="handoff-phone" v-model.trim="form.handoff.phone" class="field" :class="{ 'field-invalid': errors['handoff.phone'] }" type="tel" autocomplete="off" placeholder="01712 345678" />
        </div>
        <div>
          <label class="label" for="handoff-email">{{ t('common.email') }}</label>
          <input id="handoff-email" v-model.trim="form.handoff.email" class="field" :class="{ 'field-invalid': errors['handoff.email'] }" type="email" autocomplete="off" />
        </div>
      </div>
      <p class="-mt-2 text-[0.8125rem] text-ink-soft">{{ t('hours.oneIsEnough') }}</p>
    </div>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import HoursEditor from '../../components/agent/HoursEditor.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { normalizeHours, DAYS } from '../../lib/hours.js';
import { useAgentStore } from '../../stores/agent.js';

const { t } = useI18n();
const agent = useAgentStore();

// Only a desk whose schema has hours (not every kind of business keeps them).
const hasHours = computed(() => 'hours' in (agent.preset?.knowledge_schema.properties ?? {}));

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => ({
    hours: normalizeHours(config.knowledge.hours),
    handoff: {
      message: config.handoff.message,
      phone: config.handoff.phone || '',
      email: config.handoff.email || '',
    },
  }),
  // Closed days go to the API as null; empty contact fields as null.
  patchFrom: (form) => {
    const patch = {
      handoff: {
        message: form.handoff.message,
        phone: form.handoff.phone || null,
        email: form.handoff.email || null,
      },
    };
    if (hasHours.value) {
      const hours = {};
      DAYS.forEach((key) => (hours[key] = form.hours[key]));
      patch.knowledge = { hours };
    }
    return patch;
  },
});
</script>
