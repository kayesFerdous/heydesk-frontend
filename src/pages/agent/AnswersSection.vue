<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

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

    <!-- A list of short texts (a shop's saved replies): one box each, added and removed here. -->
    <SettingsGroup v-for="field in listFields" :key="field.key" :title="field.label" :tip="field.help">
      <ul v-if="form.lists[field.key].length" class="flex flex-col gap-2">
        <li v-for="(item, i) in form.lists[field.key]" :key="i">
          <div class="flex items-start gap-2">
            <textarea
              :id="`k-${field.key}-${i}`"
              v-model="form.lists[field.key][i]"
              class="field max-h-40 min-h-9 !py-1.5 [field-sizing:content]"
              :class="{ 'field-invalid': errors[`${field.key}.${i}`] }"
              rows="1"
              :maxlength="field.itemMax"
              :aria-label="t('profile.list.item', { label: field.label, n: formatNumber(i + 1) })"
            ></textarea>
            <button
              type="button"
              class="btn btn-quiet btn-icon shrink-0"
              :aria-label="t('profile.list.remove', { n: formatNumber(i + 1) })"
              @click="form.lists[field.key].splice(i, 1)"
            >
              <PhTrash :size="16"></PhTrash>
            </button>
          </div>
          <p v-if="errors[`${field.key}.${i}`]" class="error-text">{{ errors[`${field.key}.${i}`] }}</p>
        </li>
      </ul>
      <p v-else class="hint !mt-0">{{ field.empty }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="form.lists[field.key].length >= field.max"
          @click="addItem(field)"
        >
          <PhPlus :size="14" weight="bold"></PhPlus>
          {{ t('profile.list.add') }}
        </button>
        <span v-if="form.lists[field.key].length" class="text-[0.8125rem] text-ink-soft">
          {{ t('profile.list.count', { n: formatNumber(form.lists[field.key].length), max: formatNumber(field.max) }) }}
        </span>
      </div>
      <p v-if="errors[field.key]" class="error-text">{{ errors[field.key] }}</p>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhPlus, PhTrash } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { formatNumber } from '../../lib/format.js';

const { t, te } = useI18n();
const agent = useAgentStore();

// A desk's lists of short texts (a shop's saved_replies), from its schema.
const listFields = computed(() => {
  const properties = agent.preset?.knowledge_schema.properties ?? {};
  return Object.keys(properties)
    .filter((key) => properties[key].type === 'array' && properties[key].items?.type === 'string')
    .map((key) => {
      const words = (name) => (te(`profile.fields.${key}.${name}`, 'en') ? t(`profile.fields.${key}.${name}`) : '');
      return {
        key,
        label: words('label') || properties[key].title || key,
        help: words('help'),
        empty: words('empty'),
        default: properties[key].default,
        max: properties[key].maxItems,
        itemMax: properties[key].items.maxLength,
      };
    });
});

// A new empty box at the end of a list, with the cursor in it.
async function addItem(field) {
  form.value.lists[field.key].push('');
  await nextTick();
  document.getElementById(`k-${field.key}-${form.value.lists[field.key].length - 1}`)?.focus();
}

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const lists = {};
    listFields.value.forEach((field) => (lists[field.key] = [...(config.knowledge[field.key] ?? field.default ?? [])]));
    return { faq: config.faq || '', lists };
  },
  // A list drops its empty boxes.
  patchFrom: (f) => {
    const knowledge = {};
    listFields.value.forEach((field) => (knowledge[field.key] = f.lists[field.key].map((item) => item.trim()).filter(Boolean)));
    return { faq: f.faq, knowledge };
  },
});

// The preset (and so the lists) can arrive after the config.
watch(
  () => agent.preset,
  () => {
    if (!isDirty.value && agent.config) resetForm();
  },
);
</script>
