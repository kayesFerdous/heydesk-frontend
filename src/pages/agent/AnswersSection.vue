<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <form-problems :message="saveError" :problems="problems"></form-problems>

    <div class="flex flex-col gap-5">
      <div>
        <h2 class="section-title">How your agent should sound</h2>
        <p class="mt-1 text-sm text-ink-soft">Tone, rules, anything it should always say or never say.</p>
      </div>
      <div>
        <label class="label" for="notes">Notes for your agent</label>
        <textarea
          id="notes"
          v-model="form.notes"
          class="field"
          :class="{ 'field-invalid': errors.notes }"
          rows="5"
          maxlength="4000"
          placeholder="Be warm and brief. Never promise a time we have not confirmed."
        ></textarea>
        <p class="hint">{{ form.notes.length }} of 4,000 characters</p>
      </div>
    </div>

    <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
      <div>
        <h2 class="section-title">Questions customers ask</h2>
        <p class="mt-1 text-sm text-ink-soft">Write each question with its answer. Your agent uses these to reply in its own words.</p>
      </div>
      <div>
        <label class="label" for="faq">Questions and answers</label>
        <textarea
          id="faq"
          v-model="form.faq"
          class="field"
          :class="{ 'field-invalid': errors.faq }"
          rows="10"
          placeholder="Is there parking? There is a public car park two minutes away."
        ></textarea>
      </div>
      <p class="flex items-start gap-2 text-sm text-ink-soft">
        <ph-books :size="18" class="mt-px shrink-0 text-ink-faint"></ph-books>
        <span>
          Longer material, like a price list or a policy document, goes in
          <router-link to="/knowledge" class="link">Knowledge</router-link>.
        </span>
      </p>
    </div>

    <save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></save-bar>
    <div class="h-8"></div>
  </form>
</template>

<script>
import { PhBooks } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import agentSection from '../../mixins/agentSection.js';

export default {
  components: { FormProblems, SaveBar, PhBooks },
  mixins: [agentSection],
  methods: {
    formFrom(config) {
      return { notes: config.notes || '', faq: config.faq || '' };
    },
    patchFrom(form) {
      return { notes: form.notes, faq: form.faq };
    },
  },
};
</script>
