<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

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

    <SettingsGroup :title="t('answers.faqTitle')" :tip="t('answers.faqText')">
      <div>
        <FieldLabel html-for="faq">
          {{ t('answers.faq') }}
          <template #end>
            <i18n-t keypath="answers.longer" tag="span" scope="global">
              <template #knowledge><router-link to="/knowledge" class="link">{{ t('nav.knowledge') }}</router-link></template>
            </i18n-t>
          </template>
        </FieldLabel>
        <textarea
          id="faq"
          v-model="form.faq"
          class="field"
          :class="{ 'field-invalid': errors.faq }"
          rows="10"
          :placeholder="t('answers.faqPlaceholder')"
        ></textarea>
        <p v-if="errors.faq" class="error-text">{{ errors.faq }}</p>
      </div>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { formatNumber } from '../../lib/format.js';

const { t } = useI18n();
const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => ({ notes: config.notes || '', faq: config.faq || '' }),
  patchFrom: (form) => ({ notes: form.notes, faq: form.faq }),
});
</script>
