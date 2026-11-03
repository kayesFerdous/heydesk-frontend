<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <!-- On or off: off until the owner turns it on (backend D89). -->
    <SettingsGroup :title="t('callSettings.title')" :tip="t('callSettings.text')">
      <div class="flex items-center justify-between gap-4">
        <label class="text-sm font-medium" for="calls-enabled">{{ t('callSettings.enabled') }}</label>
        <ToggleSwitch id="calls-enabled" v-model="form.calls.enabled" :label="t('callSettings.enabled')"></ToggleSwitch>
      </div>
      <p v-if="!form.calls.enabled" class="hint !mt-0">{{ t('callSettings.enabledHint') }}</p>
    </SettingsGroup>

    <template v-if="form.calls.enabled">
      <SettingsGroup :title="t('callSettings.whenTitle')" :tip="t('callSettings.whenText')">
        <div class="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel html-for="calls-wait">{{ t('callSettings.wait') }}</FieldLabel>
            <input id="calls-wait" v-model.number="form.calls.wait_minutes" class="field" :class="{ 'field-invalid': errors['calls.wait_minutes'] }" type="number" min="0" max="240" inputmode="numeric" />
          </div>
          <div>
            <FieldLabel html-for="calls-start">{{ t('callSettings.start') }}</FieldLabel>
            <input id="calls-start" v-model="form.calls.start" class="field" :class="{ 'field-invalid': errors.calls }" type="time" />
          </div>
          <div>
            <FieldLabel html-for="calls-end">{{ t('callSettings.end') }}</FieldLabel>
            <input id="calls-end" v-model="form.calls.end" class="field" :class="{ 'field-invalid': errors.calls }" type="time" />
          </div>
        </div>
        <p v-if="errors.calls" class="error-text">{{ errors.calls }}</p>
      </SettingsGroup>

      <SettingsGroup :title="t('callSettings.triesTitle')" :tip="t('callSettings.triesText')">
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel html-for="calls-tries">{{ t('callSettings.tries') }}</FieldLabel>
            <select id="calls-tries" v-model.number="form.calls.tries" class="field">
              <option v-for="n in 5" :key="n" :value="n">{{ formatNumber(n) }}</option>
            </select>
          </div>
          <div>
            <FieldLabel html-for="calls-retry">{{ t('callSettings.retry') }}</FieldLabel>
            <input id="calls-retry" v-model.number="form.calls.retry_minutes" class="field" :class="{ 'field-invalid': errors['calls.retry_minutes'] }" type="number" min="1" max="1440" inputmode="numeric" />
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup :title="t('callSettings.openingTitle')" :tip="t('callSettings.openingText')">
        <div>
          <FieldLabel html-for="calls-opening">{{ t('callSettings.opening') }}</FieldLabel>
          <TagField id="calls-opening" v-model="form.calls.opening" :label="t('callSettings.opening')" :tags="tags" :invalid="!!errors['calls.opening']"></TagField>
          <p v-if="errors['calls.opening']" class="error-text">{{ errors['calls.opening'] }}</p>
          <p class="hint">{{ t('callSettings.openingHint') }}</p>
        </div>
        <div class="panel p-4 text-sm">
          <p class="text-xs font-medium text-ink-soft">{{ t('callSettings.preview') }}</p>
          <p class="mt-1 leading-relaxed">{{ preview }}</p>
        </div>
      </SettingsGroup>

      <SettingsGroup :title="t('callSettings.phoneTitle')" :tip="t('callSettings.phoneText')">
        <CopyField :label="t('callSettings.phoneLink')" :value="phone"></CopyField>
        <a :href="phone" target="_blank" rel="noopener" class="btn btn-quiet btn-sm -ml-3 self-start">
          <PhArrowSquareOut :size="16"></PhArrowSquareOut>
          {{ t('callSettings.openPhone') }}
        </a>
      </SettingsGroup>
    </template>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import ToggleSwitch from '../../components/ui/ToggleSwitch.vue';
import CopyField from '../../components/ui/CopyField.vue';
import TagField from '../../components/ui/TagField.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { phoneLink } from '../../lib/calls.js';

const { t } = useI18n();
const phone = phoneLink();

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const calls = config.knowledge.calls;
    // The backend sends "10:00:00"; the time field edits "10:00".
    return { calls: { ...calls, start: calls.start.slice(0, 5), end: calls.end.slice(0, 5) }, businessName: config.business_name };
  },
  patchFrom: (f) => ({ knowledge: { calls: { ...f.calls } } }),
});

// The tags the backend fills in on each call, offered in this order.
const tags = computed(() => ['business_name', 'items', 'total', 'code'].map((key) => ({ key, label: t(`tags.${key}`) })));

// The first line as the buyer hears it, for a sample order.
const preview = computed(() =>
  (form.value?.calls.opening ?? '')
    .replaceAll('{business_name}', form.value?.businessName ?? '')
    .replaceAll('{items}', t('callSettings.sampleItems'))
    .replaceAll('{total}', formatMoney(101000))
    .replaceAll('{code}', 'O-104'),
);
</script>
