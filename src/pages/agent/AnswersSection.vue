<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <div class="flex flex-col gap-5">
      <div>
        <h2 class="section-title">{{ t('answers.soundTitle') }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ t('answers.soundText') }}</p>
      </div>
      <div>
        <label class="label" for="notes">{{ t('answers.notes') }}</label>
        <textarea
          id="notes"
          v-model="form.notes"
          class="field"
          :class="{ 'field-invalid': errors.notes }"
          rows="5"
          maxlength="4000"
          :placeholder="t('answers.notesPlaceholder')"
        ></textarea>
        <p class="hint">{{ t('answers.characters', { n: formatNumber(form.notes.length), max: formatNumber(4000) }) }}</p>
      </div>
    </div>

    <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
      <div>
        <h2 class="section-title">{{ t('answers.faqTitle') }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ t('answers.faqText') }}</p>
      </div>
      <div>
        <label class="label" for="faq">{{ t('answers.faq') }}</label>
        <textarea
          id="faq"
          v-model="form.faq"
          class="field"
          :class="{ 'field-invalid': errors.faq }"
          rows="10"
          :placeholder="t('answers.faqPlaceholder')"
        ></textarea>
      </div>
      <p class="flex items-start gap-2 text-sm text-ink-soft">
        <PhBooks :size="18" class="mt-px shrink-0 text-ink-faint"></PhBooks>
        <i18n-t keypath="answers.longer" tag="span" scope="global">
          <template #knowledge><router-link to="/knowledge" class="link">{{ t('nav.knowledge') }}</router-link></template>
        </i18n-t>
      </p>
    </div>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { PhBooks } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { formatNumber } from '../../lib/format.js';

const { t } = useI18n();
const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => ({ notes: config.notes || '', faq: config.faq || '' }),
  patchFrom: (form) => ({ notes: form.notes, faq: form.faq }),
});
</script>
