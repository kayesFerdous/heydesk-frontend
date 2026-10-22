<template>
  <!-- The chat bubble on the business's own website (backend D82): how it
       looks, what it says first, and the one line to paste. The preview
       follows the form as it is edited, before Save. -->
  <form v-if="form" novalidate @submit.prevent="save">
    <FormProblems :message="saveError" :problems="problems"></FormProblems>

    <!-- Wide screens show this preview beside the form instead (AgentPage). -->
    <SettingsGroup :title="t('bubble.preview')" :tip="t('bubble.previewTip')" class="xl:hidden">
      <BubblePreview
        :colour="form.colour"
        :side="form.side"
        :nudge="form.nudge"
        :starters="form.starters"
        :logo="logo"
        :name="agent.config.name"
        :greeting="greeting"
      ></BubblePreview>
    </SettingsGroup>

    <SettingsGroup :title="t('bubble.look')" class="xl:border-t-0 xl:pt-2">
      <div>
        <p class="label">{{ t('bubble.colour') }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="swatch in SWATCHES"
            :key="swatch"
            type="button"
            class="grid h-8 w-8 place-items-center rounded-full ring-offset-2 transition-shadow duration-200"
            :class="form.colour.toLowerCase() === swatch ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line-strong'"
            :style="{ background: swatch }"
            :aria-label="swatch"
            :aria-pressed="form.colour.toLowerCase() === swatch ? 'true' : 'false'"
            @click="form.colour = swatch"
          >
            <PhCheck v-if="form.colour.toLowerCase() === swatch" :size="14" weight="bold" class="text-white"></PhCheck>
          </button>
          <label class="relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-dashed border-line-strong text-ink-soft hover:text-ink" :title="t('bubble.otherColour')">
            <span class="sr-only">{{ t('bubble.otherColour') }}</span>
            <PhEyedropper :size="15"></PhEyedropper>
            <input v-model="form.colour" type="color" class="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <input
            v-model.trim="form.colour"
            class="field !h-8 !w-28 text-sm tabular-nums"
            :class="{ 'field-invalid': errors['widget.colour'] }"
            type="text"
            maxlength="7"
            :aria-label="t('bubble.colourCode')"
          />
        </div>
        <p v-if="errors['widget.colour']" class="error-text">{{ t('bubble.badColour') }}</p>
      </div>

      <div>
        <p class="label">{{ t('bubble.side') }}</p>
        <div class="segmented" role="radiogroup" :aria-label="t('bubble.side')">
          <button
            v-for="side in ['left', 'right']"
            :key="side"
            type="button"
            role="radio"
            class="segment"
            :class="{ 'segment-active': form.side === side }"
            :aria-checked="form.side === side ? 'true' : 'false'"
            @click="form.side = side"
          >
            {{ t(`bubble.${side}`) }}
          </button>
        </div>
      </div>

      <div>
        <p class="label">{{ t('bubble.logo') }}</p>
        <div class="flex items-center gap-3">
          <img v-if="logo" :src="logo" alt="" class="h-12 w-12 rounded-full object-cover ring-1 ring-hairline" />
          <span v-else class="grid h-12 w-12 place-items-center rounded-full bg-wash text-ink-faint ring-1 ring-hairline">
            <PhImage :size="20"></PhImage>
          </span>
          <label class="btn btn-secondary btn-sm cursor-pointer" :class="{ 'pointer-events-none opacity-50': uploading }">
            <PhUploadSimple :size="14" weight="bold"></PhUploadSimple>
            {{ uploading ? t('bubble.uploading') : logo ? t('bubble.changeLogo') : t('bubble.addLogo') }}
            <input type="file" accept="image/*" class="sr-only" :disabled="uploading" @change="pickLogo" />
          </label>
          <button v-if="logo" type="button" class="btn btn-quiet btn-sm" :disabled="uploading" @click="removeLogo">
            {{ t('bubble.removeLogo') }}
          </button>
        </div>
        <p class="hint mt-1.5">{{ t('bubble.logoHint') }}</p>
        <p v-if="logoError" class="error-text">{{ logoError }}</p>
      </div>
    </SettingsGroup>

    <SettingsGroup :title="t('bubble.firstWords')">
      <div>
        <FieldLabel html-for="nudge" :tip="t('bubble.nudgeTip')">{{ t('bubble.nudge') }}</FieldLabel>
        <input id="nudge" v-model="form.nudge" class="field" :class="{ 'field-invalid': errors['widget.nudge'] }" type="text" maxlength="120" :placeholder="t('bubble.nudgeEmpty')" />
        <p v-if="errors['widget.nudge']" class="error-text">{{ errors['widget.nudge'] }}</p>
      </div>

      <div>
        <FieldLabel html-for="starter-0" :tip="t('bubble.startersTip')">{{ t('bubble.starters') }}</FieldLabel>
        <div class="flex flex-col gap-2">
          <div v-for="(starter, i) in form.starters" :key="i" class="flex gap-2">
            <input :id="`starter-${i}`" v-model="form.starters[i]" class="field" type="text" maxlength="60" />
            <button type="button" class="btn btn-quiet btn-icon shrink-0" :aria-label="t('bubble.removeStarter')" @click="form.starters.splice(i, 1)">
              <PhTrash :size="16"></PhTrash>
            </button>
          </div>
        </div>
        <button v-if="form.starters.length < MAX_STARTERS" type="button" class="btn btn-quiet btn-sm mt-2 -ml-3" @click="form.starters.push('')">
          <PhPlus :size="14" weight="bold"></PhPlus>
          {{ t('bubble.addStarter') }}
        </button>
        <p v-if="errors['widget.starters']" class="error-text">{{ errors['widget.starters'] }}</p>
      </div>
    </SettingsGroup>

    <SettingsGroup :title="t('bubble.addToSite')" :tip="t('bubble.addToSiteTip')">
      <CopyField :label="t('bubble.code')" :value="snippet"></CopyField>
      <ol class="space-y-2 text-sm leading-relaxed text-ink-soft">
        <li v-for="site in ['wordpress', 'wix', 'shopify']" :key="site">
          <span class="font-semibold text-ink">{{ t(`bubble.${site}.name`) }}:</span> {{ t(`bubble.${site}.how`) }}
        </li>
      </ol>
      <p class="hint">{{ t('bubble.savedFirst') }}</p>
    </SettingsGroup>

    <SaveBar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></SaveBar>
    <div class="h-8"></div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheck, PhEyedropper, PhImage, PhPlus, PhTrash, PhUploadSimple } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import FieldLabel from '../../components/ui/FieldLabel.vue';
import CopyField from '../../components/ui/CopyField.vue';
import BubblePreview from '../../components/agent/BubblePreview.vue';
import { useAgentSection } from '../../composables/useAgentSection.js';
import { useAgentStore } from '../../stores/agent.js';
import { SWATCHES } from '../../lib/colour.js';

const MAX_STARTERS = 4; // the backend takes up to 4 (D82)

const { t } = useI18n();
const agent = useAgentStore();

const uploading = ref(false);
const logoError = ref(null);

// The logo isn't in the form: it is saved the moment it is picked.
const logo = computed(() => agent.config?.widget?.logo || '');
// The greeting as the customer sees it, with the business's name in it.
const greeting = computed(() => (agent.config?.greeting || '').replaceAll('{business_name}', agent.config?.business_name || ''));

// Where this app runs is where widget.js is served from.
const snippet = computed(() => {
  const base = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
  return `<script src="${base}/widget.js" data-agent="${agent.publicKey}" async><` + '/script>';
});

const { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm } = useAgentSection({
  formFrom: (config) => {
    const w = config.widget || {};
    return { colour: w.colour || SWATCHES[0], side: w.side || 'right', nudge: w.nudge ?? '', starters: [...(w.starters || [])] };
  },
  patchFrom: (f) => ({
    widget: { ...f, starters: f.starters.map((s) => s.trim()).filter(Boolean), logo: logo.value },
  }),
  previewFrom: (f) => ({ colour: f.colour, side: f.side, nudge: f.nudge, starters: [...f.starters] }),
});

async function pickLogo(event) {
  const file = event.target.files[0];
  event.target.value = ''; // the same file can be picked again
  if (!file) return;
  uploading.value = true;
  logoError.value = null;
  try {
    await agent.saveLogo(file);
  } catch (error) {
    logoError.value = error.message;
  }
  uploading.value = false;
}

// Back to the initials: saves the widget as it was saved, without the logo.
async function removeLogo() {
  logoError.value = null;
  try {
    await agent.save({ widget: { ...agent.config.widget, logo: '' } });
  } catch (error) {
    logoError.value = error.message;
  }
}
</script>
