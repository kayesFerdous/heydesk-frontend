<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <SettingsGroup v-if="hasHours" :title="t('hours.title')" :tip="t('hours.text')">
      <HoursEditor v-model="form.hours"></HoursEditor>
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

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
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
        // Who gets a hand-off is chosen on the Team page (backend I1); keep it as it is.
        auto_assign: Boolean(agent.config?.handoff.auto_assign),
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
